<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        // Only allow deleting own feedback
        $query = "DELETE FROM post_feedback WHERE id = :id AND user_id = :user_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':user_id', $user_id);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                echo json_encode(array("message" => "Tercih silindi."));
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Tercih bulunamadı veya size ait değil."));
            }
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Silinemedi."));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
}
?>
