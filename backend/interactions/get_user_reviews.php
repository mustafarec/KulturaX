<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : '';

if(empty($user_id)){
    http_response_code(400);
    echo json_encode(array("message" => "Eksik parametreler."));
    exit;
}

try {
    $query = "SELECT 
                r.*, 
                u.username, 
                u.avatar_url,
                u.full_name,
                COALESCE(ul.content_title, r.content_title) as content_title,
                COALESCE(ul.image_url, r.image_url) as image_url
              FROM reviews r
              JOIN users u ON r.user_id = u.id
              LEFT JOIN user_library ul ON r.user_id = ul.user_id 
                  AND r.content_type COLLATE utf8mb4_unicode_ci = ul.content_type COLLATE utf8mb4_unicode_ci 
                  AND r.content_id COLLATE utf8mb4_unicode_ci = ul.content_id COLLATE utf8mb4_unicode_ci
              WHERE r.user_id = :user_id
              ORDER BY r.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $reviews = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        // Kullanıcı bilgisini iç içe obje yapmaktan ziyade düz de gönderebiliriz ama
        // diğer endpointlerle tutarlılık için user objesi içinde gönderelim.
        $row['user'] = array(
            'id' => $row['user_id'],
            'username' => $row['username'],
            'full_name' => $row['full_name'],
            'avatar_url' => $row['avatar_url']
        );
        
        // Ana objeden kullanıcı detaylarını temizle
        unset($row['username']);
        unset($row['full_name']);
        unset($row['avatar_url']);
        
        array_push($reviews, $row);
    }

    echo json_encode($reviews);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
