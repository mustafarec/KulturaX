<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

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
    $query = "SELECT 
                p.*, 
                u.username, 
                u.avatar_url,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like') as like_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'comment') as comment_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id) as repost_count,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted
              FROM posts p
              JOIN users u ON p.user_id = u.id
              WHERE p.content_type = :content_type AND p.content_id = :content_id
              ORDER BY p.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':content_type', $content_type);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->execute();

    $posts = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
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
