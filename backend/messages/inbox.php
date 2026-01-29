<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$user_id = requireAuth();

try {
    $type = isset($_GET['type']) ? $_GET['type'] : 'inbox'; // 'inbox' or 'requests'

    // Ana sorgu mantığı:
    // Inbox: (Takip Edilenler) VEYA (İzin Verilenler)
    // Requests: (Takip Edilmeyenler) VE (İzin Verilmemiş/Reddedilmemiş)

    if ($type === 'requests') {
        // İSTEKLER KUTUSU
        // Karşı taraf beni takip etmiyor OLMALI (Bunu kontrol etmek zor, basitçe: Ben onu takip etmiyorsam ve o beni takip etmiyorsa? 
        // Hayır, kural: "Karşı profil seni takip etmiyorsa mesaj isteği olsun".
        // Yani: Sender (Partner) -> Receiver (User). Partner, User'ı takip etmiyor.
        
        $query = "
            SELECT 
                u.id as chat_partner_id,
                u.username,
                u.avatar_url,
                m.content as last_message,
                m.created_at as last_message_time,
                m.sender_id as last_message_sender_id,
                (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = :user_id AND is_read = 0 AND deleted_by_receiver = 0) as unread_count
            FROM users u
            JOIN (
                SELECT 
                    CASE 
                        WHEN sender_id = :user_id THEN receiver_id 
                        ELSE sender_id 
                    END as partner_id,
                    MAX(id) as max_msg_id
                FROM messages
                WHERE 
                    (sender_id = :user_id AND deleted_by_sender = 0)
                    OR 
                    (receiver_id = :user_id AND deleted_by_receiver = 0)
                GROUP BY partner_id
            ) latest ON u.id = latest.partner_id
            JOIN messages m ON m.id = latest.max_msg_id
            LEFT JOIN follows f ON f.follower_id = u.id AND f.followed_id = :user_id
            LEFT JOIN message_permissions mp ON mp.user_id = :user_id AND mp.partner_id = u.id
            WHERE 
                f.id IS NULL -- Partner, User'ı takip ETMİYOR
                AND (mp.status IS NULL OR mp.status = 'pending') -- İzin verilmemiş (veya pending)
                AND m.sender_id != :user_id -- Son mesajı ben atmadıysam (Ben attıysam istek değildir, benim başlattığım sohbettir)
            ORDER BY m.created_at DESC
        ";
    } else {
        // GELEN KUTUSU (Normal Mesajlar)
        // 1. Partner, User'ı takip ediyor
        // 2. VEYA User, Partner'e izin vermiş (accepted)
        // 3. VEYA Son mesajı User atmış (Kendi başlattığı veya cevap verdiği sohbet)
        
        $query = "
            SELECT 
                u.id as chat_partner_id,
                u.username,
                u.avatar_url,
                m.content as last_message,
                m.created_at as last_message_time,
                m.sender_id as last_message_sender_id,
                (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = :user_id AND is_read = 0 AND deleted_by_receiver = 0) as unread_count
            FROM users u
            JOIN (
                SELECT 
                    CASE 
                        WHEN sender_id = :user_id THEN receiver_id 
                        ELSE sender_id 
                    END as partner_id,
                    MAX(id) as max_msg_id
                FROM messages
                WHERE 
                    (sender_id = :user_id AND deleted_by_sender = 0)
                    OR 
                    (receiver_id = :user_id AND deleted_by_receiver = 0)
                GROUP BY partner_id
            ) latest ON u.id = latest.partner_id
            JOIN messages m ON m.id = latest.max_msg_id
            LEFT JOIN follows f ON f.follower_id = u.id AND f.followed_id = :user_id
            LEFT JOIN message_permissions mp ON mp.user_id = :user_id AND mp.partner_id = u.id
            WHERE 
                (f.id IS NOT NULL) -- Partner beni takip ediyor
                OR (mp.status = 'accepted') -- Veya ben izin vermişim
                OR (m.sender_id = :user_id) -- Veya son mesajı ben atmışım (Cevap vermişim veya başlatmışım)
            ORDER BY m.created_at DESC
        ";
    }

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($conversations);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
