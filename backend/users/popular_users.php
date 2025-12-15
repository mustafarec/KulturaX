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

// $conn nesnesi config.php içerisinde oluşturulmuştur.
// Ekstra bir bağlantı fonksiyonuna gerek yoktur.

// Rate Limit Kontrolü
$clientIp = getClientIp();
checkRateLimit($conn, $clientIp, 'popular_users', 300, 60);

try {
    // 1. DENE: Standart şema (name, surname sütunları var varsayımı)
    // Bu sorgu frontend'in beklediği name/surname yapısına en uygun olanıdır.
    $query = "
        SELECT 
            u.id, 
            COALESCE(NULLIF(u.username, ''), '') as username,
            COALESCE(NULLIF(u.name, ''), '') as name,
            COALESCE(NULLIF(u.surname, ''), '') as surname,
            u.avatar_url, 
            (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) as follower_count
        FROM 
            users u
        WHERE 
            u.username IS NOT NULL 
            AND TRIM(u.username) != ''
        ORDER BY 
            follower_count DESC
        LIMIT 20
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users ?: []);

} catch(Exception $e) {
    // 2. DENE (FALLBACK): Eğer yukarıdaki sorgu sütun hatası verirse (örn: name sütunu yoksa)
    // full_name sütununu kullanarak veri çekmeyi dene.
    try {
        $queryFallback = "
            SELECT 
                u.id, 
                COALESCE(NULLIF(u.username, ''), '') as username,
                COALESCE(NULLIF(u.full_name, ''), '') as name,
                '' as surname, -- Frontend surname bekliyor, boş gönderiyoruz
                u.avatar_url, 
                (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) as follower_count
            FROM 
                users u
            WHERE 
                u.username IS NOT NULL 
                AND TRIM(u.username) != ''
            ORDER BY 
                follower_count DESC
            LIMIT 20
        ";

        $stmt = $conn->prepare($queryFallback);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($users ?: []);

    } catch (Exception $e2) {
        // Her iki sorgu da başarısız olursa
        http_response_code(500);
        echo json_encode([
            "message" => "Veri çekilemedi. Lütfen daha sonra tekrar deneyiniz.", 
            "debug_primary" => $e->getMessage(),
            "debug_fallback" => $e2->getMessage()
        ]);
    }
}
?>
