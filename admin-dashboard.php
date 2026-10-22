<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_role('admin');

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
function e($value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }

// Summary metrics. Students are counted separately from administrator accounts.
$studentCount = (int)$conn->query("SELECT COUNT(*) FROM students WHERE role = 'student'")->fetch_row()[0];
$adminCount = (int)$conn->query("SELECT COUNT(*) FROM students WHERE role = 'admin'")->fetch_row()[0];
$eventCount = (int)$conn->query('SELECT COUNT(*) FROM events')->fetch_row()[0];
$registrationCount = (int)$conn->query("SELECT COUNT(*) FROM registrations WHERE status = 'registered'")->fetch_row()[0];

$latest = $conn->query("SELECT r.registration_id, r.registered_at, r.status,
       s.full_name, s.email, s.course, e.title AS event_title
    FROM registrations r
    INNER JOIN students s ON s.student_id = r.student_id
    INNER JOIN events e ON e.event_id = r.event_id
    ORDER BY r.registered_at DESC, r.registration_id DESC LIMIT 8");
$initials = strtoupper(substr((string)($_SESSION['full_name'] ?? 'Admin'), 0, 1));
$role = (string)($_SESSION['role'] ?? 'student');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard | Student Hub</title>
<style>
:root{--ink:#172033;--muted:#718096;--line:#e8edf4;--bg:#f5f7fb;--purple:#6254d9;--purple-soft:#efedff;--teal:#168b83;--orange:#d9852a;--blue:#3478d4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}a{color:inherit;text-decoration:none}.layout{min-height:100vh;display:grid;grid-template-columns:248px minmax(0,1fr)}
.sidebar{background:#fff;border-right:1px solid var(--line);padding:26px 16px;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:11px;padding:0 10px 30px;font-weight:800;font-size:20px;letter-spacing:-.5px}.brand-mark{display:grid;place-items:center;background:var(--purple);color:#fff;width:38px;height:38px;border-radius:12px;font-size:19px}.nav-label{font-size:10px;color:#9aa4b5;font-weight:800;letter-spacing:1.5px;padding:0 12px 10px}.nav{display:grid;gap:5px}.nav a{display:flex;align-items:center;gap:12px;padding:12px;border-radius:11px;color:#68748a;font-size:13px;font-weight:650;transition:.15s}.nav a:hover{background:#f5f4ff;color:var(--purple)}.nav a.active{background:var(--purple-soft);color:var(--purple)}.nav .ico{width:22px;text-align:center;font-size:16px}.side-bottom{margin-top:auto;border-top:1px solid var(--line);padding:18px 8px 0}.side-bottom a{font-size:13px;color:#68748a}.main{min-width:0}.topbar{height:78px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 34px}.crumb{font-size:13px;color:var(--muted)}.crumb strong{color:var(--ink)}.profile{display:flex;align-items:center;gap:10px}.avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#e9e7ff;color:var(--purple);font-weight:800}.profile-name{font-size:13px;font-weight:750}.profile-role{font-size:11px;color:var(--muted);margin-top:3px}.content{max-width:1500px;margin:auto;padding:32px 34px 42px}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:26px}.eyebrow{color:var(--purple);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;margin-bottom:8px}.heading h1{font-size:28px;letter-spacing:-.8px;margin:0 0 8px}.heading p{margin:0;color:var(--muted);font-size:13px}.date-chip{background:#fff;border:1px solid var(--line);padding:11px 14px;border-radius:10px;color:#59657a;font-size:12px;white-space:nowrap}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:17px;margin-bottom:25px}.stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:21px;min-width:0}.stat-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:19px}.stat-label{font-size:12px;color:var(--muted);font-weight:650}.stat-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;font-size:18px}.purple{background:#efedff;color:var(--purple)}.green{background:#e2f7f1;color:var(--teal)}.orange{background:#fff1df;color:var(--orange)}.blue{background:#e7f1ff;color:var(--blue)}.stat-number{font-size:30px;font-weight:800;letter-spacing:-1px;margin-bottom:7px}.stat-note{font-size:11px;color:var(--muted)}.stat-note strong{color:#168b83}.panel{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}.panel-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px;border-bottom:1px solid var(--line);gap:14px}.panel-head h2{font-size:16px;margin:0 0 5px}.panel-head p{font-size:12px;color:var(--muted);margin:0}.pill{font-size:11px;color:var(--purple);background:var(--purple-soft);padding:7px 10px;border-radius:20px;font-weight:750;white-space:nowrap}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:700px}th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#97a1b2;font-weight:800;padding:14px 24px;background:#fcfcfe}td{padding:16px 24px;border-top:1px solid #f0f2f7;font-size:12px;color:#5d687b}td:first-child{color:var(--ink);font-weight:700}.student{display:flex;align-items:center;gap:10px}.mini-avatar{width:34px;height:34px;border-radius:10px;background:#f0efff;color:var(--purple);display:grid;place-items:center;font-weight:800;font-size:11px;flex-shrink:0}.student-name{font-weight:750;color:var(--ink);margin-bottom:4px}.student-email{font-size:11px;color:#8a95a7}.status{display:inline-flex;align-items:center;gap:6px;border-radius:20px;padding:6px 9px;background:#e4f7ee;color:#18835a;font-weight:750;font-size:10px;text-transform:capitalize}.status.cancelled{background:#fff0ed;color:#bf4c3b}.status.attended{background:#e8f1ff;color:#316bc1}.empty{padding:40px;text-align:center;color:var(--muted);font-size:13px}.footer-note{color:#9aa4b5;text-align:center;font-size:11px;margin-top:20px}
@media(max-width:1100px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.layout{grid-template-columns:215px minmax(0,1fr)}.content{padding:26px 22px}.topbar{padding:0 22px}}
@media(max-width:720px){.layout{grid-template-columns:1fr}.sidebar{padding:14px;border-right:0;border-bottom:1px solid var(--line)}.brand{padding:0 5px 14px}.nav-label,.side-bottom{display:none}.nav{display:flex;overflow-x:auto}.nav a{white-space:nowrap;padding:10px}.nav a .ico{display:none}.topbar{height:65px;padding:0 16px}.content{padding:24px 15px}.heading{flex-direction:column}.heading h1{font-size:25px}.stats{gap:10px}.stat{padding:15px}.stat-number{font-size:25px}.stat-top{margin-bottom:14px}.profile-name{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.panel-head{padding:18px}.date-chip{display:none}}
@media(max-width:390px){.stats{grid-template-columns:1fr}.nav a{font-size:12px}}
</style>
</head>
<body>
<div class="layout">
<aside class="sidebar">
  <a class="brand" href="admin-dashboard.php"><span class="brand-mark">S</span><span>Student<span style="color:var(--purple)">Hub</span></span></a>
  <div class="nav-label">WORKSPACE</div>
  <nav class="nav" aria-label="Main navigation">
    <?php if ($role === 'admin'): ?>
      <a class="active" href="admin-dashboard.php"><span class="ico">▦</span>Overview</a>
      <a href="student.php"><span class="ico">♙</span>Manage Students</a>
      <a href="admin-events.php"><span class="ico">▣</span>Manage Events</a>
      <a href="register.html"><span class="ico">＋</span>Registration Forms</a>
      <a href="about.html"><span class="ico">ⓘ</span>About Student Hub</a>
    <?php else: ?>
      <a href="dashboard.php"><span class="ico">▦</span>My Dashboard</a>
      <a href="completed-courses.html"><span class="ico">✓</span>My Courses</a>
      <a href="events.html"><span class="ico">▣</span>Events</a>
    <?php endif; ?>
  </nav>
  <div class="side-bottom"><a href="logout.php">↪ &nbsp; Sign out</a></div>
</aside>
<main class="main">
<header class="topbar"><div class="crumb">Workspace &nbsp;/&nbsp; <strong>Overview</strong></div><div class="profile"><div class="avatar"><?= e($initials) ?></div><div><div class="profile-name"><?= e($_SESSION['full_name'] ?? 'Administrator') ?></div><div class="profile-role">Administrator</div></div></div></header>
<section class="content">
  <div class="heading"><div><div class="eyebrow">Student Hub / Admin</div><h1>Dashboard overview</h1><p>Here’s what’s happening across your student community.</p></div><div class="date-chip">◷ &nbsp; <?= e(date('D, d M Y')) ?></div></div>
  <div class="stats">
    <article class="stat"><div class="stat-top"><span class="stat-label">Total students</span><span class="stat-icon purple">♙</span></div><div class="stat-number"><?= number_format($studentCount) ?></div><div class="stat-note">Registered student accounts</div></article>
    <article class="stat"><div class="stat-top"><span class="stat-label">Total events</span><span class="stat-icon green">▣</span></div><div class="stat-number"><?= number_format($eventCount) ?></div><div class="stat-note">Events in the platform</div></article>
    <article class="stat"><div class="stat-top"><span class="stat-label">Active registrations</span><span class="stat-icon orange">✓</span></div><div class="stat-number"><?= number_format($registrationCount) ?></div><div class="stat-note">Currently registered event attendees</div></article>
    <article class="stat"><div class="stat-top"><span class="stat-label">Admin users</span><span class="stat-icon blue">♙</span></div><div class="stat-number"><?= number_format($adminCount) ?></div><div class="stat-note">Accounts with administrator access</div></article>
  </div>
  <section class="panel">
    <div class="panel-head"><div><h2>Latest registrations</h2><p>Most recent event sign-ups across Student Hub.</p></div><span class="pill">Latest 8</span></div>
    <?php if ($latest->num_rows > 0): ?>
    <div class="table-wrap"><table><thead><tr><th>Student</th><th>Event</th><th>Course</th><th>Registered on</th><th>Status</th></tr></thead><tbody>
    <?php while ($row = $latest->fetch_assoc()): $name = (string)$row['full_name']; $parts = preg_split('/\s+/', trim($name)); $avatarText = strtoupper(substr($parts[0] ?? 'S',0,1) . (isset($parts[1]) ? substr($parts[1],0,1) : '')); ?>
      <tr><td><div class="student"><div class="mini-avatar"><?= e($avatarText) ?></div><div><div class="student-name"><?= e($name) ?></div><div class="student-email"><?= e($row['email']) ?></div></div></div></td><td><?= e($row['event_title']) ?></td><td><?= e($row['course']) ?></td><td><?= e(date('d M Y, g:i A', strtotime((string)$row['registered_at']))) ?></td><td><span class="status <?= e($row['status']) ?>"><?= e($row['status']) ?></span></td></tr>
    <?php endwhile; ?></tbody></table></div>
    <?php else: ?><div class="empty">No registrations yet. When students register for events, they’ll appear here.</div><?php endif; ?>
  </section>
  <div class="footer-note">Student Hub · Administrator workspace · Access is restricted by account role</div>
</section>
</main>
</div>
</body></html>
