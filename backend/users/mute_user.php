<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->muted_id) || empty($data->muted_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "Sessize alınacak kullanıcı belirtilmedi."));
    exit;
}

$muted_id = intval($data->muted_id);

// Cannot mute yourself
if ($user_id == $muted_id) {
    http_response_code(400);
    echo json_encode(array("message" => "Kendinizi sessize alamazsınız."));
    exit;
}

try {
    // Check if user exists
    $check_query = "SELECT id FROM users WHERE id = :muted_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':muted_id', $muted_id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Kullanıcı bulunamadı."));
        exit;
    }

    // Insert mute record (IGNORE handles duplicates)
    $query = "INSERT IGNORE INTO muted_users (user_id, muted_id) VALUES (:user_id, :muted_id)";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':muted_id', $muted_id);
    $stmt->execute();

    http_response_code(200);
    echo json_encode(array(
        "message" => "Kullanıcı sessize alındı.",
        "muted_id" => $muted_id
    ));

} catch (Exception $e) {
    error_log("Mute user error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
