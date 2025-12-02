<?php
include_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing user_id"));
    exit;
}

try {
    // Bu sorgu, kullanıcının dahil olduğu her konuşmadaki son mesajı getirir.
    $query = "
        SELECT 
            u.id as chat_partner_id,
            u.username,
            u.avatar_url,
            m.content as last_message,
            m.created_at as last_message_time,
            m.sender_id as last_message_sender_id,
            (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = :user_id AND is_read = 0) as unread_count
        FROM users u
        JOIN (
            SELECT 
                CASE 
                    WHEN sender_id = :user_id THEN receiver_id 
                    ELSE sender_id 
                END as partner_id,
                MAX(id) as max_msg_id
            FROM messages
            WHERE sender_id = :user_id OR receiver_id = :user_id
            GROUP BY partner_id
        ) latest ON u.id = latest.partner_id
        JOIN messages m ON m.id = latest.max_msg_id
        ORDER BY m.created_at DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($conversations);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
