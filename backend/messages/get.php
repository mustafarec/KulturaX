<?php
include_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$other_user_id = isset($_GET['other_user_id']) ? $_GET['other_user_id'] : null;

if (!$user_id || !$other_user_id) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing user_id or other_user_id"));
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
