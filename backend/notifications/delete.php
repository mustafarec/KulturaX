<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// 1. Validate Token & Get User ID
$auth_user_id = requireAuth();

// 2. Get Input Data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->notification_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing user_id or notification_id"]);
    exit;
}

// 3. Authorization Check
if ($auth_user_id != $data->user_id) {
    http_response_code(403);
    echo json_encode(["message" => "Unauthorized access."]);
    exit;
}

try {
    // 4. Delete Notification
    $query = "DELETE FROM notifications WHERE id = :notification_id AND user_id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':notification_id', $data->notification_id);
    $stmt->bindParam(':user_id', $data->user_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Notification deleted successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete notification."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>
