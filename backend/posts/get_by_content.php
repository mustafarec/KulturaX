<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

// Auth kontrolü (isteğe bağlı, giriş yapmamış kullanıcılar da görebilir mi? Şimdilik evet ama like durumu için user_id lazım)
$userId = 0;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    try {
        $userId = requireAuth();
    } catch (Exception $e) {
        // Token geçersizse veya yoksa misafir olarak devam et
        $userId = 0;
    }
}

$content_type = isset($_GET['content_type']) ? $_GET['content_type'] : '';
$content_id = isset($_GET['content_id']) ? $_GET['content_id'] : '';

if (empty($content_type) || empty($content_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "İçerik tipi ve ID gerekli."));
    exit;
}

try {
    // Pagination
    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    $query = "SELECT 
                p.*, 
                u.username, 
                u.avatar_url,
                p.like_count,
                p.comment_count,
                EXISTS(SELECT 1 FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                p.repost_count,
                EXISTS(SELECT 1 FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted
              FROM posts p
              JOIN users u ON p.user_id = u.id
              WHERE p.content_type = :content_type AND p.content_id = :content_id
              ORDER BY p.created_at DESC
              LIMIT :limit OFFSET :offset";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':content_type', $content_type);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $posts = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['is_liked'] = $row['is_liked'] > 0;
        $row['is_reposted'] = $row['is_reposted'] > 0;

        $row['user'] = array(
            'username' => $row['username'],
            'avatar_url' => $row['avatar_url']
        );
        unset($row['username']);
        unset($row['avatar_url']);

        array_push($posts, $row);
    }

    echo json_encode($posts);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
