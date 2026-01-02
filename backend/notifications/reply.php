<?php
/**
 * Notification Reply Endpoint
 * Handles Direct Reply from Android notification shade
 * Uses device token for authentication instead of regular auth
 */
include_once '../config.php';
include_once '../validation.php';

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (
    empty($data->device_token) ||
    empty($data->sender_id) ||
    empty($data->content)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Required: device_token, sender_id, content"));
    exit;
}

// Authenticate via device token
$tokenQuery = "SELECT user_id FROM device_tokens WHERE token = :token";
$tokenStmt = $conn->prepare($tokenQuery);
$tokenStmt->bindParam(':token', $data->device_token);
$tokenStmt->execute();

if ($tokenStmt->rowCount() === 0) {
    http_response_code(401);
    echo json_encode(array("message" => "Invalid device token."));
    exit;
}

$tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);
$userId = (int)$tokenRow['user_id'];
$receiverId = (int)$data->sender_id; // The person who sent the original message (we're replying to them)

// Block check
$checkBlock = "SELECT id FROM blocked_users WHERE (blocker_id = :sender_id AND blocked_id = :receiver_id) OR (blocker_id = :receiver_id AND blocked_id = :sender_id)";
$stmtBlock = $conn->prepare($checkBlock);
$stmtBlock->bindParam(':sender_id', $userId);
$stmtBlock->bindParam(':receiver_id', $receiverId);
$stmtBlock->execute();

if ($stmtBlock->rowCount() > 0) {
    http_response_code(403);
    echo json_encode(array("message" => "Bu kullanıcıya mesaj gönderemezsiniz."));
    exit;
}

// Spam check
if (Validator::detectSpam($data->content)) {
    http_response_code(400);
    echo json_encode(array("message" => "Mesajınız spam içeriyor olabilir."));
    exit;
}

// Sanitize content
$content = Validator::sanitizeInput($data->content);

// Insert message
$query = "INSERT INTO messages SET sender_id = :sender_id, receiver_id = :receiver_id, content = :content";
$stmt = $conn->prepare($query);
$stmt->bindParam(':sender_id', $userId);
$stmt->bindParam(':receiver_id', $receiverId);
$stmt->bindParam(':content', $content);

if ($stmt->execute()) {
    $messageId = $conn->lastInsertId();
    
    // Auto-accept permission
    $permQuery = "INSERT INTO message_permissions (user_id, partner_id, status) VALUES (:sender_id, :receiver_id, 'accepted') ON DUPLICATE KEY UPDATE status = 'accepted'";
    $permStmt = $conn->prepare($permQuery);
    $permStmt->bindParam(':sender_id', $userId);
    $permStmt->bindParam(':receiver_id', $receiverId);
    $permStmt->execute();

    // Send push notification to the receiver
    try {
        // Get sender username
        $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
        $senderStmt = $conn->prepare($senderQuery);
        $senderStmt->bindParam(':sender_id', $userId);
        $senderStmt->execute();
        $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
        $senderName = $sender ? $sender['username'] : "Biri";

        $title = "Yeni Mesaj: @$senderName";
        $message = (strlen($content) > 50) ? substr($content, 0, 47) . "..." : $content;

        if (file_exists('FCM.php')) {
            include_once 'FCM.php';
            $fcm = new FCM($conn);
            $fcm->sendToUser($receiverId, $title, $message, array("type" => "message", "sender_id" => $userId));
        }
    } catch (Exception $e) {
        error_log("Notification error in reply.php: " . $e->getMessage());
    }

    http_response_code(201);
    echo json_encode(array(
        "message" => "Message sent.",
        "message_id" => $messageId
    ));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to send message."));
}
?>
