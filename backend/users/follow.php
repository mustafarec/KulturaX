<?php
include_once '../config.php';
include_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->followed_id)) {
    try {
        $targetUserId = (int) $data->followed_id;

        // Cannot follow yourself
        if ($userId == $targetUserId) {
            http_response_code(400);
            echo json_encode(array("message" => "Kendinizi takip edemezsiniz."));
            exit;
        }

        // Check if target user is private
        $privateCheck = "SELECT is_private FROM users WHERE id = :target_id";
        $privateStmt = $conn->prepare($privateCheck);
        $privateStmt->bindParam(':target_id', $targetUserId);
        $privateStmt->execute();
        $targetUser = $privateStmt->fetch(PDO::FETCH_ASSOC);
        $isPrivate = $targetUser && $targetUser['is_private'];

        // Check if already following
        $checkQuery = "SELECT id FROM follows WHERE follower_id = :follower_id AND followed_id = :followed_id";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':follower_id', $userId);
        $checkStmt->bindParam(':followed_id', $targetUserId);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            // Unfollow
            $query = "DELETE FROM follows WHERE follower_id = :follower_id AND followed_id = :followed_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':follower_id', $userId);
            $stmt->bindParam(':followed_id', $targetUserId);
            $stmt->execute();

            echo json_encode(array(
                "is_following" => false,
                "request_status" => null
            ));
        } else {
            // Check if there's a pending request
            $requestCheck = "SELECT id, status FROM follow_requests WHERE requester_id = :requester_id AND target_id = :target_id";
            $requestStmt = $conn->prepare($requestCheck);
            $requestStmt->bindParam(':requester_id', $userId);
            $requestStmt->bindParam(':target_id', $targetUserId);
            $requestStmt->execute();
            $existingRequest = $requestStmt->fetch(PDO::FETCH_ASSOC);

            if ($isPrivate) {
                // Private account - handle request logic
                if ($existingRequest) {
                    if ($existingRequest['status'] === 'pending') {
                        // Cancel the request
                        $deleteRequest = "DELETE FROM follow_requests WHERE id = :id";
                        $delStmt = $conn->prepare($deleteRequest);
                        $delStmt->bindParam(':id', $existingRequest['id']);
                        $delStmt->execute();

                        echo json_encode(array(
                            "is_following" => false,
                            "request_status" => null,
                            "message" => "Takip isteği iptal edildi."
                        ));
                    } else {
                        // Request was rejected, allow re-request
                        $updateRequest = "UPDATE follow_requests SET status = 'pending', updated_at = NOW() WHERE id = :id";
                        $upStmt = $conn->prepare($updateRequest);
                        $upStmt->bindParam(':id', $existingRequest['id']);
                        $upStmt->execute();

                        // Notify target user
                        createFollowRequestNotification($conn, $userId, $targetUserId);

                        echo json_encode(array(
                            "is_following" => false,
                            "request_status" => "pending",
                            "message" => "Takip isteği gönderildi."
                        ));
                    }
                } else {
                    // Create new request
                    $insertRequest = "INSERT INTO follow_requests (requester_id, target_id, status) VALUES (:requester_id, :target_id, 'pending')";
                    $insStmt = $conn->prepare($insertRequest);
                    $insStmt->bindParam(':requester_id', $userId);
                    $insStmt->bindParam(':target_id', $targetUserId);
                    $insStmt->execute();

                    $requestId = $conn->lastInsertId();

                    // Notify target user
                    createFollowRequestNotification($conn, $userId, $targetUserId, $requestId);

                    echo json_encode(array(
                        "is_following" => false,
                        "request_status" => "pending",
                        "message" => "Takip isteği gönderildi."
                    ));
                }
            } else {
                // Public account - direct follow
                $query = "INSERT INTO follows (follower_id, followed_id) VALUES (:follower_id, :followed_id)";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':follower_id', $userId);
                $stmt->bindParam(':followed_id', $targetUserId);
                $stmt->execute();

                // Create follow notification
                createFollowNotification($conn, $userId, $targetUserId);

                echo json_encode(array(
                    "is_following" => true,
                    "request_status" => null
                ));
            }
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}

// FCM include - sadece bir kez yükle
$fcmLoaded = false;
$fcm = null;
if (file_exists('../notifications/FCM.php')) {
    include_once '../notifications/FCM.php';
    $fcmLoaded = true;
}

/**
 * Base notification function - DRY prensibi için
 */
function createNotificationBase($conn, $senderId, $receiverId, $type, $title, $messageTemplate, $extraData = [])
{
    global $fcmLoaded, $fcm;

    try {
        // Sender username'i al
        $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
        $senderStmt = $conn->prepare($senderQuery);
        $senderStmt->bindParam(':sender_id', $senderId);
        $senderStmt->execute();
        $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
        $senderName = $sender ? $sender['username'] : "Bir kullanıcı";

        // Mesajı formatla
        $message = str_replace('{username}', "@$senderName", $messageTemplate);

        // Notification data
        $notifData = array_merge(["sender_id" => $senderId], $extraData);

        // Veritabanına kaydet
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, :type, :title, :message, :data)";
        $notifStmt = $conn->prepare($notifQuery);
        $notifStmt->bindParam(':user_id', $receiverId);
        $notifStmt->bindParam(':type', $type);
        $notifStmt->bindParam(':title', $title);
        $notifStmt->bindParam(':message', $message);
        $dataJson = json_encode($notifData);
        $notifStmt->bindParam(':data', $dataJson);
        $notifStmt->execute();

        // Push Notification gönder
        if ($fcmLoaded) {
            if ($fcm === null) {
                $fcm = new FCM($conn);
            }
            $pushData = array_merge(["type" => $type, "sender_id" => $senderId], $extraData);
            $fcm->sendToUser($receiverId, $title, $message, $pushData);
        }
    } catch (Exception $e) {
        error_log("Notification error in follow.php ($type): " . $e->getMessage());
    }
}

// Helper function to create follow notification
function createFollowNotification($conn, $senderId, $receiverId)
{
    createNotificationBase(
        $conn,
        $senderId,
        $receiverId,
        'follow',
        'Yeni Takipçi',
        '{username} seni takip etmeye başladı.'
    );
}

// Helper function to create follow request notification
function createFollowRequestNotification($conn, $senderId, $receiverId, $requestId = null)
{
    createNotificationBase(
        $conn,
        $senderId,
        $receiverId,
        'follow_request',
        'Takip İsteği',
        '{username} seni takip etmek istiyor.',
        ["request_id" => $requestId]
    );
}
?>