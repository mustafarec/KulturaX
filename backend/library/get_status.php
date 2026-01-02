<?php
include '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();
$content_type = isset($_GET['content_type']) ? $_GET['content_type'] : die();
$content_id = isset($_GET['content_id']) ? $_GET['content_id'] : die();

$query = "SELECT status, progress FROM user_library WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
$stmt = $conn->prepare($query);

$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':content_type', $content_type);
$stmt->bindParam(':content_id', $content_id);

$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    http_response_code(200);
    echo json_encode($row);
} else {
    // Kayıt yoksa null döndür
    http_response_code(200);
    echo json_encode(null);
}
?>
