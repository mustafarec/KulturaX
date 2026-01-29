<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// 1. Validate Token & Get User ID
$auth_user_id = requireAuth();

// 2. Get Input Data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->partner_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing user_id or partner_id"]);
    exit;
}

// 3. Authorization Check
if ($auth_user_id != $data->user_id) {
    http_response_code(403);
    echo json_encode(["message" => "Unauthorized access."]);
    exit;
}

try {
    // 4. Delete Conversation (or mark as deleted/hidden)
    // For now, we will DELETE the messages where the user is either sender or receiver involved with partner.
    // NOTE: In a real app, you might want to only hide them for this user using a 'deleted_by_sender' / 'deleted_by_receiver' flag.
    // Assuming simple delete for this task as per plan.
    
    // 4. Soft Delete Conversation
    // Update messages where user is sender -> set deleted_by_sender = 1
    // Update messages where user is receiver -> set deleted_by_receiver = 1
    
    $query1 = "UPDATE messages SET deleted_by_sender = 1 WHERE sender_id = :user_id AND receiver_id = :partner_id";
    $stmt1 = $conn->prepare($query1);
    $stmt1->bindParam(':user_id', $data->user_id);
    $stmt1->bindParam(':partner_id', $data->partner_id);
    
    $query2 = "UPDATE messages SET deleted_by_receiver = 1 WHERE receiver_id = :user_id AND sender_id = :partner_id";
    $stmt2 = $conn->prepare($query2);
    $stmt2->bindParam(':user_id', $data->user_id);
    $stmt2->bindParam(':partner_id', $data->partner_id);

    if ($stmt1->execute() && $stmt2->execute()) {
        
        // 5. Cleanup: Hard Delete messages where BOTH parties have deleted
        // If deleted_by_sender = 1 AND deleted_by_receiver = 1, then the message is gone for everyone.
        $cleanupQuery = "DELETE FROM messages 
                         WHERE (sender_id = :user_id AND receiver_id = :partner_id AND deleted_by_sender = 1 AND deleted_by_receiver = 1) 
                         OR (sender_id = :partner_id AND receiver_id = :user_id AND deleted_by_sender = 1 AND deleted_by_receiver = 1)";
        
        $cleanupStmt = $conn->prepare($cleanupQuery);
        $cleanupStmt->bindParam(':user_id', $data->user_id);
        $cleanupStmt->bindParam(':partner_id', $data->partner_id);
        $cleanupStmt->execute();

        http_response_code(200);
        echo json_encode(["message" => "Conversation deleted successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete conversation."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>
