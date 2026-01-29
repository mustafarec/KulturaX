<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    $query = "SELECT m.id, m.muted_id, m.created_at, 
                     u.username, u.full_name, u.avatar_url
              FROM muted_users m
              JOIN users u ON m.muted_id = u.id
              WHERE m.user_id = :user_id
              ORDER BY m.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $muted_users = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $muted_users[] = array(
            "id" => intval($row['muted_id']),
            "username" => $row['username'],
            "full_name" => $row['full_name'],
            "avatar_url" => $row['avatar_url'],
            "muted_at" => $row['created_at']
        );
    }

    http_response_code(200);
    echo json_encode($muted_users);

} catch (Exception $e) {
    error_log("Get muted users error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
