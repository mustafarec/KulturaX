<?php
/**
 * Mesaj geri alma endpoint'i
 * Kullanıcı kendi mesajını geri alabilir (unsend)
 * Mesaj silinmez, "Bu mesaj geri alındı" şeklinde görünür
 */
require_once '../config.php';
require_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->message_id)) {
    $messageId = (int)$data->message_id;
    
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
        echo json_encode(array("message" => "Bu mesajı geri alma yetkiniz yok."));
        exit;
    }
    
    // 15 dakika sınırı kontrolü
    $createdAt = strtotime($message['created_at']);
    $now = time();
    $diffMinutes = ($now - $createdAt) / 60;
    
    if ($diffMinutes > 15) {
        http_response_code(400);
        echo json_encode(array("message" => "Mesaj 15 dakikadan eski, geri alınamaz."));
        exit;
    }
    
    // Mesajı geri al (is_unsent = 1 olarak işaretle)
    $updateQuery = "UPDATE messages SET is_unsent = 1, unsent_at = NOW() WHERE id = :message_id";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bindParam(':message_id', $messageId);
    
    if ($updateStmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Mesaj geri alındı."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Mesaj geri alınamadı."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "message_id gerekli."));
}
?>
