<?php
include_once '../config.php';
include_once '../auth_middleware.php';

// 1. Validate Token & Get User ID
$auth_user_id = requireAuth();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$other_user_id = isset($_GET['other_user_id']) ? $_GET['other_user_id'] : null;

if (!$user_id || !$other_user_id) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing user_id or other_user_id"));
    exit;
}

// 2. Authorization Check
// Ensure the authenticated user is one of the participants
if ($auth_user_id != $user_id) {
    http_response_code(403);
    echo json_encode(array("message" => "Unauthorized access to these messages."));
    exit;
}

try {
    $query = "SELECT * FROM messages 
              WHERE (sender_id = :user_id AND receiver_id = :other_user_id) 
              OR (sender_id = :other_user_id AND receiver_id = :user_id) 
              ORDER BY created_at ASC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':other_user_id', $other_user_id);
    $stmt->execute();

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($messages);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
