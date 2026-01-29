<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->muted_id) || empty($data->muted_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "Sessizliği kaldırılacak kullanıcı belirtilmedi."));
    exit;
}

$muted_id = intval($data->muted_id);

try {
    $query = "DELETE FROM muted_users WHERE user_id = :user_id AND muted_id = :muted_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':muted_id', $muted_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Kullanıcının sessizliği kaldırıldı.",
            "muted_id" => $muted_id
        ));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Bu kullanıcı zaten sessizde değil."));
    }

} catch (Exception $e) {
    error_log("Unmute user error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
