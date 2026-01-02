<?php
include_once '../config.php';
include_once '../auth_middleware.php';

// Validate Token & Get User ID
$auth_user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->message_id)) {
    try {
        $query = "DELETE FROM message_reactions WHERE message_id = :message_id AND user_id = :user_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':message_id', $data->message_id);
        $stmt->bindParam(':user_id', $auth_user_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Reaction removed."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to remove reaction."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Missing message_id."]);
}
?>
