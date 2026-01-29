<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// 1. Validate Token & Get User ID
$auth_user_id = requireAuth();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$other_user_id = isset($_GET['other_user_id']) ? $_GET['other_user_id'] : null;

if (!$user_id || !$other_user_id) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing user_id or other_user_id"));
    exit;
}

// 2. Authorization Check
// Ensure the authenticated user is one of the participants
if ($auth_user_id != $user_id) {
    http_response_code(403);
    echo json_encode(array("message" => "Unauthorized access to these messages."));
    exit;
}

try {
    // 3. Pagination Parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = ($page - 1) * $limit;

    $query = "SELECT id, sender_id, receiver_id, content, created_at, is_read, is_edited, is_unsent, reply_to_id 
              FROM messages 
              WHERE (sender_id = :user_id AND receiver_id = :other_user_id AND deleted_by_sender = 0) 
              OR (sender_id = :other_user_id AND receiver_id = :user_id AND deleted_by_receiver = 0) 
              ORDER BY created_at DESC 
              LIMIT :limit OFFSET :offset";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':other_user_id', $other_user_id);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process messages for unsent/edited status
    $replyIds = [];
    foreach ($messages as &$message) {
        // Geri alınmış mesajları işle
        if (!empty($message['is_unsent']) && $message['is_unsent'] == 1) {
            $message['content'] = 'Bu mesaj geri alındı.';
            $message['is_system_message'] = true;
        }
        // is_edited ve reply_to_id değerlerini boolean/int olarak gönder
        $message['is_read'] = !empty($message['is_read']) ? true : false;
        $message['is_edited'] = !empty($message['is_edited']) ? true : false;
        $message['is_unsent'] = !empty($message['is_unsent']) ? true : false;
        $message['reply_to_id'] = !empty($message['reply_to_id']) ? (int)$message['reply_to_id'] : null;

        if ($message['reply_to_id']) {
            $replyIds[] = $message['reply_to_id'];
        }
    }
    unset($message); // referansı temizle

    // Fetch reply details if any
    $replies = [];
    if (!empty($replyIds)) {
        $replyIds = array_unique($replyIds);
        $placeholders = implode(',', array_fill(0, count($replyIds), '?'));
        // Fetch message content and sender username
        $replyQuery = "SELECT m.id, m.content, u.username 
                       FROM messages m 
                       JOIN users u ON m.sender_id = u.id 
                       WHERE m.id IN ($placeholders)";
        $replyStmt = $conn->prepare($replyQuery);
        $replyStmt->execute(array_values($replyIds));
        $fetchedReplies = $replyStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($fetchedReplies as $reply) {
            $replies[$reply['id']] = $reply;
        }
    }

    // Attach reply details to messages
    if (!empty($replies)) {
        foreach ($messages as &$message) {
            if (!empty($message['reply_to_id']) && isset($replies[$message['reply_to_id']])) {
                $message['reply_to'] = $replies[$message['reply_to_id']];
            } else {
                $message['reply_to'] = null;
            }
        }
        unset($message);
    }

    // Fetch reactions for each message
    $messageIds = array_column($messages, 'id');
    if (!empty($messageIds)) {
        $placeholders = implode(',', array_fill(0, count($messageIds), '?'));
        $reactionQuery = "SELECT mr.message_id, mr.user_id, mr.emoji, u.username 
                          FROM message_reactions mr 
                          JOIN users u ON mr.user_id = u.id 
                          WHERE mr.message_id IN ($placeholders)";
        $reactionStmt = $conn->prepare($reactionQuery);
        $reactionStmt->execute($messageIds);
        $reactions = $reactionStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group reactions by message_id
        $reactionsByMessage = [];
        foreach ($reactions as $reaction) {
            $reactionsByMessage[$reaction['message_id']][] = $reaction;
        }
        
        // Attach reactions to messages
        foreach ($messages as &$message) {
            $message['reactions'] = isset($reactionsByMessage[$message['id']]) 
                ? $reactionsByMessage[$message['id']] 
                : [];
        }
    }

    http_response_code(200);
    echo json_encode($messages);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
