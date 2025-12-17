<?php
// Hata raporlamasını aktif et (Geliştirme aşamasında)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include '../config.php';
include '../rate_limiter.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Method Not Allowed"]);
    exit();
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid User ID"]);
    exit();
}

// Rate Limit Kontrolü
$clientIp = getClientIp();
checkRateLimit($conn, $clientIp, 'suggested_users', 300, 60);

try {
    // 1. Check Preferences (If user hid this section)
    $prefSql = "SELECT expires_at FROM user_preferences WHERE user_id = :uid AND pref_key = 'hide_suggested_users'";
    $prefStmt = $conn->prepare($prefSql);
    $prefStmt->execute([':uid' => $user_id]);
    $pref = $prefStmt->fetch(PDO::FETCH_ASSOC);

    if ($pref) {
        // Check expiration
        if ($pref['expires_at']) {
             $expiry = new DateTime($pref['expires_at']);
             $now = new DateTime();
             if ($expiry > $now) {
                // Still hidden
                echo json_encode([]);
                exit();
             }
        }
    }
    
    // GELİŞMİŞ POPÜLERLİK ALGORİTMASI (Popular Users kaynaklı)
    // Fark: Zaten takip edilenleri ve kendisini hariç tutar
    
    // Sabit Haftalık Döngü: Çarşamba'dan Çarşamba'ya.
    $resetDay = 3; // Çarşamba
    $today = date('w');
    $diff = ($today - $resetDay + 7) % 7;
    $endDate = date('Y-m-d 00:00:00', strtotime("-$diff days"));
    $startDate = date('Y-m-d 00:00:00', strtotime("$endDate - 7 days"));

    $query = "
        SELECT 
            u.id, 
            COALESCE(NULLIF(u.username, ''), '') as username, 
            COALESCE(NULLIF(u.name, ''), '') as name,
            COALESCE(NULLIF(u.surname, ''), '') as surname,
            u.avatar_url,
            (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) as follower_count,
            (
                (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) * 5 + 
                (SELECT COUNT(*) FROM interactions i JOIN posts p ON i.post_id = p.id WHERE p.user_id = u.id AND i.type = 'like' AND i.created_at >= :start_date AND i.created_at < :end_date) * 2 +
                (SELECT COUNT(*) FROM post_views pv JOIN posts p ON pv.post_id = p.id WHERE p.user_id = u.id AND pv.seen_at >= :start_date AND pv.seen_at < :end_date) * 0.5
            ) as popularity_score
        FROM 
            users u
        WHERE 
            u.username IS NOT NULL 
            AND TRIM(u.username) != ''
            AND u.id != :current_user_id
            AND u.id NOT IN (SELECT followed_id FROM follows WHERE follower_id = :current_user_id)
        ORDER BY 
            popularity_score DESC
        LIMIT 15
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute([':start_date' => $startDate, ':end_date' => $endDate, ':current_user_id' => $user_id]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users ?: []);

} catch(Exception $e) {
    // FALLBACK: Basit takipçi sayısına göre öner
    try {
        $queryFallback = "
            SELECT 
                u.id, 
                COALESCE(NULLIF(u.username, ''), '') as username,
                COALESCE(NULLIF(u.name, ''), NULLIF(u.full_name, ''), '') as name,
                '' as surname, 
                u.avatar_url, 
                (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) as follower_count
            FROM 
                users u
            WHERE 
                u.username IS NOT NULL 
                AND TRIM(u.username) != ''
                AND u.id != :current_user_id
                AND u.id NOT IN (SELECT followed_id FROM follows WHERE follower_id = :current_user_id)
            ORDER BY 
                follower_count DESC
            LIMIT 15
        ";

        $stmt = $conn->prepare($queryFallback);
        $stmt->execute([':current_user_id' => $user_id]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($users ?: []);

    } catch (Exception $e2) {
        http_response_code(500);
        echo json_encode([
            "message" => "Veri çekilemedi.", 
            "error" => $e->getMessage()
        ]);
    }
}
?>
