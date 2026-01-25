<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// Production: Hata gösterimi kapalı
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

$userId = requireAuth();
$action = $_GET['action'] ?? '';

if ($action === 'toggle') {
    $data = json_decode(file_get_contents('php://input'), true);
    $postId = $data['post_id'] ?? 0;

    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID required']);
        exit;
    }

    // Check if exists
    $stmt = $conn->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?");
    $stmt->execute([$userId, $postId]);
    $exists = $stmt->fetch();

    if ($exists) {
        $stmt = $conn->prepare("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?");
        $stmt->execute([$userId, $postId]);
        echo json_encode(['saved' => false]);
    } else {
        $stmt = $conn->prepare("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)");
        $stmt->execute([$userId, $postId]);
        echo json_encode(['saved' => true]);
    }
} elseif ($action === 'list') {
    $page = $_GET['page'] ?? 1;
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT p.*, 
            u.username, u.full_name, u.avatar_url,
            p.like_count,
            p.comment_count,
            p.repost_count,
            EXISTS(SELECT 1 FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = ?) as is_liked,
            EXISTS(SELECT 1 FROM posts WHERE original_post_id = p.id AND user_id = ?) as is_reposted,
            EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_saved,

            op.id as op_id,
            op.content as op_content,
            op.source as op_source,
            op.author as op_author,
            op.created_at as op_created_at,
            op.image_url as op_image_url,
            op.content_type as op_content_type,
            op.content_id as op_content_id,
            op.quote_text as op_quote_text,
            op.comment_text as op_comment_text,

            ou.id as op_user_id,
            ou.username as op_username,
            ou.full_name as op_full_name,
            ou.avatar_url as op_avatar_url,

            op.like_count as op_like_count,
            op.comment_count as op_comment_count,
            EXISTS(SELECT 1 FROM interactions WHERE post_id = op.id AND type = 'like' AND user_id = ?) as op_is_liked,
            op.repost_count as op_repost_count,
            EXISTS(SELECT 1 FROM posts WHERE original_post_id = op.id AND user_id = ?) as op_is_reposted,
            EXISTS(SELECT 1 FROM bookmarks WHERE post_id = op.id AND user_id = ?) as op_is_saved

            FROM bookmarks b
            JOIN posts p ON b.post_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN posts op ON p.original_post_id = op.id
            LEFT JOIN users ou ON op.user_id = ou.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(1, $userId);
    $stmt->bindValue(2, $userId);
    $stmt->bindValue(3, $userId);
    $stmt->bindValue(4, $userId);
    $stmt->bindValue(5, $userId);
    $stmt->bindValue(6, $userId);
    $stmt->bindValue(7, $userId);
    $stmt->bindValue(8, (int) $limit, PDO::PARAM_INT);
    $stmt->bindValue(9, (int) $offset, PDO::PARAM_INT);
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process JSON fields if necessary
    foreach ($posts as &$post) {
        $post['is_liked'] = $post['is_liked'] > 0;
        $post['is_reposted'] = $post['is_reposted'] > 0;
        $post['is_saved'] = $post['is_saved'] > 0;
        // Add user object structure to match feed format
        $post['user'] = [
            'id' => $post['user_id'],
            'username' => $post['username'],
            'full_name' => $post['full_name'],
            'avatar_url' => $post['avatar_url']
        ];

        // Structure original_post object if it exists
        if ($post['original_post_id']) {
            $post['original_post'] = array(
                'id' => $post['op_id'],
                'content' => $post['op_content'],
                'quote_text' => $post['op_quote_text'],
                'comment_text' => $post['op_comment_text'],
                'source' => $post['op_source'],
                'author' => $post['op_author'],
                'created_at' => $post['op_created_at'],
                'image_url' => $post['op_image_url'],
                'content_type' => $post['op_content_type'],
                'content_id' => $post['op_content_id'],
                'like_count' => $post['op_like_count'],
                'comment_count' => $post['op_comment_count'],
                'repost_count' => $post['op_repost_count'],
                'is_liked' => $post['op_is_liked'] > 0,
                'is_reposted' => $post['op_is_reposted'] > 0,
                'is_saved' => $post['op_is_saved'] > 0,
                'user' => array(
                    'id' => $post['op_user_id'],
                    'username' => $post['op_username'],
                    'full_name' => $post['op_full_name'],
                    'avatar_url' => $post['op_avatar_url']
                )
            );
        }

        // Cleanup flat fields
        unset($post['op_id'], $post['op_content'], $post['op_quote_text'], $post['op_comment_text']);
        unset($post['op_source'], $post['op_author'], $post['op_created_at'], $post['op_image_url']);
        unset($post['op_content_type'], $post['op_content_id'], $post['op_like_count'], $post['op_comment_count']);
        unset($post['op_repost_count'], $post['op_is_liked'], $post['op_is_reposted'], $post['op_is_saved']);
        unset($post['op_user_id'], $post['op_username'], $post['op_full_name'], $post['op_avatar_url']);
    }

    echo json_encode($posts);
} elseif ($action === 'check') {
    $postId = $_GET['post_id'] ?? 0;
    $stmt = $conn->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?");
    $stmt->execute([$userId, $postId]);
    echo json_encode(['saved' => (bool) $stmt->fetch()]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
}
?>