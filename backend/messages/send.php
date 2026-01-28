<?php
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->receiver_id) &&
    !empty($data->content)
) {
    // 1. Rate Limiting: Kullanıcı başına dakikada 10 mesaj
    checkRateLimit($conn, $userId, 'send_message', 10, 60);

    // 2. Spam Kontrolü
    if (Validator::detectSpam($data->content)) {
        http_response_code(400);
        echo json_encode(array("message" => "Mesajınız spam içeriyor olabilir."));
        exit;
    }

    // 2.5 Block Kontrolü: Engelleyen veya engellenen kullanıcıya mesaj atılamaz
    $checkBlock = "SELECT id FROM blocked_users WHERE (blocker_id = :sender_id AND blocked_id = :receiver_id) OR (blocker_id = :receiver_id AND blocked_id = :sender_id)";
    $stmtBlock = $conn->prepare($checkBlock);
    $stmtBlock->bindParam(':sender_id', $userId);
    $stmtBlock->bindParam(':receiver_id', $data->receiver_id);
    $stmtBlock->execute();

    if ($stmtBlock->rowCount() > 0) {
        http_response_code(403);
        echo json_encode(array("message" => "Bu kullanıcıya mesaj gönderemezsiniz."));
        exit;
    }

    // Reply desteği
    $replyToId = !empty($data->reply_to_id) ? (int) $data->reply_to_id : null;

    // client_id desteği (optimistic UI için)
    // Security: Sanitize and limit client_id to prevent injection attacks
    $clientId = null;
    if (!empty($data->client_id)) {
        // Only allow alphanumeric, underscores, and dashes. Max 50 chars.
        $rawClientId = substr($data->client_id, 0, 50);
        if (preg_match('/^[a-zA-Z0-9_-]+$/', $rawClientId)) {
            $clientId = $rawClientId;
        }
        // If invalid format, we simply ignore client_id (fallback mode)
    }

    // 3. Sanitization
    $data->content = Validator::sanitizeInput($data->content);

    $messageId = null; 

    // USE TRANSACTION for atomicity
    try {
        $conn->beginTransaction();

        $query = "INSERT INTO messages SET 
                    sender_id = :sender_id, 
                    receiver_id = :receiver_id, 
                    content = :content, 
                    reply_to_id = :reply_to_id, 
                    client_id = :client_id, 
                    created_at = NOW()";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':sender_id', $userId);
        $stmt->bindParam(':receiver_id', $data->receiver_id);
        $stmt->bindParam(':content', $data->content);
        $stmt->bindParam(':reply_to_id', $replyToId, PDO::PARAM_INT);
        $stmt->bindParam(':client_id', $clientId);

        $stmt->execute();
        $messageId = $conn->lastInsertId();

        if ($messageId) {
            // 4. Auto-accept permission
            $permQuery = "INSERT INTO message_permissions (user_id, partner_id, status) VALUES (:sender_id, :receiver_id, 'accepted') ON DUPLICATE KEY UPDATE status = 'accepted'";
            $permStmt = $conn->prepare($permQuery);
            $permStmt->bindParam(':sender_id', $userId);
            $permStmt->bindParam(':receiver_id', $data->receiver_id);
            $permStmt->execute();

            $conn->commit();
        } else {
            $conn->rollBack();
            throw new Exception("LastInsertId failed.");
        }
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log("Message Send Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array("message" => "Mesaj gönderilirken sunucu hatası oluştu."));
        exit;
    }

    if ($messageId) {
        // Get the created message details
        try {
            $getMsg = $conn->prepare("SELECT id, created_at, client_id FROM messages WHERE id = :id");
            $getMsg->bindParam(':id', $messageId);
            $getMsg->execute();
            $newMessage = $getMsg->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $newMessage = ['created_at' => date('Y-m-d H:i:s')];
        }

        http_response_code(201);
        echo json_encode(array(
            "message" => "Message sent.",
            "id" => (int) $messageId,
            "created_at" => $newMessage['created_at']
        ));

        // Send Push Notification & Create DB Notification
        try {
            $senderId = (int) $userId;
            $receiverId = (int) $data->receiver_id;

            // NEW: Backend-Driven WebSocket Broadcast (Real-Time Guarantee)
            broadcastToWebSocket($senderId, $receiverId, $data->content, (int)$messageId, $replyToId);

            // Gönderen kullanıcı adını al
            $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
            $senderStmt = $conn->prepare($senderQuery);
            $senderStmt->bindParam(':sender_id', $senderId);
            $senderStmt->execute();
            $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
            $senderName = $sender ? $sender['username'] : "Biri";

            $title = "Yeni Mesaj: @$senderName";
            $message = (strlen($data->content) > 50) ? substr($data->content, 0, 47) . "..." : $data->content;

            // Push Bildirim Gönder (FCM - Asenkron)
            if (file_exists('../notifications/FCM.php')) {
                include_once '../notifications/FCM.php';
                $fcm = new FCM($conn);
                $fcm->sendToUserAsync($receiverId, $title, $message, array(
                    "type" => "message",
                    "sender_id" => (string) $senderId,
                    "sender_name" => $senderName
                ), 'high');
            }
        } catch (Exception $e) {
            error_log("General notification error in send.php: " . $e->getMessage());
        }
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to send message."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}

/**
 * Helper to internal broadcast
 */
function broadcastToWebSocket($senderId, $receiverId, $content, $messageId, $replyTo) {
    global $api_signature_secret; // Use constant or global
    $secret = defined('API_SIGNATURE_SECRET') ? API_SIGNATURE_SECRET : ($api_signature_secret ?? 'default_internal_secret');

    try {
        $messageData = [
            'type' => 'new_message',
            'message' => [
                'id' => $messageId,
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'content' => $content,
                'created_at' => date('Y-m-d H:i:s'),
                'is_read' => 0,
                'reply_to' => $replyTo
            ]
        ];

        $payloadBase = [
            'type' => 'internal_broadcast',
            'secret' => $secret,
            'payload' => $messageData
        ];

        $socket = @stream_socket_client('tcp://127.0.0.1:8080', $errno, $errstr, 2);
        if ($socket) {
            // 1. Broadcast to Receiver
            $receiverPayload = $payloadBase;
            $receiverPayload['receiverId'] = $receiverId;
            fwrite($socket, json_encode($receiverPayload) . "\n");

            // 2. Broadcast to Sender (Multi-device sync)
            $senderPayload = $payloadBase;
            $senderPayload['receiverId'] = $senderId;
            fwrite($socket, json_encode($senderPayload) . "\n");

            fclose($socket);
        } else {
            error_log("WS Broadcast Failed: $errstr ($errno)");
        }
    } catch (Exception $e) {
        error_log("WS Broadcast Logic Error: " . $e->getMessage());
    }
}
?>