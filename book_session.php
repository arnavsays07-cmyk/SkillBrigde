<?php
// =====================================================================
// book_session.php - Book a Peer Tutoring Study Session (JSON API)
// =====================================================================
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config/database.php';

require_api_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

verify_csrf(true);

$current_user_id = (int)$_SESSION['user_id'];
$tutor_id        = filter_input(INPUT_POST, 'tutor_id', FILTER_VALIDATE_INT);
$subject_id      = filter_input(INPUT_POST, 'subject_id', FILTER_VALIDATE_INT);
$topic           = trim($_POST['topic'] ?? '');
$session_date    = trim($_POST['session_date'] ?? '');
$mode            = $_POST['mode'] ?? 'Online (Meet)';
$meeting_details = trim($_POST['meeting_details'] ?? '');
$credit_cost     = 10;

$allowedModes = ['Online (Meet)', 'Campus Library', 'Lab Room', 'Study Commons'];
if (!in_array($mode, $allowedModes, true)) {
    $mode = 'Online (Meet)';
}

if (!$tutor_id || !$subject_id || empty($topic) || empty($session_date)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'All booking fields are required.']);
    exit;
}

if ($tutor_id === $current_user_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'You cannot book a study session with yourself.']);
    exit;
}

// Format HTML5 datetime-local (YYYY-MM-DDTHH:MM) into MySQL DATETIME
$formattedDate = str_replace('T', ' ', $session_date);
if (strlen($formattedDate) === 16) {
    $formattedDate .= ':00';
}

// Verify learner has sufficient credits
$stmt = $pdo->prepare("SELECT credit_balance FROM users WHERE id = :uid");
$stmt->execute([':uid' => $current_user_id]);
$user = $stmt->fetch();

if (!$user || (int)$user['credit_balance'] < $credit_cost) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => "Insufficient credit balance. You need at least {$credit_cost} credits to book."
    ]);
    exit;
}

try {
    $insert = $pdo->prepare("
        INSERT INTO sessions (learner_id, tutor_id, subject_id, topic, session_date, duration_minutes, mode, meeting_details, status, credit_cost)
        VALUES (:lid, :tid, :sid, :topic, :sdate, 60, :mode, :details, 'pending', :cost)
    ");
    $insert->execute([
        ':lid'     => $current_user_id,
        ':tid'     => $tutor_id,
        ':sid'     => $subject_id,
        ':topic'   => $topic,
        ':sdate'   => $formattedDate,
        ':mode'    => $mode,
        ':details' => $meeting_details ?: 'Campus location to be coordinated in chat',
        ':cost'    => $credit_cost
    ]);

    echo json_encode([
        'status'     => 'success',
        'session_id' => (int)$pdo->lastInsertId(),
        'message'    => 'Study session requested successfully! Awaiting tutor acceptance.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unable to create booking at this time.'
    ]);
}
