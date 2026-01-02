<?php
include_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->other_user_id)) {
    try {
        $query = "UPDATE messages SET is_read = 1 WHERE receiver_id = :user_id AND sender_id = :other_user_id AND is_read = 0";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':other_user_id', $data->other_user_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Messages marked as read."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update messages."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
