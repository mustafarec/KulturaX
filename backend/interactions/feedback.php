<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->post_id) || !isset($data->type)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik parametreler."));
    exit;
}

$post_id = $data->post_id;
$type = $data->type; // 'report', 'not_interested', 'show_more'
$reason = isset($data->reason) ? $data->reason : null;

// Validate type
$allowed_types = ['report', 'not_interested', 'show_more'];
if (!in_array($type, $allowed_types)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz bildirim türü."));
    exit;
}

try {
    // Check if duplicate feedback exists for this user/post/type
    // We used UNIQUE KEY in schema but let's handle gently
    $checkQuery = "SELECT id FROM post_feedback WHERE user_id = :user_id AND post_id = :post_id AND type = :type";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':post_id', $post_id);
    $stmt->bindParam(':type', $type);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // Already exists, just return success
        echo json_encode(array("message" => "Geri bildirim zaten alınmış."));
        exit;
    }

    $query = "INSERT INTO post_feedback (user_id, post_id, type, reason) VALUES (:user_id, :post_id, :type, :reason)";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':post_id', $post_id);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':reason', $reason);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "Geri bildirim alındı."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Veritabanı hatası."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
