<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Auth required
$user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->topic_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Topic ID required"]);
    exit();
}

$topic_id = $conn->real_escape_string($data->topic_id);

try {
    // Check current status
    $checkSql = "SELECT id FROM topic_followers WHERE user_id = :user_id AND topic_id = :topic_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([':user_id' => $user_id, ':topic_id' => $topic_id]);

    if ($checkStmt->rowCount() > 0) {
        // Unfollow
        $sql = "DELETE FROM topic_followers WHERE user_id = :user_id AND topic_id = :topic_id";
        $msg = "Topic unfollowed";
        $action = 'unfollow';
        
        // Decrement count
        $conn->query("UPDATE topics SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $topic_id");
    } else {
        // Follow
        $sql = "INSERT INTO topic_followers (user_id, topic_id) VALUES (:user_id, :topic_id)";
        $msg = "Topic followed";
        $action = 'follow';

        // Increment count
        $conn->query("UPDATE topics SET follower_count = follower_count + 1 WHERE id = $topic_id");
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute([':user_id' => $user_id, ':topic_id' => $topic_id]);

    echo json_encode(["message" => $msg, "action" => $action]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
