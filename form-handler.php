<?php
declare(strict_types=1);
session_start();

function clean_text(string $value): string {
    $value = trim($value);
    // Remove control characters, then HTML-escape on output (not before storage).
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
}
function fail(string $message): never {
    http_response_code(400);
    render_page('Please correct the following issue:', [$message], false);
    exit;
}
function render_page(string $heading, array $messages, bool $success): void {
    $color = $success ? '#176b38' : '#a12626';
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student Hub - Form status</title>';
    echo '<style>body{font-family:Arial,sans-serif;background:#fbe3be;margin:0;padding:32px;color:#222}.card{max-width:650px;margin:5vh auto;background:#fff;padding:28px;border-radius:14px;box-shadow:0 8px 28px #0001}h1{color:'.$color.'}li{margin:8px 0}a{color:#4b3fbb}</style></head><body><main class="card"><h1>'.htmlspecialchars($heading, ENT_QUOTES, 'UTF-8').'</h1><ul>';
    foreach ($messages as $message) echo '<li>'.htmlspecialchars($message, ENT_QUOTES, 'UTF-8').'</li>';
    echo '</ul><p><a href="register.html">Student registration</a> · <a href="contact.html">Contact us</a> · <a href="index.html">Home</a></p></main></body></html>';
}
function append_json(string $filename, array $record): bool {
    $dir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) return false;
    $path = $dir . DIRECTORY_SEPARATOR . $filename;
    $fp = fopen($path, 'c+');
    if (!$fp) return false;
    if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
    $contents = stream_get_contents($fp);
    $records = [];
    if ($contents !== false && trim($contents) !== '') {
        $decoded = json_decode($contents, true);
        if (!is_array($decoded)) { flock($fp, LOCK_UN); fclose($fp); return false; }
        $records = $decoded;
    }
    $records[] = $record;
    rewind($fp);
    ftruncate($fp, 0);
    $ok = fwrite($fp, json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) !== false;
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}
$formType = $_POST['form_type'] ?? (isset($_POST['fullName']) ? 'registration' : 'contact');

if ($formType === 'registration') {
    $name = clean_text((string)($_POST['fullName'] ?? ''));
    $username = clean_text((string)($_POST['username'] ?? ''));
    $email = strtolower(clean_text((string)($_POST['email'] ?? '')));
    $mobile = clean_text((string)($_POST['mobileNumber'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $confirm = (string)($_POST['confirmPassword'] ?? '');
    $course = clean_text((string)($_POST['course'] ?? ''));
    $year = clean_text((string)($_POST['academicYear'] ?? ''));
    $gender = clean_text((string)($_POST['gender'] ?? ''));
    $terms = isset($_POST['termsAccept']);

    if (mb_strlen($name) < 3 || mb_strlen($name) > 100 || !preg_match("/^[\p{L}\p{M} .'-]+$/u", $name)) fail('Enter a valid full name (3–100 letters, spaces, apostrophes, periods or hyphens).');
    if (!preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) fail('Username must be 3–30 characters and contain only letters, numbers, or underscores.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) fail('Enter a valid email address.');
    if (!preg_match('/^[0-9+\-\s()]{7,20}$/', $mobile)) fail('Enter a valid phone number (7–20 characters).');
    if (strlen($password) < 8 || strlen($password) > 200) fail('Password must be at least 8 characters long.');
    if (!hash_equals($password, $confirm)) fail('Password and confirmation do not match.');
    if (!in_array($course, ['cs', 'it', 'ds', 'se', 'ece', 'bba', 'design'], true)) fail('Select a valid course.');
    if (!in_array($year, ['1st Year','2nd Year','3rd Year','4th Year'], true)) fail('Select your academic year.');
    if (!in_array($gender, ['Male','Female','Other'], true)) fail('Select a valid gender option.');
    if (!$terms) fail('You must accept the terms to register.');

    // Save student account to MySQL using a prepared statement.
    require __DIR__ . '/db.php';
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    try {
        // Friendly duplicate check; unique indexes in MySQL also protect against race conditions.
        $check = $conn->prepare('SELECT username, email FROM students WHERE username = ? OR email = ? LIMIT 1');
        $check->bind_param('ss', $username, $email);
        $check->execute();
        $existing = $check->get_result()->fetch_assoc();
        $check->close();
        if ($existing) {
            if (strcasecmp((string)$existing['username'], $username) === 0) {
                fail('That username is already taken. Please choose another username.');
            }
            fail('That email address is already registered. Please use another email or log in.');
        }

        $stmt = $conn->prepare('INSERT INTO students (full_name, username, email, mobile_number, password_hash, course, academic_year, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('ssssssss', $name, $username, $email, $mobile, $passwordHash, $course, $year, $gender);
        $stmt->execute();
        $studentId = $conn->insert_id;
        render_page('Registration successful!', ['Your student account has been saved to the StudentHub database. Student ID: ' . $studentId], true);
    } catch (mysqli_sql_exception $e) {
        if ((int)$e->getCode() === 1062) fail('That username or email is already registered. Please choose another username or use another email.');
        error_log('Student registration failed: ' . $e->getMessage());
        http_response_code(500); render_page('Unable to save registration', ['A database error occurred. Please try again later.'], false);
    }
    exit;
}

$name = clean_text((string)($_POST['name'] ?? ''));
$email = clean_text((string)($_POST['email'] ?? ''));
$message = clean_text((string)($_POST['message'] ?? ''));
if (mb_strlen($name) < 2 || mb_strlen($name) > 100 || !preg_match("/^[\p{L}\p{M} .'-]+$/u", $name)) fail('Enter a valid name (2–100 characters).');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) fail('Enter a valid email address.');
if (mb_strlen($message) < 10 || mb_strlen($message) > 3000) fail('Message must be between 10 and 3000 characters.');
$record = ['name'=>$name, 'email'=>$email, 'message'=>$message, 'createdAt'=>date(DATE_ATOM)];
if (!append_json('contacts.json', $record)) {
    http_response_code(500); render_page('Unable to save message', ['Please check that the project data folder is writable.'], false); exit;
}
render_page('Message sent successfully!', ['Thank you for contacting Student Hub. Your message has been saved.'], true);
