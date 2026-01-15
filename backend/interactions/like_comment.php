<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $userId = requireAuth();
        $data = json_decode(file_get_contents("php://input"));

        if(!isset($data->comment_id)){
            http_response_code(400);
            echo json_encode(array("message" => "Eksik veri."));
            exit;
        }

        // Check if like exists
        $checkQuery = "SELECT id FROM comment_likes WHERE user_id = :user_id AND comment_id = :comment_id";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->bindParam(':comment_id', $data->comment_id);
        $checkStmt->execute();

        $liked = false;

        if($checkStmt->rowCount() > 0){
            // Unlike
            $query = "DELETE FROM comment_likes WHERE user_id = :user_id AND comment_id = :comment_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':comment_id', $data->comment_id);
            $stmt->execute();
            $liked = false;
        } else {
            // Like
            $query = "INSERT INTO comment_likes (user_id, comment_id) VALUES (:user_id, :comment_id)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':comment_id', $data->comment_id);
            $stmt->execute();
            $liked = true;

            // Bildirim Oluştur
            try {
                // Yorum sahibini ve post_id'yi bul
                $commentDetailsQuery = "SELECT user_id, post_id FROM interactions WHERE id = :comment_id";
                $detailsStmt = $conn->prepare($commentDetailsQuery);
                $detailsStmt->bindParam(':comment_id', $data->comment_id);
                $detailsStmt->execute();
                $commentDetails = $detailsStmt->fetch(PDO::FETCH_ASSOC);

                if ($commentDetails) {
                    $ownerId = (int)$commentDetails['user_id'];
                    $postId = (int)$commentDetails['post_id'];
                    $senderId = (int)$userId;

                    // Kendine bildirim gelmesini engelle
                    if ($ownerId != $senderId) {
                        // Gönderen kullanıcı adını al
                        $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
                        $senderStmt = $conn->prepare($senderQuery);
                        $senderStmt->bindParam(':sender_id', $senderId);
                        $senderStmt->execute();
                        $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
                        $senderName = $sender ? $sender['username'] : "Bir kullanıcı";

                        $title = "Yeni Beğeni";
                        $message = "@$senderName yorumunu beğendi.";
                        $notifData = json_encode(array("sender_id" => $senderId, "post_id" => $postId, "comment_id" => $data->comment_id));

                        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'like', :title, :message, :data)";
                        $notifStmt = $conn->prepare($notifQuery);
                        $notifStmt->bindParam(':user_id', $ownerId);
                        $notifStmt->bindParam(':title', $title);
                        $notifStmt->bindParam(':message', $message);
                        $notifStmt->bindParam(':data', $notifData);
                        
                        if ($notifStmt->execute()) {
                            // DB kaydı başarılı, şimdi Push Bildirim gönder
                            if (file_exists('../notifications/FCM.php')) {
                                include_once '../notifications/FCM.php';
                                $fcm = new FCM($conn);
                                $fcm->sendToUser($ownerId, $title, $message, array("type" => "like", "post_id" => $postId));
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                // Bildirim hatası akışı bozmamalı
                error_log("Notification error in like_comment.php: " . $e->getMessage());
            }
        }

        // Get updated like count
        $countQuery = "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = :comment_id";
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bindParam(':comment_id', $data->comment_id);
        $countStmt->execute();
        $row = $countStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(array("liked" => $liked, "count" => $row['count']));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
