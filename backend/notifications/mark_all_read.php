<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// 1. Validate Token & Get User ID
$auth_user_id = requireAuth();

// 2. Get Input Data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing user_id"]);
    exit;
}

// 3. Authorization Check
if ($auth_user_id != $data->user_id) {
    http_response_code(403);
    echo json_encode(["message" => "Unauthorized access."]);
    exit;
}

try {
    $query = "UPDATE notifications SET is_read = 1 WHERE user_id = :user_id AND is_read = 0";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $data->user_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Tüm bildirimler okundu olarak işaretlendi."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "İşlem başarısız."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>
