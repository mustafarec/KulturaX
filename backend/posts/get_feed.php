<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Auth kontrolü - feed görüntüleme için login gerekli
$authenticatedUserId = requireAuth();

// URL'deki user_id parametresi varsa ve auth user ile eşleşmiyorsa, sadece o kullanıcının public içeriğini göster
// Şimdilik basit: tüm feed'i döndür ama like durumunu auth user için hesapla
$user_id = $authenticatedUserId; // Kimlik doğrulanan kullanıcı

try {
    $query = "SELECT 
                p.*, 
                u.username, 
                u.full_name,
                u.avatar_url,
                op.id as op_id,
                op.content as op_content,
                op.source as op_source,
                op.author as op_author,
                op.created_at as op_created_at,
                ou.id as op_user_id,
                ou.username as op_username,
                ou.full_name as op_full_name,
                ou.avatar_url as op_avatar_url,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like') as like_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'comment') as comment_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id) as repost_count,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted,
                
                (SELECT COUNT(*) FROM interactions WHERE post_id = op.id AND type = 'like') as op_like_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = op.id AND type = 'comment') as op_comment_count,
                (SELECT COUNT(*) FROM interactions WHERE post_id = op.id AND type = 'like' AND user_id = :user_id) as op_is_liked,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = op.id) as op_repost_count,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = op.id AND user_id = :user_id) as op_is_reposted,
                
                op.image_url as op_image_url,
                op.content_type as op_content_type,
                op.content_id as op_content_id

              FROM posts p
              JOIN users u ON p.user_id = u.id
              LEFT JOIN posts op ON p.original_post_id = op.id
              LEFT JOIN users ou ON op.user_id = ou.id
              ORDER BY p.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $posts = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        // Convert is_liked and is_reposted to boolean
        $row['is_liked'] = $row['is_liked'] > 0;
        $row['is_reposted'] = $row['is_reposted'] > 0;
        
        // Structure user object
        $row['user'] = array(
            'id' => $row['user_id'],
            'username' => $row['username'],
            'full_name' => $row['full_name'],
            'avatar_url' => $row['avatar_url']
        );

        // Structure original_post object if it exists
        if ($row['original_post_id']) {
            $row['original_post'] = array(
                'id' => $row['op_id'],
                'content' => $row['op_content'],
                'source' => $row['op_source'],
                'author' => $row['op_author'],
                'created_at' => $row['op_created_at'],
                'image_url' => $row['op_image_url'],
                'content_type' => $row['op_content_type'],
                'content_id' => $row['op_content_id'],
                'like_count' => $row['op_like_count'],
                'comment_count' => $row['op_comment_count'],
                'repost_count' => $row['op_repost_count'],
                'is_liked' => $row['op_is_liked'] > 0,
                'is_reposted' => $row['op_is_reposted'] > 0,
                'user' => array(
                    'id' => $row['op_user_id'],
                    'username' => $row['op_username'],
                    'full_name' => $row['op_full_name'],
                    'avatar_url' => $row['op_avatar_url']
                )
            );
        }

        // Remove flat fields to keep clean
        unset($row['username']);
        unset($row['full_name']);
        unset($row['avatar_url']);
        unset($row['op_id']);
        unset($row['op_content']);
        unset($row['op_source']);
        unset($row['op_author']);
        unset($row['op_created_at']);
        unset($row['op_user_id']);
        unset($row['op_username']);
        unset($row['op_full_name']);
        unset($row['op_avatar_url']);
        unset($row['op_image_url']);
        unset($row['op_content_type']);
        unset($row['op_content_id']);
        unset($row['op_like_count']);
        unset($row['op_comment_count']);
        unset($row['op_is_liked']);
        unset($row['op_repost_count']);
        unset($row['op_is_reposted']);
        
        array_push($posts, $row);
    }

    echo json_encode($posts);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
