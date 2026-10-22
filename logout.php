<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

// 1. Delete remember-me token from DB if present
if (!empty($_COOKIE['remember_token']) && str_contains($_COOKIE['remember_token'], ':')) {
    [$selector] = explode(':', $_COOKIE['remember_token'], 2);
    $stmt = $conn->prepare('DELETE FROM auth_tokens WHERE selector = ?');
    $stmt->bind_param('s', $selector);
    $stmt->execute();
}

// 2. Clear remember_token cookie in the browser
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
setcookie('remember_token', '', [
    'expires'  => time() - 3600,
    'path'     => '/',
    'secure'   => $isSecure,
    'httponly' => true,
    'samesite' => 'Lax'
]);

// 3. Clear PHP Session variables
$_SESSION = [];

// 4. Invalidate Session Cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 5. Destroy session storage
session_destroy();

// 6. Redirect to login
header('Location: login.php?message=logged_out');
exit;