<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->blocked_id)) {
    $blocked_id = $data->blocked_id;

    if ($user_id == $blocked_id) {
        http_response_code(400);
        echo json_encode(array("message" => "Kendinizi engelleyemezsiniz."));
        exit;
    }

    try {
        $conn->beginTransaction();

        // 1. Add to blocked_users
        $query = "INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (:blocker_id, :blocked_id)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':blocker_id', $user_id);
        $stmt->bindParam(':blocked_id', $blocked_id);
        $stmt->execute();

        // 2. Remove Follows (Mutual)
        // User follows blocked_user
        $queryFull = "DELETE FROM follows WHERE follower_id = :user_id AND followed_id = :blocked_id";
        $stmtFull = $conn->prepare($queryFull);
        $stmtFull->execute([':user_id' => $user_id, ':blocked_id' => $blocked_id]);

        // Blocked_user follows user
        $queryUnfollow = "DELETE FROM follows WHERE follower_id = :blocked_id AND followed_id = :user_id";
        $stmtUnfollow = $conn->prepare($queryUnfollow);
        $stmtUnfollow->execute([':user_id' => $user_id, ':blocked_id' => $blocked_id]);

        $conn->commit();

        echo json_encode(array("message" => "Kullanıcı engellendi."));
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(array("message" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
}
?>
