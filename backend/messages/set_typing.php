<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// Validate Token & Get User ID
$auth_user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->receiver_id)) {
    try {
        // Create or update typing status
        $query = "INSERT INTO typing_indicators (user_id, receiver_id, updated_at) 
                  VALUES (:user_id, :receiver_id, NOW()) 
                  ON DUPLICATE KEY UPDATE updated_at = NOW()";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $auth_user_id);
        $stmt->bindParam(':receiver_id', $data->receiver_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Typing status updated."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update typing status."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Missing receiver_id."]);
}
?>
