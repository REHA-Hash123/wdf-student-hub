<?php
declare(strict_types=1);

// Prevent direct script execution if needed
if (session_status() === PHP_SESSION_NONE) {
    // 1. Configure secure session cookie params before session_start()
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
    
    session_set_cookie_params([
        'lifetime' => 0,              // Cookie expires when browser closes
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isSecure,      // True on HTTPS, false on local HTTP
        'httponly' => true,            // Disallow JavaScript access (prevents XSS session stealing)
        'samesite' => 'Lax'           // Protect against CSRF
    ]);

    session_start();
}

// 2. Check Remember-Me token if session is not active
if (empty($_SESSION['logged_in']) && !empty($_COOKIE['remember_token'])) {
    check_remember_token();
}

// 3. Enforce Session Inactivity Timeout (30 minutes = 1800 seconds)
$timeoutDuration = 1800; 

if (!empty($_SESSION['logged_in'])) {
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $timeoutDuration) {
        // Session timed out: clean up and redirect
        session_unset();
        session_destroy();
        header('Location: login.php?error=timeout');
        exit;
    }
    // Update last activity timestamp on each request
    $_SESSION['last_activity'] = time();
}

/**
 * Ensures user is authenticated; otherwise redirects to login.
 */
function require_login(): void {
    if (empty($_SESSION['logged_in']) || empty($_SESSION['student_id'])) {
        header('Location: login.php?error=unauthorized');
        exit;
    }
}

/**
 * Restricts access to specific role(s).
 * Example: require_role('admin');
 */
function require_role(string ...$allowedRoles): void {
    require_login();
    $userRole = $_SESSION['role'] ?? 'student';
    if (!in_array($userRole, $allowedRoles, true)) {
        http_response_code(403);
        die('<h1>403 Forbidden</h1><p>You do not have permission to access this page.</p><p><a href="dashboard.php">Go to Dashboard</a></p>');
    }
}

/**
 * Verifies persistent remember-me token using selector/validator pattern
 */
function check_remember_token(): void {
    require_once __DIR__ . '/db.php';
    global $conn;

    $cookie = $_COOKIE['remember_token'] ?? '';
    if (!str_contains($cookie, ':')) return;

    [$selector, $validator] = explode(':', $cookie, 2);

    $stmt = $conn->prepare("SELECT token_id, student_id, hashed_validator, expires_at FROM auth_tokens WHERE selector = ? AND expires_at > NOW() LIMIT 1");
    $stmt->bind_param('s', $selector);
    $stmt->execute();
    $token = $stmt->get_result()->fetch_assoc();

    if ($token && hash_equals($token['hashed_validator'], hash('sha256', $validator))) {
        // Fetch student details
        $uStmt = $conn->prepare("SELECT student_id, full_name, email, role FROM students WHERE student_id = ?");
        $uStmt->bind_param('i', $token['student_id']);
        $uStmt->execute();
        $student = $uStmt->get_result()->fetch_assoc();

        if ($student) {
            // Regenerate session to prevent fixation
            session_regenerate_id(true);

            $_SESSION['logged_in']     = true;
            $_SESSION['student_id']    = (int)$student['student_id'];
            $_SESSION['full_name']     = $student['full_name'];
            $_SESSION['email']         = $student['email'];
            $_SESSION['role']          = $student['role'];
            $_SESSION['last_activity'] = time();
        }
    }
}