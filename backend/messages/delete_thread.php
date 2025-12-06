<?php
include_once '../config.php';
include_once '../auth_middleware.php';

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
    
    // Deleting messages where (sender=user AND receiver=partner) OR (sender=partner AND receiver=user)
    $query = "DELETE FROM messages WHERE (sender_id = :user_id AND receiver_id = :partner_id) OR (sender_id = :partner_id AND receiver_id = :user_id)";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $data->user_id);
    $stmt->bindParam(':partner_id', $data->partner_id);

    if ($stmt->execute()) {
        
        // Also delete any message_permissions if exists? Maybe.
        // Let's keep permissions for now in case they message again.
        
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
