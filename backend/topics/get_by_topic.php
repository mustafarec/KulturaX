<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Auth optional (public topics?) - forcing auth for now for consistency
$user_id = requireAuth();

$topic_id = isset($_GET['topic_id']) ? $_GET['topic_id'] : null;

if (!$topic_id) {
    http_response_code(400);
    echo json_encode(["message" => "Topic ID required"]);
    exit();
}

try {
    // Standard feed query filtered by topic_id using p.topic_id
    // Reusing the structure from get_feed.php but simplified for specific topic
    
    $query = "SELECT 
                p.*, 
                u.username, u.full_name, u.avatar_url,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like') as like_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'comment') as comment_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id) as repost_count,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted,
                (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :user_id) as is_saved
              FROM posts p
              JOIN users u ON p.user_id = u.id
              LEFT JOIN blocked_users bu ON (bu.blocker_id = :user_id AND bu.blocked_id = p.user_id) OR (bu.blocker_id = p.user_id AND bu.blocked_id = :user_id)
              WHERE p.topic_id = :topic_id
              AND bu.id IS NULL
              ORDER BY p.created_at DESC
              LIMIT 50";

    $stmt = $conn->prepare($query);
    $stmt->bindValue(':user_id', $user_id);
    $stmt->bindValue(':topic_id', $topic_id);
    $stmt->execute();

    $posts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Boolean conversion
        $row['is_liked'] = $row['is_liked'] > 0;
        $row['is_reposted'] = $row['is_reposted'] > 0;
        $row['is_saved'] = $row['is_saved'] > 0;
        
        $row['user'] = array(
            'id' => $row['user_id'],
            'username' => $row['username'],
            'full_name' => $row['full_name'],
            'avatar_url' => $row['avatar_url']
        );
        unset($row['username']);
        unset($row['full_name']);
        unset($row['avatar_url']);

        array_push($posts, $row);
    }

    echo json_encode($posts);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
