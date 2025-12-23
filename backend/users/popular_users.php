<?php
// Production: Hata gösterimi kapalı
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

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
    // GELİŞMİŞ POPÜLERLİK ALGORİTMASI
    // Skor = (Takipçi Sayısı * 5) + (Toplam Post Beğenisi * 2) + (Toplam Post Görüntülenmesi * 0.05)
    // view_count sütununun veritabanında var oldugunu varsayıyoruz (schema update uygulandıysa).
    // Eğer view_count henüz yoksa hata vermemesi için COALESCE veya try-catch yapısı kullanılabilir ama
    // performans için doğrudan sorguya yazıyoruz. Schema update yapılmadıysa 500 hatası döner ve
    // fallback devreye girer.

    // Sabit Haftalık Döngü: Çarşamba'dan Çarşamba'ya.
    // Gösterilen: HER ZAMAN tamamlanmış en son hafta.
    $resetDay = 3; // Çarşamba
    $today = date('w');
   
    // Bugünden geriye, en son 'reset günü'ne (Çarşamba) kaç gün geçti?
    $diff = ($today - $resetDay + 7) % 7;
   
    // Bitiş Tarihi: Son geçen Çarşamba 00:00 (veya bugün Çarşamba ise bugün 00:00). 
    // Bu tarih dahildir DEĞİL, buna kadar olanlar. SQL'de < endDate kullanacağız veya 23:59:59.
    // BETWEEN kullanırsak gün sonuna dikkat etmeliyiz. En temizi: >= start AND < end
    $endDate = date('Y-m-d 00:00:00', strtotime("-$diff days"));
   
    // Başlangıç Tarihi: Bitişten 7 gün öncesi
    $startDate = date('Y-m-d 00:00:00', strtotime("$endDate - 7 days"));

    $query = "
        SELECT 
            u.id, 
            COALESCE(NULLIF(u.username, ''), '') as username, 
            COALESCE(NULLIF(u.name, ''), '') as name,
            COALESCE(NULLIF(u.surname, ''), '') as surname,
            u.avatar_url,
            COALESCE(NULLIF(u.header_image_url, ''), '') as header_image_url,
            (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) as follower_count,
            (SELECT COUNT(*) FROM post_views pv JOIN posts p ON pv.post_id = p.id WHERE p.user_id = u.id AND pv.seen_at >= :start_date AND pv.seen_at < :end_date) as total_views,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND created_at >= :start_date AND created_at < :end_date) as post_count,
            (SELECT COUNT(*) FROM interactions i JOIN posts p ON i.post_id = p.id WHERE p.user_id = u.id AND i.type = 'like' AND i.created_at >= :start_date AND i.created_at < :end_date) as total_likes,
            (SELECT COUNT(*) FROM interactions i JOIN posts p ON i.post_id = p.id WHERE p.user_id = u.id AND i.type = 'comment' AND i.created_at >= :start_date AND i.created_at < :end_date) as total_comments,
            (
                SELECT content_type 
                FROM posts 
                WHERE user_id = u.id AND content_type IS NOT NULL AND content_type != ''
                GROUP BY content_type 
                ORDER BY COUNT(*) DESC 
                LIMIT 1
            ) as fav_category,
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
        HAVING 
            total_views > 0
        ORDER BY 
            popularity_score DESC
        LIMIT 20
    ";

    $stmt = $conn->prepare($query);
    $stmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users ?: []);

} catch(Exception $e) {
    // FALLBACK: Eğer view_count sütunu yoksa veya kompleks sorgu hata verirse eski basit sorguya dön
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
            ORDER BY 
                follower_count DESC
            LIMIT 20
        ";

        $stmt = $conn->prepare($queryFallback);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fallback olduğu için kullanıcıya hissettirmeden listeyi dönüyoruz
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
