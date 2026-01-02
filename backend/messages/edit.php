<?php
/**
 * Mesaj düzenleme endpoint'i
 * Kullanıcı kendi mesajını düzenleyebilir
 */
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->message_id) && !empty($data->content)) {
    $messageId = (int)$data->message_id;
    $newContent = Validator::sanitizeInput($data->content);
    
    // Mesajın sahibi olup olmadığını kontrol et
    $checkQuery = "SELECT id, sender_id, created_at FROM messages WHERE id = :message_id";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':message_id', $messageId);
    $checkStmt->execute();
    
    $message = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$message) {
        http_response_code(404);
        echo json_encode(array("message" => "Mesaj bulunamadı."));
        exit;
    }
    
    if ($message['sender_id'] != $userId) {
        http_response_code(403);
        echo json_encode(array("message" => "Bu mesajı düzenleme yetkiniz yok."));
        exit;
    }
    
    // 15 dakika sınırı kontrolü (opsiyonel)
    $createdAt = strtotime($message['created_at']);
    $now = time();
    $diffMinutes = ($now - $createdAt) / 60;
    
    if ($diffMinutes > 15) {
        http_response_code(400);
        echo json_encode(array("message" => "Mesaj 15 dakikadan eski, düzenlenemez."));
        exit;
    }
    
    // Mesajı güncelle
    $updateQuery = "UPDATE messages SET content = :content, is_edited = 1, edited_at = NOW() WHERE id = :message_id";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bindParam(':content', $newContent);
    $updateStmt->bindParam(':message_id', $messageId);
    
    if ($updateStmt->execute()) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Mesaj düzenlendi.",
            "content" => $newContent
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Mesaj düzenlenemedi."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "message_id ve content gerekli."));
}
?>
