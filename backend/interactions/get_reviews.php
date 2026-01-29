<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$content_type = isset($_GET['content_type']) ? $_GET['content_type'] : '';
$content_id = isset($_GET['content_id']) ? $_GET['content_id'] : '';

if(empty($content_type) || empty($content_id)){
    http_response_code(400);
    echo json_encode(array("message" => "Eksik parametreler."));
    exit;
}

try {
    $query = "SELECT 
                r.*, 
                u.username, 
                u.avatar_url 
              FROM reviews r
              JOIN users u ON r.user_id = u.id
              WHERE r.content_type = :content_type AND r.content_id = :content_id
              ORDER BY r.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':content_type', $content_type);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->execute();

    $reviews = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        $row['user'] = array(
            'username' => $row['username'],
            'avatar_url' => $row['avatar_url']
        );
        unset($row['username']);
        unset($row['avatar_url']);
        
        array_push($reviews, $row);
    }

    echo json_encode($reviews);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
