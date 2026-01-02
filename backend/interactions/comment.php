<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Auth kontrolü
        $userId = requireAuth();
        
        // Rate limiting - 30 yorum/saat
        checkRateLimit($conn, $userId, 'add_comment', 30, 3600);
        
        $data = json_decode(file_get_contents("php://input"));

        // Girdi validasyonu
        if(!isset($data->post_id) || !isset($data->content)){
            http_response_code(400);
            echo json_encode(array("message" => "Eksik veri."));
            exit;
        }
        
        // Post ID validasyonu
        if (!Validator::validateInteger($data->post_id, 1)) {
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz gönderi ID."));
            exit;
        }
        
        // Content validasyonu
        if (!Validator::validateString($data->content, 1, 500)) {
            http_response_code(400);
            echo json_encode(array("message" => "Yorum 1-500 karakter arasında olmalıdır."));
            exit;
        }
        
        // Spam kontrolü
        if (Validator::detectSpam($data->content)) {
            http_response_code(400);
            echo json_encode(array("message" => "Yorumunuz spam olarak tespit edildi."));
            exit;
        }

        $parentId = isset($data->parent_id) ? $data->parent_id : null;

        $query = "INSERT INTO interactions (user_id, post_id, type, content, parent_id) VALUES (:user_id, :post_id, 'comment', :content, :parent_id)";
        $stmt = $conn->prepare($query);
        
        $content = Validator::sanitizeInput($data->content);

        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':post_id', $data->post_id);
        $stmt->bindParam(':content', $content);
        $stmt->bindParam(':parent_id', $parentId);

        if($stmt->execute()){
            http_response_code(201);
            echo json_encode(array("message" => "Yorum eklendi."));

            // Bildirim Oluştur
            try {
                if (file_exists('../notifications/FCM.php')) {
                    include_once '../notifications/FCM.php';
                    $fcm = new FCM($conn);
                }

                // Eğer cevap ise, ana yorum sahibine bildirim gönder
                if ($parentId) {
                    $parentCommentQuery = "SELECT user_id FROM interactions WHERE id = :parent_id";
                    $parentStmt = $conn->prepare($parentCommentQuery);
                    $parentStmt->bindParam(':parent_id', $parentId);
                    $parentStmt->execute();
                    $parentComment = $parentStmt->fetch(PDO::FETCH_ASSOC);

                    if ($parentComment && $parentComment['user_id'] != $userId) {
                        $title = "Yeni Cevap";
                        $message = "Bir kullanıcı yorumuna cevap verdi.";
                        $notifData = json_encode(array("sender_id" => $userId, "post_id" => $data->post_id, "comment_id" => $parentId));
                        
                        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'reply', :title, :message, :data)";
                        $notifStmt = $conn->prepare($notifQuery);
                        $notifStmt->bindParam(':user_id', $parentComment['user_id']);
                        $notifStmt->bindParam(':title', $title);
                        $notifStmt->bindParam(':message', $message);
                        $notifStmt->bindParam(':data', $notifData);
                        
                        if ($notifStmt->execute()) {
                            if (isset($fcm)) {
                                $fcm->sendToUser($parentComment['user_id'], $title, $message, array("type" => "reply", "post_id" => $data->post_id));
                            }
                        } else {
                            file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Reply Notif Insert Error: " . implode(" ", $notifStmt->errorInfo()) . "\n", FILE_APPEND);
                        }
                    }
                }

                // Gönderi sahibini bul
                $postOwnerQuery = "SELECT user_id FROM posts WHERE id = :post_id";
                $postOwnerStmt = $conn->prepare($postOwnerQuery);
                $postOwnerStmt->bindParam(':post_id', $data->post_id);
                $postOwnerStmt->execute();
                $postOwner = $postOwnerStmt->fetch(PDO::FETCH_ASSOC);

                if ($postOwner) {
                    $ownerId = (int)$postOwner['user_id'];
                    $senderId = (int)$userId;
                    
                    // Gönderen kullanıcı adını al
                    $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
                    $senderStmt = $conn->prepare($senderQuery);
                    $senderStmt->bindParam(':sender_id', $senderId);
                    $senderStmt->execute();
                    $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
                    $senderName = $sender ? $sender['username'] : "Bir kullanıcı";
                    
                    file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Comment: Owner $ownerId, Sender $senderId\n", FILE_APPEND);

                    // Kendine bildirim gelmesini engelle
                    if ($ownerId != $senderId) {
                        $title = "Yeni Yorum";
                        $message = "@$senderName gönderine yorum yaptı.";
                        $notifData = json_encode(array("sender_id" => $senderId, "post_id" => $data->post_id));

                        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'comment', :title, :message, :data)";
                        $notifStmt = $conn->prepare($notifQuery);
                        $notifStmt->bindParam(':user_id', $ownerId);
                        $notifStmt->bindParam(':title', $title);
                        $notifStmt->bindParam(':message', $message);
                        $notifStmt->bindParam(':data', $notifData);
                        
                        if ($notifStmt->execute()) {
                            if (isset($fcm)) {
                                $fcm->sendToUser($ownerId, $title, $message, array("type" => "comment", "post_id" => $data->post_id));
                            } else {
                                file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - FCM object not set in comment.php\n", FILE_APPEND);
                            }
                        } else {
                            $errorInfo = $notifStmt->errorInfo();
                            error_log("Failed to insert comment notification: " . implode(" ", $errorInfo));
                            file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Comment Notif Insert Error: " . implode(" ", $errorInfo) . "\n", FILE_APPEND);
                        }
                    } else {
                        file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Comment: Owner same as sender, no notification\n", FILE_APPEND);
                    }
                } else {
                    file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Comment: Post owner not found for post " . $data->post_id . "\n", FILE_APPEND);
                }
            } catch (Exception $e) {
                error_log("Notification error in comment.php: " . $e->getMessage());
                file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Comment Notif Exception: " . $e->getMessage() . "\n", FILE_APPEND);
            }
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Yorum eklenemedi."));
        }
    } elseif ($method === 'GET') {
        $post_id = isset($_GET['post_id']) ? $_GET['post_id'] : die();
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : 0; // Beğeni durumunu kontrol etmek için

        // Yorumları, beğeni sayılarını ve kullanıcının beğenip beğenmediğini çek
        $query = "SELECT i.*, u.username, u.avatar_url,
                  (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = i.id) as like_count,
                  (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = i.id AND cl.user_id = :user_id) as is_liked
                  FROM interactions i 
                  JOIN users u ON i.user_id = u.id 
                  WHERE i.post_id = :post_id AND i.type = 'comment' 
                  ORDER BY i.created_at ASC";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':post_id', $post_id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        $comments = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            // Alt yorumları (cevapları) ayıklamak frontend'e bırakılabilir veya burada ağaç yapısı kurulabilir.
            // Şimdilik düz liste dönüyoruz, parent_id ile frontend eşleştirecek.
            $row['is_liked'] = $row['is_liked'] > 0;
            array_push($comments, $row);
        }

        echo json_encode($comments);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
