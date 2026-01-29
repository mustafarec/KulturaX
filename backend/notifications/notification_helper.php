<?php
// backend/notifications/notification_helper.php

function sendRepostNotification($conn, $senderId, $newPostId, $originalPostId, $type)
{
    try {
        // Orijinal gönderi sahibini bul
        $postOwnerQuery = "SELECT user_id FROM posts WHERE id = :post_id";
        $postOwnerStmt = $conn->prepare($postOwnerQuery);
        $postOwnerStmt->bindParam(':post_id', $originalPostId);
        $postOwnerStmt->execute();
        $postOwner = $postOwnerStmt->fetch(PDO::FETCH_ASSOC);

        if ($postOwner) {
            $ownerId = (int) $postOwner['user_id'];

            // Kendine bildirim gelmesini engelle
            if ($ownerId != $senderId) {
                // Gönderen kullanıcı adını al
                $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
                $senderStmt = $conn->prepare($senderQuery);
                $senderStmt->bindParam(':sender_id', $senderId);
                $senderStmt->execute();
                $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
                $senderName = $sender ? $sender['username'] : "Bir kullanıcı";

                $title = ($type === 'quote') ? "Yeni Alıntı" : "Yeni Repost";
                $message = ($type === 'quote')
                    ? "@$senderName gönderini alıntıladı."
                    : "@$senderName gönderini paylaştı.";

                $notifData = json_encode(array(
                    "sender_id" => $senderId,
                    "post_id" => $newPostId,
                    "original_post_id" => $originalPostId
                ));

                $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, :type, :title, :message, :data)";
                $notifStmt = $conn->prepare($notifQuery);
                $notifStmt->bindParam(':user_id', $ownerId);
                $notifStmt->bindParam(':type', $type);
                $notifStmt->bindParam(':title', $title);
                $notifStmt->bindParam(':message', $message);
                $notifStmt->bindParam(':data', $notifData);

                if ($notifStmt->execute()) {
                    if (file_exists(__DIR__ . '/FCM.php')) {
                        include_once __DIR__ . '/FCM.php';
                        $fcm = new FCM($conn);
                        // Async sending via Queue to improve performance
                        $fcm->sendToUserAsync($ownerId, $title, $message, array("type" => $type, "post_id" => $newPostId));
                    }
                }
            }
        }
    } catch (Exception $e) {
        error_log("Notification error: " . $e->getMessage());
    }
}
?>
