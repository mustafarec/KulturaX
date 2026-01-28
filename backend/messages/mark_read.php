<?php
include_once '../config.php';
include_once '../auth_middleware.php';

// Auth check - CRITICAL FIX
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

// Security Check: Only allow marking as read for the authenticated user
if (!empty($data->user_id) && (int)$data->user_id !== (int)$userId) {
    http_response_code(403);
    echo json_encode(["message" => "Unauthorized: You can only mark your own messages as read."]);
    exit;
}

if (!empty($data->user_id) && !empty($data->other_user_id)) {
    try {
        // 1. Get IDs of messages that will be marked as read before updating
        $getIdsQuery = "SELECT id FROM messages WHERE receiver_id = :user_id AND sender_id = :other_user_id AND is_read = 0";
        $idStmt = $conn->prepare($getIdsQuery);
        $idStmt->bindParam(':user_id', $data->user_id);
        $idStmt->bindParam(':other_user_id', $data->other_user_id);
        $idStmt->execute();
        $messageIds = $idStmt->fetchAll(PDO::FETCH_COLUMN, 0);

        // 2. Perform the update
        $query = "UPDATE messages SET is_read = 1 WHERE receiver_id = :user_id AND sender_id = :other_user_id AND is_read = 0";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':other_user_id', $data->other_user_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Messages marked as read.", "updated_count" => count($messageIds)]);

            // 3. Real-time Broadcast: Notify the original sender (other_user_id)
            if (!empty($messageIds)) {
                broadcastReadReceipt((int)$data->other_user_id, (int)$data->user_id, $messageIds);
            }
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update messages."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}

/**
 * Helper to internal broadcast read receipts
 */
function broadcastReadReceipt($targetUserId, $readerId, $messageIds) {
    global $api_signature_secret; // Use existing secret for internal communication
    try {
        $payload = json_encode([
            'type' => 'internal_broadcast',
            'secret' => $api_signature_secret ?? 'default_internal_secret', 
            'receiverId' => $targetUserId,
            'payload' => [
                'type' => 'messages_read',
                'readerId' => $readerId,
                'messageIds' => array_map('intval', $messageIds)
            ]
        ]);

        $socket = @stream_socket_client('tcp://127.0.0.1:8080', $errno, $errstr, 1);
        if ($socket) {
            fwrite($socket, $payload);
            fclose($socket);
        }
    } catch (Exception $e) {
        // Silent fail for broadcast
    }
}
?>
