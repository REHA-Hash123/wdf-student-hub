<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_role('admin');

if (session_status() !== PHP_SESSION_ACTIVE) session_start();
if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
function e($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

const POSTER_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const POSTER_MIMES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$uploadDir = __DIR__ . '/uploads/event-posters';
$uploadWeb = 'uploads/event-posters';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    http_response_code(500); exit('Could not create the event poster upload directory.');
}
// Prevent direct script execution from this upload directory on Apache.
$htaccess = $uploadDir . '/.htaccess';
if (!file_exists($htaccess)) file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|php[0-9]*)$\">\n  Require all denied\n</FilesMatch>\n");

function poster_upload(array $file, string $uploadDir, string $uploadWeb): ?string {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) throw new RuntimeException('Poster upload failed. Please try again.');
    if (!isset($file['size']) || (int)$file['size'] < 1 || (int)$file['size'] > POSTER_MAX_BYTES) {
        throw new RuntimeException('Poster must be a non-empty image no larger than 2 MB.');
    }
    if (!is_uploaded_file((string)($file['tmp_name'] ?? ''))) throw new RuntimeException('Invalid upload.');
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file((string)$file['tmp_name']);
    if (!isset(POSTER_MIMES[$mime])) throw new RuntimeException('Only JPG, PNG, and WebP poster images are allowed.');
    $imageInfo = @getimagesize((string)$file['tmp_name']);
    if ($imageInfo === false || ($imageInfo['mime'] ?? '') !== $mime) throw new RuntimeException('The uploaded file is not a valid image.');
    $name = bin2hex(random_bytes(18)) . '.' . POSTER_MIMES[$mime];
    if (!move_uploaded_file((string)$file['tmp_name'], $uploadDir . '/' . $name)) throw new RuntimeException('Could not save the poster.');
    return $uploadWeb . '/' . $name;
}
function remove_poster(?string $path, string $uploadDir, string $uploadWeb): void {
    if (!$path || !str_starts_with($path, $uploadWeb . '/')) return;
    $name = basename($path);
    if ($name !== '' && is_file($uploadDir . '/' . $name)) @unlink($uploadDir . '/' . $name);
}
function clean_text(string $key, int $max): string {
    $v = trim((string)($_POST[$key] ?? ''));
    if ($v === '' || mb_strlen($v) > $max) throw new RuntimeException("Please enter a valid value for " . str_replace('_',' ',$key) . " (maximum $max characters).");
    return $v;
}
$errors = [];
$notice = '';
$form = ['event_id'=>'','title'=>'','category'=>'Workshop','event_date'=>'','event_time'=>'','location'=>'','description'=>'','capacity'=>'0','poster_path'=>''];
$editing = false;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!hash_equals((string)$_SESSION['csrf_token'], (string)($_POST['csrf_token'] ?? ''))) throw new RuntimeException('Security token expired. Refresh the page and try again.');
        $action = (string)($_POST['action'] ?? '');
        if ($action === 'delete') {
            $id = filter_input(INPUT_POST, 'event_id', FILTER_VALIDATE_INT);
            if (!$id || $id < 1) throw new RuntimeException('Invalid event selected.');
            $stmt = $conn->prepare('SELECT poster_path FROM events WHERE event_id=?');
            $stmt->bind_param('i', $id); $stmt->execute(); $old = $stmt->get_result()->fetch_assoc(); $stmt->close();
            if (!$old) throw new RuntimeException('Event not found.');
            $stmt = $conn->prepare('DELETE FROM events WHERE event_id=?'); $stmt->bind_param('i', $id); $stmt->execute(); $stmt->close();
            remove_poster($old['poster_path'] ?? null, $uploadDir, $uploadWeb);
            header('Location: admin-events.php?message=deleted'); exit;
        }
        if ($action === 'save') {
            $id = (int)($_POST['event_id'] ?? 0);
            $title = clean_text('title', 180);
            $category = clean_text('category', 60);
            $date = (string)($_POST['event_date'] ?? '');
            $time = trim((string)($_POST['event_time'] ?? ''));
            $location = clean_text('location', 180);
            $description = clean_text('description', 10000);
            $capacity = filter_var($_POST['capacity'] ?? '0', FILTER_VALIDATE_INT, ['options'=>['min_range'=>0,'max_range'=>1000000]]);
            if (!$capacity && (string)($_POST['capacity'] ?? '') !== '0') throw new RuntimeException('Capacity must be a whole number from 0 to 1,000,000.');
            $d = DateTime::createFromFormat('!Y-m-d', $date);
            if (!$d || $d->format('Y-m-d') !== $date) throw new RuntimeException('Please choose a valid event date.');
            if ($time !== '' && !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) throw new RuntimeException('Please choose a valid event time.');
            $timeDb = $time === '' ? null : $time . ':00';
            $oldPath = null;
            if ($id > 0) {
                $stmt = $conn->prepare('SELECT poster_path FROM events WHERE event_id=?');
                $stmt->bind_param('i', $id); $stmt->execute(); $old = $stmt->get_result()->fetch_assoc(); $stmt->close();
                if (!$old) throw new RuntimeException('Event not found.');
                $oldPath = $old['poster_path'] ?? null;
            }
            $newPath = poster_upload($_FILES['poster'] ?? [], $uploadDir, $uploadWeb);
            $posterPath = $newPath ?? $oldPath;
            if ($id > 0) {
                $stmt = $conn->prepare('UPDATE events SET title=?,category=?,event_date=?,event_time=?,location=?,description=?,capacity=?,poster_path=? WHERE event_id=?');
                $stmt->bind_param('ssssssisi', $title,$category,$date,$timeDb,$location,$description,$capacity,$posterPath,$id);
                $stmt->execute(); $stmt->close();
                if ($newPath) remove_poster($oldPath, $uploadDir, $uploadWeb);
                header('Location: admin-events.php?message=updated'); exit;
            } else {
                $stmt = $conn->prepare('INSERT INTO events (title,category,event_date,event_time,location,description,capacity,poster_path) VALUES (?,?,?,?,?,?,?,?)');
                $stmt->bind_param('ssssssis', $title,$category,$date,$timeDb,$location,$description,$capacity,$posterPath);
                $stmt->execute(); $stmt->close();
                header('Location: admin-events.php?message=created'); exit;
            }
        }
        throw new RuntimeException('Unknown action.');
    }
} catch (Throwable $ex) {
    $errors[] = $ex instanceof mysqli_sql_exception && str_contains(strtolower($ex->getMessage()), 'poster_path')
        ? 'Database is missing the poster_path column. Run the migration in event-management-migration.sql.'
        : $ex->getMessage();
}
if (isset($_GET['edit'])) {
    $id = filter_input(INPUT_GET, 'edit', FILTER_VALIDATE_INT);
    if ($id && $id > 0) {
        $stmt = $conn->prepare('SELECT event_id,title,category,event_date,event_time,location,description,capacity,poster_path FROM events WHERE event_id=?');
        $stmt->bind_param('i',$id); $stmt->execute(); $row=$stmt->get_result()->fetch_assoc(); $stmt->close();
        if ($row) { $form = $row; $form['event_time'] = $form['event_time'] ? substr((string)$form['event_time'],0,5) : ''; $editing=true; }
        else $errors[]='Event not found.';
    }
}
$events = null;
try { $events = $conn->query('SELECT event_id,title,category,event_date,event_time,location,capacity,poster_path,created_at FROM events ORDER BY event_date DESC,event_id DESC'); }
catch (mysqli_sql_exception $ex) { $errors[]='Events could not be loaded. Run event-management-migration.sql to add poster support.'; }
if (isset($_GET['message'])) {
    $messages = ['created'=>'Event created successfully.','updated'=>'Event updated successfully.','deleted'=>'Event deleted successfully.'];
    $notice = $messages[(string)$_GET['message']] ?? '';
}
$adminName = (string)($_SESSION['full_name'] ?? 'Administrator');
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manage Events | Student Hub</title>
<style>
:root{--ink:#172033;--muted:#718096;--line:#e8edf4;--bg:#f5f7fb;--purple:#6254d9;--soft:#efedff;--red:#b42318}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}a{color:inherit;text-decoration:none}.layout{min-height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}aside{background:#fff;border-right:1px solid var(--line);padding:24px 16px}.brand{font-weight:850;font-size:20px;padding:8px 10px 28px;display:block}.brand span{color:var(--purple)}nav{display:grid;gap:6px}nav a{padding:12px;border-radius:10px;color:#68748a;font-size:13px;font-weight:650}nav a:hover,nav a.active{background:var(--soft);color:var(--purple)}.signout{display:block;margin:30px 10px;color:var(--muted);font-size:13px}.main{min-width:0}.top{height:70px;background:white;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px}.muted{color:var(--muted);font-size:13px}.content{max-width:1400px;margin:auto;padding:30px}.head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:22px}.head h1{margin:0 0 7px;font-size:28px}.head p{margin:0;color:var(--muted);font-size:13px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:9px;padding:11px 15px;font-weight:750;font-size:12px;cursor:pointer;background:var(--purple);color:white}.btn.secondary{background:#f0efff;color:var(--purple)}.btn.danger{background:#fff0ed;color:var(--red)}.panel{background:#fff;border:1px solid var(--line);border-radius:15px;margin-bottom:22px;overflow:hidden}.panel-head{padding:20px 22px;border-bottom:1px solid var(--line)}.panel-head h2{margin:0 0 5px;font-size:16px}.panel-head p{margin:0;color:var(--muted);font-size:12px}.formgrid{padding:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.field{display:grid;gap:7px}.field.full{grid-column:1/-1}label{font-size:12px;font-weight:750;color:#475467}input,select,textarea{width:100%;border:1px solid #dce2ec;border-radius:9px;padding:11px 12px;font:inherit;font-size:13px;color:var(--ink);background:white}textarea{min-height:110px;resize:vertical}.help{font-size:11px;color:var(--muted)}.actions{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap}.notice{padding:13px 16px;border-radius:10px;margin-bottom:15px;font-size:13px;background:#e5f7ee;color:#176a4a}.error{background:#fff0ed;color:#9f2d22;padding:13px 16px;border-radius:10px;margin-bottom:10px;font-size:13px}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:850px}th,td{text-align:left;padding:14px 16px;border-bottom:1px solid #edf0f5;font-size:12px}th{font-size:10px;color:#8a95a7;text-transform:uppercase;letter-spacing:.7px;background:#fcfcfe}td{color:#586579}td strong{color:var(--ink)}.poster{width:64px;height:54px;object-fit:cover;border-radius:7px;background:#f0f1f5}.rowactions{display:flex;gap:7px;align-items:center}.rowactions form{margin:0}.empty{text-align:center;padding:35px;color:var(--muted);font-size:13px}
@media(max-width:800px){.layout{grid-template-columns:1fr}aside{padding:12px;border-right:0;border-bottom:1px solid var(--line)}.brand{padding:6px 8px 12px}nav{display:flex;overflow:auto}nav a{white-space:nowrap}.signout{margin:12px 8px}.content{padding:20px 14px}.top{padding:0 15px}.formgrid{grid-template-columns:1fr;padding:16px}.field.full,.actions{grid-column:auto}.head{align-items:flex-start;flex-direction:column}.head h1{font-size:24px}}
</style></head><body><div class="layout"><aside>
<a class="brand" href="admin-dashboard.php">Student<span>Hub</span></a><nav aria-label="Admin navigation">
<a href="admin-dashboard.php">▦ &nbsp; Overview</a><a href="student.php">♙ &nbsp; Manage Students</a><a class="active" href="admin-events.php">▣ &nbsp; Manage Events</a><a href="register.html">＋ &nbsp; Registration Forms</a><a href="about.html">ⓘ &nbsp; About</a></nav><a class="signout" href="logout.php">↪ &nbsp; Sign out</a>
</aside><main class="main"><header class="top"><span class="muted">Workspace / <strong>Manage Events</strong></span><span class="muted"><?= e($adminName) ?> · Administrator</span></header><section class="content">
<div class="head"><div><h1>Event management</h1><p>Create and maintain campus events, details, and poster artwork.</p></div><a class="btn secondary" href="admin-dashboard.php">← Dashboard</a></div>
<?php if ($notice): ?><div class="notice"><?= e($notice) ?></div><?php endif; ?>
<?php foreach ($errors as $error): ?><div class="error"><?= e($error) ?></div><?php endforeach; ?>
<section class="panel"><div class="panel-head"><h2><?= $editing ? 'Update event' : 'Add a new event' ?></h2><p>Poster formats: JPG, PNG, or WebP · Maximum size: 2 MB.</p></div>
<form method="post" enctype="multipart/form-data" class="formgrid">
<input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>"><input type="hidden" name="action" value="save"><input type="hidden" name="event_id" value="<?= e($form['event_id']) ?>">
<div class="field"><label for="title">Event title *</label><input id="title" name="title" maxlength="180" required value="<?= e($form['title']) ?>"></div>
<div class="field"><label for="category">Category *</label><select id="category" name="category" required><?php foreach (['Workshop','Seminar','Career','Cultural','Sports','Competition','Other'] as $cat): ?><option value="<?= e($cat) ?>" <?= $form['category']===$cat?'selected':'' ?>><?= e($cat) ?></option><?php endforeach; ?></select></div>
<div class="field"><label for="event_date">Event date *</label><input id="event_date" type="date" name="event_date" required value="<?= e($form['event_date']) ?>"></div>
<div class="field"><label for="event_time">Event time</label><input id="event_time" type="time" name="event_time" value="<?= e($form['event_time']) ?>"></div>
<div class="field"><label for="location">Location *</label><input id="location" name="location" maxlength="180" required value="<?= e($form['location']) ?>"></div>
<div class="field"><label for="capacity">Capacity (0 = unlimited) *</label><input id="capacity" type="number" name="capacity" min="0" max="1000000" required value="<?= e($form['capacity']) ?>"></div>
<div class="field full"><label for="description">Description *</label><textarea id="description" name="description" maxlength="10000" required><?= e($form['description']) ?></textarea></div>
<div class="field full"><label for="poster">Event poster <?= $editing?'(optional — choose a file to replace current poster)':'(optional)' ?></label><input id="poster" type="file" name="poster" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"><span class="help">Only real JPG/PNG/WebP images are accepted. Maximum 2 MB. SVG and executable files are blocked.</span>
<?php if ($editing && !empty($form['poster_path'])): ?><div class="help">Current poster: <a href="<?= e($form['poster_path']) ?>" target="_blank" rel="noopener">View current poster</a></div><?php endif; ?></div>
<div class="actions"><button class="btn" type="submit"><?= $editing?'Save changes':'Create event' ?></button><?php if ($editing): ?><a class="btn secondary" href="admin-events.php">Cancel edit</a><?php endif; ?></div>
</form></section>
<section class="panel"><div class="panel-head"><h2>All events</h2><p>Review event details, edit events, or delete events that are no longer needed.</p></div>
<?php if ($events && $events->num_rows): ?><div class="tablewrap"><table><thead><tr><th>Poster</th><th>Event</th><th>Date & time</th><th>Location</th><th>Capacity</th><th>Actions</th></tr></thead><tbody>
<?php while ($event=$events->fetch_assoc()): ?><tr><td><?php if (!empty($event['poster_path'])): ?><a href="<?= e($event['poster_path']) ?>" target="_blank" rel="noopener"><img class="poster" src="<?= e($event['poster_path']) ?>" alt="Poster for <?= e($event['title']) ?>"></a><?php else: ?><div class="poster" aria-label="No poster"></div><?php endif; ?></td>
<td><strong><?= e($event['title']) ?></strong><br><span class="muted"><?= e($event['category']) ?></span></td><td><?= e(date('d M Y',strtotime((string)$event['event_date']))) ?><br><span class="muted"><?= e($event['event_time'] ? date('g:i A',strtotime((string)$event['event_time'])) : 'Time TBA') ?></span></td><td><?= e($event['location']) ?></td><td><?= (int)$event['capacity']===0?'Unlimited':number_format((int)$event['capacity']) ?></td><td><div class="rowactions"><a class="btn secondary" href="admin-events.php?edit=<?= (int)$event['event_id'] ?>">Edit</a><form method="post" onsubmit="return confirm('Delete this event? Its registrations will also be removed.');"><input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="event_id" value="<?= (int)$event['event_id'] ?>"><button class="btn danger" type="submit">Delete</button></form></div></td></tr><?php endwhile; ?></tbody></table></div><?php else: ?><div class="empty">No events yet. Use the form above to add your first event.</div><?php endif; ?>
</section><p class="muted">Student Hub · Admin-only area · Poster uploads are validated on the server.</p></section></main></div></body></html>
