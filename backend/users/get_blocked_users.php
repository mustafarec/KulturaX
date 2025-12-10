<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    $query = "SELECT u.id, u.username, u.full_name, u.avatar_url, bu.created_at
              FROM blocked_users bu
              JOIN users u ON bu.blocked_id = u.id
              WHERE bu.blocker_id = :user_id
              ORDER BY bu.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $blocked_users = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        array_push($blocked_users, $row);
    }

    echo json_encode($blocked_users);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
