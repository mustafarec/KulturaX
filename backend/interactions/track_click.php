<?php
/**
 * Content Click Tracking API
 * 
 * POST: Tıklama kaydet
 * GET: Popüler içerikleri getir
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../rate_limiter.php';

// Rate Limiting
$ip = getClientIp();
checkRateLimit($conn, $ip, 'track_click', 100, 60); // 100 req/min

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        // ==================== TIKLAMAYI KAYDET ====================
        
        // Auth required for tracking
        $user_id = requireAuth();
        
        $data = json_decode(file_get_contents("php://input"));
        
        // Validate required fields
        if (!isset($data->content_type) || !isset($data->content_id)) {
            http_response_code(400);
            echo json_encode(["message" => "content_type ve content_id gerekli."]);
            exit;
        }
        
        $content_type = $data->content_type;
        $content_id = $data->content_id;
        $content_title = isset($data->content_title) ? $data->content_title : null;
        $source_screen = isset($data->source_screen) ? $data->source_screen : null;
        
        // Valid content types
        $valid_types = ['book', 'movie', 'music', 'event', 'lyrics'];
        if (!in_array($content_type, $valid_types)) {
            http_response_code(400);
            echo json_encode(["message" => "Geçersiz content_type."]);
            exit;
        }
        
        // Duplicate click prevention: Same content within 5 minutes won't be counted
        $duplicate_check = "SELECT id FROM content_clicks 
                           WHERE user_id = :user_id 
                           AND content_type = :content_type 
                           AND content_id = :content_id 
                           AND clicked_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                           LIMIT 1";
        
        $check_stmt = $conn->prepare($duplicate_check);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->bindParam(':content_type', $content_type);
        $check_stmt->bindParam(':content_id', $content_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            // Already clicked recently - still return success but don't insert
            http_response_code(200);
            echo json_encode([
                "message" => "OK",
                "tracked" => false,
                "reason" => "duplicate_within_5min"
            ]);
            exit;
        }
        
        // Insert click record
        $insert_query = "INSERT INTO content_clicks (user_id, content_type, content_id, content_title, source_screen) 
                         VALUES (:user_id, :content_type, :content_id, :content_title, :source_screen)";
        
        $stmt = $conn->prepare($insert_query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':content_type', $content_type);
        $stmt->bindParam(':content_id', $content_id);
        $stmt->bindParam(':content_title', $content_title);
        $stmt->bindParam(':source_screen', $source_screen);
        $stmt->execute();
        
        http_response_code(201);
        echo json_encode([
            "message" => "Tıklama kaydedildi.",
            "tracked" => true
        ]);
        
    } elseif ($method === 'GET') {
        // ==================== POPÜLER İÇERİKLERİ GETİR ====================
        
        $content_type = isset($_GET['content_type']) ? $_GET['content_type'] : null;
        $days = isset($_GET['days']) ? intval($_GET['days']) : 7;
        $limit = isset($_GET['limit']) ? min(intval($_GET['limit']), 50) : 20;
        
        // Validate days (max 30)
        $days = min($days, 30);
        
        $query = "SELECT 
                    content_type,
                    content_id,
                    content_title,
                    COUNT(*) as click_count,
                    COUNT(DISTINCT user_id) as unique_users
                  FROM content_clicks
                  WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL :days DAY)";
        
        if ($content_type) {
            $query .= " AND content_type = :content_type";
        }
        
        $query .= " GROUP BY content_type, content_id, content_title
                    ORDER BY click_count DESC
                    LIMIT :limit";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        
        if ($content_type) {
            $stmt->bindParam(':content_type', $content_type);
        }
        
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            "period_days" => $days,
            "total" => count($results),
            "data" => $results
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
    }
    
} catch (PDOException $e) {
    error_log("Track click error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["message" => "Veritabanı hatası."]);
} catch (Exception $e) {
    error_log("Track click error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["message" => "Sunucu hatası."]);
}
?>
