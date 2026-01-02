<?php
include_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->partner_id)) {
    try {
        // İzin tablosuna 'declined' olarak ekle
        $query = "INSERT INTO message_permissions (user_id, partner_id, status) VALUES (:user_id, :partner_id, 'declined')
                  ON DUPLICATE KEY UPDATE status = 'declined'";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':partner_id', $data->partner_id);

        if ($stmt->execute()) {
            // İsteğe bağlı: Mesajları da silebiliriz veya gizleyebiliriz.
            // Şimdilik sadece izni reddediyoruz, böylece istekler kutusunda görünmeyecek.
            
            http_response_code(200);
            echo json_encode(array("message" => "Request declined."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to decline request."));
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
