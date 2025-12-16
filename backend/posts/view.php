<?php
// backend/posts/view.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config.php';
include_once '../rate_limiter.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

// $conn değişkeni config.php'den geliyor
// $conn = getDB(); 

// Rate Limit: Bir IP saniyede en fazla 5 görüntülenme kaydedebilir (spam koruması)
// view_add eylemi için limit koyuyoruz.
$clientIp = getClientIp();
checkRateLimit($conn, $clientIp, 'view_add', 5, 1);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->post_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Post ID gerekli."]);
    exit();
}

try {
    // 1. Genel Görüntülenme Sayısını Arttır
    $sql = "UPDATE posts SET view_count = view_count + 1 WHERE id = :post_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':post_id', $data->post_id);
    $stmt->execute();

    // 2. Kişisel Görüntülenme Geçmişini Kaydet (Smart Feed için)
    if (isset($data->user_id)) {
        $sqlView = "INSERT IGNORE INTO post_views (user_id, post_id) VALUES (:user_id, :post_id)";
        $stmtView = $conn->prepare($sqlView);
        $stmtView->bindParam(':user_id', $data->user_id);
        $stmtView->bindParam(':post_id', $data->post_id);
        $stmtView->execute();
    }
    
    echo json_encode(["message" => "View counted."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
