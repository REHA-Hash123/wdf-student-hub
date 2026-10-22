<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$file = __DIR__ . '/data/students.json';
if (!file_exists($file)) file_put_contents($file, '[]');
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$students = json_decode(file_get_contents($file), true) ?? [];

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
function saveStudents($file, $students) {
    file_put_contents($file, json_encode(array_values($students), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

switch ($method) {
    case 'GET':
        respond(['success' => true, 'data' => array_values($students)]);

    case 'POST':
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond(['success' => false, 'message' => 'Name and a valid email are required.'], 422);
        }
        $student = ['id' => uniqid('stu_', true), 'name' => $name, 'email' => $email];
        $students[] = $student;
        saveStudents($file, $students);
        respond(['success' => true, 'data' => $student], 201);

    case 'PUT':
        $id = $input['id'] ?? '';
        $found = false;
        foreach ($students as &$student) {
            if ($student['id'] === $id) {
                $name = trim($input['name'] ?? $student['name']);
                $email = trim($input['email'] ?? $student['email']);
                if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    unset($student);
                    respond(['success' => false, 'message' => 'Name and a valid email are required.'], 422);
                }
                $student['name'] = $name;
                $student['email'] = $email;
                $updated = $student;
                $found = true;
                break;
            }
        }
        unset($student);
        if (!$found) respond(['success' => false, 'message' => 'Student not found.'], 404);
        saveStudents($file, $students);
        respond(['success' => true, 'data' => $updated]);

    case 'DELETE':
        $id = $input['id'] ?? '';
        $before = count($students);
        $students = array_values(array_filter($students, fn($s) => $s['id'] !== $id));
        if (count($students) === $before) respond(['success' => false, 'message' => 'Student not found.'], 404);
        saveStudents($file, $students);
        respond(['success' => true, 'message' => 'Student deleted.']);

    default:
        header('Allow: GET, POST, PUT, DELETE, OPTIONS');
        respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}
