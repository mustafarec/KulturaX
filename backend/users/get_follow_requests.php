<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$userId = requireAuth();

try {
    // Get pending follow requests for current user
    $query = "SELECT fr.id, fr.requester_id, fr.created_at,
                     u.username, u.full_name, u.avatar_url
              FROM follow_requests fr
              JOIN users u ON fr.requester_id = u.id
              WHERE fr.target_id = :user_id AND fr.status = 'pending'
              ORDER BY fr.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $requests = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $requests[] = array(
            "id" => intval($row['id']),
            "requester_id" => intval($row['requester_id']),
            "username" => $row['username'],
            "full_name" => $row['full_name'],
            "avatar_url" => $row['avatar_url'],
            "created_at" => $row['created_at']
        );
    }

    http_response_code(200);
    echo json_encode($requests);

} catch (Exception $e) {
    error_log("Get follow requests error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
