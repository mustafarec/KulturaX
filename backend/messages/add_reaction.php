<?php
include_once '../config.php';
include_once '../auth_middleware.php';

// Validate Token & Get User ID
$auth_user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->message_id) && !empty($data->emoji)) {
    try {
        // Check if reaction already exists
        $checkQuery = "SELECT id FROM message_reactions WHERE message_id = :message_id AND user_id = :user_id";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':message_id', $data->message_id);
        $checkStmt->bindParam(':user_id', $auth_user_id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            // Update existing reaction
            $query = "UPDATE message_reactions SET emoji = :emoji WHERE message_id = :message_id AND user_id = :user_id";
        } else {
            // Insert new reaction
            $query = "INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (:message_id, :user_id, :emoji)";
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':message_id', $data->message_id);
        $stmt->bindParam(':user_id', $auth_user_id);
        $stmt->bindParam(':emoji', $data->emoji);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Reaction added.", "emoji" => $data->emoji]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to add reaction."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Missing message_id or emoji."]);
}
?>
