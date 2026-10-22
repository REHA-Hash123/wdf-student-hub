<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

function show_result(string $title, string $message, int $status = 200): never {
    http_response_code($status);
    echo '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StudentHub event registration</title><body style="font-family:Arial,sans-serif;max-width:680px;margin:60px auto;padding:24px;background:#fff8ed"><h1>' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h1><p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p><p><a href="events.html">Back to events</a></p></body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    show_result('Event registration', 'Submit the event registration form using POST.', 405);
}
$studentId = filter_input(INPUT_POST, 'student_id', FILTER_VALIDATE_INT);
$eventId = filter_input(INPUT_POST, 'event_id', FILTER_VALIDATE_INT);
if (!$studentId || !$eventId || $studentId < 1 || $eventId < 1) {
    show_result('Invalid details', 'Enter a valid student ID and event ID.', 400);
}
try {
    // Confirm event exists and capacity has not been reached, while locking its row.
    $conn->begin_transaction();
    $stmt = $conn->prepare('SELECT capacity FROM events WHERE event_id = ? FOR UPDATE');
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();
    if (!$event) { $conn->rollback(); show_result('Event not found', 'Choose an event that exists.', 404); }

    $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM registrations WHERE event_id = ? AND status = 'registered'");
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    $total = (int)$stmt->get_result()->fetch_assoc()['total'];
    if ((int)$event['capacity'] > 0 && $total >= (int)$event['capacity']) {
        $conn->rollback(); show_result('Event is full', 'There are no seats remaining for this event.', 409);
    }
    $stmt = $conn->prepare("INSERT INTO registrations (student_id, event_id) VALUES (?, ?)");
    $stmt->bind_param('ii', $studentId, $eventId);
    $stmt->execute();
    $conn->commit();
    show_result('Registration successful', 'You have been registered for the event.');
} catch (mysqli_sql_exception $e) {
    $conn->rollback();
    if ((int)$e->getCode() === 1062) show_result('Already registered', 'This student is already registered for this event.', 409);
    if ((int)$e->getCode() === 1452) show_result('Invalid student or event', 'The student ID or event ID does not exist.', 400);
    error_log('Event registration failed: ' . $e->getMessage());
    show_result('Unable to register', 'A database error occurred. Please try again.', 500);
}
