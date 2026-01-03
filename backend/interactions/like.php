<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

try {
    $data = json_decode(file_get_contents("php://input"));

    if(!empty($data->post_id)){
        
        // Check if like exists
        $checkQuery = "SELECT id FROM interactions WHERE user_id = :user_id AND post_id = :post_id AND type = 'like'";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->bindParam(':post_id', $data->post_id);
        $checkStmt->execute();

        if($checkStmt->rowCount() > 0){
            // Unlike
            $query = "DELETE FROM interactions WHERE user_id = :user_id AND post_id = :post_id AND type = 'like'";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':post_id', $data->post_id);
            $stmt->execute();
            $liked = false;
        } else {
            // Like
            $query = "INSERT INTO interactions SET user_id = :user_id, post_id = :post_id, type = 'like'";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':post_id', $data->post_id);
            $stmt->execute();
            $liked = true;

            // Bildirim Oluştur
            try {
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

                    // Kendine bildirim gelmesini engelle
                    if ($ownerId != $senderId) {
                        $title = "Yeni Beğeni";
                        $message = "@$senderName gönderini beğendi.";
                        $notifData = json_encode(array("sender_id" => $senderId, "post_id" => $data->post_id));

                        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'like', :title, :message, :data)";
                        $notifStmt = $conn->prepare($notifQuery);
                        $notifStmt->bindParam(':user_id', $ownerId);
                        $notifStmt->bindParam(':title', $title);
                        $notifStmt->bindParam(':message', $message);
                        $notifStmt->bindParam(':data', $notifData);
                        
                        if (!$notifStmt->execute()) {
                            $errorInfo = $notifStmt->errorInfo();
                            error_log("Failed to insert like notification: " . implode(" ", $errorInfo));
                        } else {
                            // DB kaydı başarılı, şimdi Push Bildirim gönder
                            if (file_exists('../notifications/FCM.php')) {
                                include_once '../notifications/FCM.php';
                                $fcm = new FCM($conn);
                                $fcm->sendToUser($ownerId, $title, $message, array("type" => "like", "post_id" => $data->post_id));
                            } else {
                                error_log("FCM.php not found");
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                // Bildirim hatası akışı bozmamalı
                error_log("Notification error in like.php: " . $e->getMessage());
            }
        }

        // Get updated like count
        $countQuery = "SELECT COUNT(*) as count FROM interactions WHERE post_id = :post_id AND type = 'like'";
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bindParam(':post_id', $data->post_id);
        $countStmt->execute();
        $row = $countStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(array("liked" => $liked, "count" => $row['count']));
    }
    else{
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
