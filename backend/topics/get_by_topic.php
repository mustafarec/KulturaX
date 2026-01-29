<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

// Auth optional (public topics?) - forcing auth for now for consistency
$user_id = requireAuth();

$topic_id = isset($_GET['topic_id']) ? $_GET['topic_id'] : null;

if (!$topic_id) {
    http_response_code(400);
    echo json_encode(["message" => "Topic ID required"]);
    exit();
}

// Pagination
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
$offset = ($page - 1) * $limit;

try {
    $query = "SELECT 
                p.*, 
                u.username, u.full_name, u.avatar_url,
                p.like_count,
                p.comment_count,
                EXISTS(SELECT 1 FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                p.repost_count,
                EXISTS(SELECT 1 FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted,
                EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = :user_id) as is_saved
              FROM posts p
              JOIN users u ON p.user_id = u.id
              LEFT JOIN blocked_users bu ON (bu.blocker_id = :user_id AND bu.blocked_id = p.user_id) OR (bu.blocker_id = p.user_id AND bu.blocked_id = :user_id)
              WHERE p.topic_id = :topic_id
              AND bu.id IS NULL
              ORDER BY p.created_at DESC
              LIMIT :limit OFFSET :offset";

    $stmt = $conn->prepare($query);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindValue(':topic_id', $topic_id, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
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
