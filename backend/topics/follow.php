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

$topic_id = $data->topic_id;

try {
    // 1. Ensure table exists
    $createTableSql = "CREATE TABLE IF NOT EXISTS topic_followers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        topic_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (user_id, topic_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    )";
    $conn->exec($createTableSql);

    // 2. Check current status
    $checkSql = "SELECT id FROM topic_followers WHERE user_id = :user_id AND topic_id = :topic_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([':user_id' => $user_id, ':topic_id' => $topic_id]);

    if ($checkStmt->rowCount() > 0) {
        // Unfollow
        $sql = "DELETE FROM topic_followers WHERE user_id = :user_id AND topic_id = :topic_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':user_id' => $user_id, ':topic_id' => $topic_id]);

        $msg = "Topic unfollowed";
        $action = 'unfollow';
        
        // Decrement count
        $updateSql = "UPDATE topics SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = :topic_id";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->execute([':topic_id' => $topic_id]);

    } else {
        // Follow
        $sql = "INSERT INTO topic_followers (user_id, topic_id) VALUES (:user_id, :topic_id)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':user_id' => $user_id, ':topic_id' => $topic_id]);

        $msg = "Topic followed";
        $action = 'follow';

        // Increment count
        $updateSql = "UPDATE topics SET follower_count = follower_count + 1 WHERE id = :topic_id";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->execute([':topic_id' => $topic_id]);
    }

    echo json_encode(["message" => $msg, "action" => $action]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
