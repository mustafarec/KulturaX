<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->blocked_id)) {
    $blocked_id = $data->blocked_id;

    try {
        $query = "DELETE FROM blocked_users WHERE blocker_id = :blocker_id AND blocked_id = :blocked_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':blocker_id', $user_id);
        $stmt->bindParam(':blocked_id', $blocked_id);
        
        if ($stmt->execute()) {
            echo json_encode(array("message" => "Engel kaldırıldı."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Engel kaldırılamadı."));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
}
?>
