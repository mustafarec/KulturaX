<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$userId = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->request_id) || empty($data->request_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "İstek ID'si gerekli."));
    exit;
}

$requestId = (int)$data->request_id;

try {
    // Verify request exists and belongs to current user
    $checkQuery = "SELECT fr.*, u.username as requester_username 
                   FROM follow_requests fr 
                   JOIN users u ON fr.requester_id = u.id
                   WHERE fr.id = :request_id AND fr.target_id = :user_id AND fr.status = 'pending'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':request_id', $requestId);
    $checkStmt->bindParam(':user_id', $userId);
    $checkStmt->execute();

    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "İstek bulunamadı veya zaten işlendi."));
        exit;
    }

    $request = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $requesterId = $request['requester_id'];

    $conn->beginTransaction();

    // Update request status
    $updateQuery = "UPDATE follow_requests SET status = 'accepted', updated_at = NOW() WHERE id = :request_id";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bindParam(':request_id', $requestId);
    $updateStmt->execute();

    // Create follow
    $followQuery = "INSERT IGNORE INTO follows (follower_id, followed_id) VALUES (:follower_id, :followed_id)";
    $followStmt = $conn->prepare($followQuery);
    $followStmt->bindParam(':follower_id', $requesterId);
    $followStmt->bindParam(':followed_id', $userId);
    $followStmt->execute();

    // Notify requester that their request was accepted
    $myUsername = "";
    $userQuery = "SELECT username FROM users WHERE id = :user_id";
    $userStmt = $conn->prepare($userQuery);
    $userStmt->bindParam(':user_id', $userId);
    $userStmt->execute();
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
    if ($userData) {
        $myUsername = $userData['username'];
    }

    $title = "Takip İsteği Kabul Edildi";
    $message = "@$myUsername takip isteğini kabul etti.";
    $notifData = json_encode(array("target_id" => $userId));

    $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'follow_accepted', :title, :message, :data)";
    $notifStmt = $conn->prepare($notifQuery);
    $notifStmt->bindParam(':user_id', $requesterId);
    $notifStmt->bindParam(':title', $title);
    $notifStmt->bindParam(':message', $message);
    $notifStmt->bindParam(':data', $notifData);
    $notifStmt->execute();

    $conn->commit();

    // Send push
    if (file_exists('../notifications/FCM.php')) {
        include_once '../notifications/FCM.php';
        $fcm = new FCM($conn);
        $fcm->sendToUser($requesterId, $title, $message, array("type" => "follow_accepted", "target_id" => $userId));
    }

    http_response_code(200);
    echo json_encode(array(
        "message" => "İstek kabul edildi.",
        "requester_id" => $requesterId
    ));

} catch (Exception $e) {
    $conn->rollBack();
    error_log("Accept follow request error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
