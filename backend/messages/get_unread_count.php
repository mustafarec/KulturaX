<?php
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();

// DEBUG LOGGING
file_put_contents('debug_unread.txt', date('Y-m-d H:i:s') . " - UserID: " . $user_id . "\n", FILE_APPEND);

try {
    // Advanced Query: Mimic Inbox Logic explicitly
    // This counts messages exactly how the Inbox counts them per conversation
    $query = "
        SELECT SUM(unread_count) as count FROM (
            SELECT COUNT(*) as unread_count
            FROM messages
            WHERE receiver_id = :user_id 
            AND is_read = 0 
            AND deleted_by_receiver = 0
            GROUP BY sender_id
        ) as subquery
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If null (no messages), return 0
    $count = $result['count'] ? (int)$result['count'] : 0;
    
    echo json_encode(["count" => $count]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>
