<?php
include_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->follower_id) && !empty($data->followed_id)) {
    try {
        // Check if already following
        $checkQuery = "SELECT id FROM follows WHERE follower_id = :follower_id AND followed_id = :followed_id";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':follower_id', $data->follower_id);
        $checkStmt->bindParam(':followed_id', $data->followed_id);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            // Unfollow
            $query = "DELETE FROM follows WHERE follower_id = :follower_id AND followed_id = :followed_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':follower_id', $data->follower_id);
            $stmt->bindParam(':followed_id', $data->followed_id);
            $stmt->execute();
            $isFollowing = false;
        } else {
            // Follow
            $query = "INSERT INTO follows (follower_id, followed_id) VALUES (:follower_id, :followed_id)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':follower_id', $data->follower_id);
            $stmt->bindParam(':followed_id', $data->followed_id);
            $stmt->execute();
            $isFollowing = true;

            // Create Notification
            try {
                $senderId = (int)$data->follower_id;
                $receiverId = (int)$data->followed_id;

                // Get sender username
                $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
                $senderStmt = $conn->prepare($senderQuery);
                $senderStmt->bindParam(':sender_id', $senderId);
                $senderStmt->execute();
                $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
                $senderName = $sender ? $sender['username'] : "Bir kullanıcı";

                $title = "Yeni Takipçi";
                $message = "@$senderName seni takip etmeye başladı.";
                $notifData = json_encode(array("sender_id" => $senderId));

                $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'follow', :title, :message, :data)";
                $notifStmt = $conn->prepare($notifQuery);
                $notifStmt->bindParam(':user_id', $receiverId);
                $notifStmt->bindParam(':title', $title);
                $notifStmt->bindParam(':message', $message);
                $notifStmt->bindParam(':data', $notifData);
                $notifStmt->execute();

                // Send Push Notification
                if (file_exists('../notifications/OneSignal.php')) {
                    include_once '../notifications/OneSignal.php';
                    $oneSignal = new OneSignal($conn);
                    $oneSignal->sendToUser($receiverId, $title, $message, array("type" => "follow", "sender_id" => $senderId));
                }

            } catch (Exception $e) {
                error_log("Notification error in follow.php: " . $e->getMessage());
            }
        }

        echo json_encode(array("is_following" => $isFollowing));

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
