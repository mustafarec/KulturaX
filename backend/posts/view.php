<?php
// backend/posts/view.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config.php';
include_once '../rate_limiter.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

// Rate Limit: Bir IP saniyede en fazla 5 görüntülenme kaydedebilir (spam koruması)
$clientIp = getClientIp();
checkRateLimit($conn, $clientIp, 'view_add', 5, 1);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->post_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Post ID gerekli."]);
    exit();
}

$postId = $data->post_id;
$userId = isset($data->user_id) ? $data->user_id : null;

try {
    $shouldCountView = true;
    
    // Kullanıcı giriş yapmışsa, son 24 saat içinde bu postu görüntüledi mi kontrol et
    if ($userId) {
        $checkSql = "SELECT id, seen_at FROM post_views 
                     WHERE user_id = :user_id AND post_id = :post_id 
                     LIMIT 1";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->bindParam(':post_id', $postId);
        $checkStmt->execute();
        $existingView = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingView) {
            // Daha önce görüntülemiş - son 24 saat içinde mi?
            $lastSeen = strtotime($existingView['seen_at']);
            $now = time();
            $hoursDiff = ($now - $lastSeen) / 3600;
            
            if ($hoursDiff < 24) {
                // 24 saat içinde tekrar görüntülemiş - view_count artırma
                $shouldCountView = false;
            } else {
                // 24 saatten fazla olmuş - seen_at güncelle ve view_count artır
                $updateSql = "UPDATE post_views SET seen_at = NOW() WHERE id = :id";
                $updateStmt = $conn->prepare($updateSql);
                $updateStmt->bindParam(':id', $existingView['id']);
                $updateStmt->execute();
            }
        } else {
            // İlk kez görüntülüyor - kaydet
            $insertSql = "INSERT INTO post_views (user_id, post_id, seen_at) VALUES (:user_id, :post_id, NOW())";
            $insertStmt = $conn->prepare($insertSql);
            $insertStmt->bindParam(':user_id', $userId);
            $insertStmt->bindParam(':post_id', $postId);
            $insertStmt->execute();
        }
    }
    
    // view_count'u artır (sadece yeni görüntüleme ise)
    if ($shouldCountView) {
        $sql = "UPDATE posts SET view_count = view_count + 1 WHERE id = :post_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':post_id', $postId);
        $stmt->execute();
    }
    
    echo json_encode([
        "message" => "View counted.",
        "counted" => $shouldCountView
    ]);
} catch (Exception $e) {
    error_log("View error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>

