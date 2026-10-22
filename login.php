<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

// If already logged in, redirect based on role
if (!empty($_SESSION['logged_in'])) {
    if ($_SESSION['role'] === 'admin') {
        header('Location: admin-dashboard.php');
    } else {
        header('Location: dashboard.php');
    }
    exit;
}

$errorMessage = '';
if (isset($_GET['error'])) {
    if ($_GET['error'] === 'timeout') $errorMessage = 'Your session has expired. Please log in again.';
    if ($_GET['error'] === 'unauthorized') $errorMessage = 'Please log in to access that page.';
}
if (isset($_GET['message']) && $_GET['message'] === 'logged_out') {
    $successMessage = 'You have logged out successfully.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim((string)($_POST['email'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $rememberMe = isset($_POST['remember_me']);

    if (empty($email) || empty($password)) {
        $errorMessage = 'Please enter both email and password.';
    } else {
        // Query student by email
        $stmt = $conn->prepare('SELECT student_id, full_name, email, password_hash, role FROM students WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        // Verify password hash
        if ($user && password_verify($password, $user['password_hash'])) {
            
            // 1. REGENERATE SESSION ID to eliminate Session Fixation vulnerabilities
            session_regenerate_id(true);

            // 2. Set Session state
            $_SESSION['logged_in']     = true;
            $_SESSION['student_id']    = (int)$user['student_id'];
            $_SESSION['full_name']     = $user['full_name'];
            $_SESSION['email']         = $user['email'];
            $_SESSION['role']          = $user['role'];
            $_SESSION['last_activity'] = time();

            // 3. Optional: Secure Remember-Me Token
            if ($rememberMe) {
                $selector = bin2hex(random_bytes(16));
                $validator = bin2hex(random_bytes(32));
                $hashedValidator = hash('sha256', $validator);
                $expiryDate = date('Y-m-d H:i:s', time() + (86400 * 30)); // 30 days

                $tokenStmt = $conn->prepare('INSERT INTO auth_tokens (student_id, selector, hashed_validator, expires_at) VALUES (?, ?, ?, ?)');
                $tokenStmt->bind_param('isss', $user['student_id'], $selector, $hashedValidator, $expiryDate);
                $tokenStmt->execute();

                $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
                setcookie('remember_token', "{$selector}:{$validator}", [
                    'expires'  => time() + (86400 * 30),
                    'path'     => '/',
                    'secure'   => $isSecure,
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);
            }

            // 4. Role-based redirection
            if ($user['role'] === 'admin') {
                header('Location: admin-dashboard.php');
            } else {
                header('Location: dashboard.php');
            }
            exit;
        } else {
            // Constant-time message to prevent user enumeration
            $errorMessage = 'Invalid email or password.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Hub - Login</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .alert-error { background: #ffe6e6; color: #a12626; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; text-align: center; }
    .alert-success { background: #e8f5e9; color: #176b38; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; text-align: center; }
    .remember-row { display: flex; align-items: center; justify-content: flex-start; gap: 8px; margin: 12px 0; font-size: 14px; }
    .remember-row input { width: auto; margin: 0; }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-container">
      <a href="index.html" class="brand"><span class="brand-title">STUDENT HUB</span></a>
    </div>
  </header>

  <main class="container">
    <div class="login-box">
      <h1>LOGIN</h1>

      <?php if (!empty($errorMessage)): ?>
        <div class="alert-error"><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <?php if (!empty($successMessage)): ?>
        <div class="alert-success"><?= htmlspecialchars($successMessage, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <!-- Real POST form -->
      <form action="login.php" method="POST">
        <input type="email" name="email" placeholder="EMAIL ADDRESS" required value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
        <input type="password" name="password" placeholder="PASSWORD" required>
        
        <div class="remember-row">
          <input type="checkbox" name="remember_me" id="remember_me">
          <label for="remember_me">Remember Me for 30 Days</label>
        </div>

        <button type="submit" class="submit-btn">LOGIN</button>
      </form>

      <div class="new-user">
        NEW USER &nbsp; <a href="register.html">Register here</a>
      </div>
    </div>
  </main>
</body>
</html>