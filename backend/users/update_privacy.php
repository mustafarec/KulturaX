<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->is_private)) {
    http_response_code(400);
    echo json_encode(array("message" => "Gizlilik durumu belirtilmedi."));
    exit;
}

$is_private = $data->is_private ? 1 : 0;

try {
    $query = "UPDATE users SET is_private = :is_private WHERE id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':is_private', $is_private);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    http_response_code(200);
    echo json_encode(array(
        "message" => $is_private ? "Hesabınız özel yapıldı." : "Hesabınız herkese açık yapıldı.",
        "is_private" => (bool)$is_private
    ));

} catch (Exception $e) {
    error_log("Update privacy error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
