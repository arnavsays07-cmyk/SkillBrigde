<?php
// =====================================================================
// api/search_peers.php - Asynchronous JSON API for Live Peer Search
// =====================================================================
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../config/database.php';

// Ensure HTTP 401 JSON response if unauthenticated
require_api_login();

$current_user_id = (int)$_SESSION['user_id'];
$subject_filter  = isset($_GET['subject']) ? trim($_GET['subject']) : '';
$dept_filter     = isset($_GET['department']) ? trim($_GET['department']) : '';

try {
    $sql = "
        SELECT 
            u.id, 
            u.name, 
            u.department, 
            u.semester, 
            u.average_rating, 
            u.total_reviews, 
            u.availability,
            u.bio,
            GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name ASC SEPARATOR ', ') AS teachable_subjects,
            GROUP_CONCAT(DISTINCT CONCAT(s.id, '::', s.code, ' - ', s.subject_name) ORDER BY s.subject_name ASC SEPARATOR '||') AS teachable_skill_options
        FROM users u
        INNER JOIN user_skills us ON u.id = us.user_id AND us.skill_type = 'teach'
        INNER JOIN skills s ON us.skill_id = s.id
        WHERE u.id != :curr_uid AND u.status = 'active'
    ";

    $params = [':curr_uid' => $current_user_id];

    if ($subject_filter !== '') {
        $sql .= " AND (s.subject_name LIKE :subject1 OR u.name LIKE :subject2 OR u.bio LIKE :subject3)";
        $like = '%' . $subject_filter . '%';
        $params[':subject1'] = $like;
        $params[':subject2'] = $like;
        $params[':subject3'] = $like;
    }

    if ($dept_filter !== '' && $dept_filter !== 'All') {
        $sql .= " AND u.department = :dept";
        $params[':dept'] = $dept_filter;
    }

    $sql .= "
        GROUP BY 
            u.id, 
            u.name, 
            u.department, 
            u.semester, 
            u.average_rating, 
            u.total_reviews, 
            u.availability,
            u.bio
        ORDER BY u.average_rating DESC, u.total_reviews DESC
        LIMIT 50
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'count'  => count($results),
        'data'   => $results
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unable to search peers at this time.'
    ]);
}
