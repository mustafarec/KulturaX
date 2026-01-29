<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

// Strict authentication required
// This will exit script if token is invalid or missing
$user_id = requireAuth();

try {
    // Update counts (Simple caching strategy could be better but this ensures accuracy for now)
    // In production, this should be done via cron or triggers, not on every read.
    // Skipping count update for performance in this demo step.

    $query = "SELECT t.*, 
            (SELECT COUNT(*) FROM topic_followers tf WHERE tf.topic_id = t.id AND tf.user_id = :user_id) as is_followed
            FROM topics t
            ORDER BY t.follower_count DESC, t.post_count DESC
            LIMIT 20";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $topics = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['is_followed'] = $row['is_followed'] > 0;
        array_push($topics, $row);
    }

    echo json_encode($topics);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Sunucu hatası: " . $e->getMessage()]);
}
?>
