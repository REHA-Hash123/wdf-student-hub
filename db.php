<?php
declare(strict_types=1);

// XAMPP defaults: host=localhost, user=root, password empty.
// Change these values if your local MySQL/MariaDB credentials differ.
$host = '127.0.0.1';
$dbname = 'studenthub';
$username = 'root';
$password = '';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $conn = new mysqli($host, $username, $password, $dbname);
    $conn->set_charset('utf8mb4');
} catch (mysqli_sql_exception $e) {
    error_log('StudentHub database connection failed: ' . $e->getMessage());
    http_response_code(500);
    exit('Database connection failed. Check that MySQL is running and database.sql was imported.');
}
