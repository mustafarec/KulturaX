<?php
include_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->partner_id)) {
    try {
        // İzin ekle veya güncelle
        $query = "INSERT INTO message_permissions (user_id, partner_id, status) VALUES (:user_id, :partner_id, 'accepted')
                  ON DUPLICATE KEY UPDATE status = 'accepted'";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':partner_id', $data->partner_id);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Request accepted."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to accept request."));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
