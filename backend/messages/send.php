<?php
include_once '../config.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->sender_id) &&
    !empty($data->receiver_id) &&
    !empty($data->content)
){
    // 1. Rate Limiting: Kullanıcı başına dakikada 10 mesaj
    checkRateLimit($conn, $data->sender_id, 'send_message', 10, 60);

    // 2. Spam Kontrolü
    if (Validator::detectSpam($data->content)) {
        http_response_code(400);
        echo json_encode(array("message" => "Mesajınız spam içeriyor olabilir."));
        exit;
    }

    $query = "INSERT INTO messages SET sender_id = :sender_id, receiver_id = :receiver_id, content = :content";
    $stmt = $conn->prepare($query);

    // 3. Sanitization
    $data->content = Validator::sanitizeInput($data->content);

    $stmt->bindParam(':sender_id', $data->sender_id);
    $stmt->bindParam(':receiver_id', $data->receiver_id);
    $stmt->bindParam(':content', $data->content);

    if($stmt->execute()){
        http_response_code(201);
        echo json_encode(array("message" => "Message sent."));
        
        // Send Push Notification & Create DB Notification
        try {
            $senderId = (int)$data->sender_id;
            $receiverId = (int)$data->receiver_id;
            
            // Gönderen kullanıcı adını al
            $senderQuery = "SELECT username FROM users WHERE id = :sender_id";
            $senderStmt = $conn->prepare($senderQuery);
            $senderStmt->bindParam(':sender_id', $senderId);
            $senderStmt->execute();
            $sender = $senderStmt->fetch(PDO::FETCH_ASSOC);
            $senderName = $sender ? $sender['username'] : "Biri";
            
            $title = "Yeni Mesaj: @$senderName";
            $message = (strlen($data->content) > 50) ? substr($data->content, 0, 47) . "..." : $data->content;
            
            // 1. Veritabanına Kaydet
            try {
                $notifData = json_encode(array("sender_id" => $senderId));
                $notifQuery = "INSERT INTO notifications (user_id, type, title, message, data) VALUES (:user_id, 'message', :title, :message, :data)";
                $notifStmt = $conn->prepare($notifQuery);
                
                $notifStmt->bindParam(':user_id', $receiverId);
                $notifStmt->bindParam(':title', $title);
                $notifStmt->bindParam(':message', $message);
                $notifStmt->bindParam(':data', $notifData);
                
                if (!$notifStmt->execute()) {
                    $errorInfo = $notifStmt->errorInfo();
                    error_log("Failed to insert message notification: " . implode(" ", $errorInfo));
                    file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Message Notif Insert Error: " . implode(" ", $errorInfo) . "\n", FILE_APPEND);
                }
            } catch (Exception $e) {
                error_log("Notification insert error in send.php: " . $e->getMessage());
                file_put_contents('../debug_log.txt', date('Y-m-d H:i:s') . " - Message Notif Exception: " . $e->getMessage() . "\n", FILE_APPEND);
            }
            
            // 2. Push Bildirim Gönder (OneSignal)
            if (file_exists('../notifications/OneSignal.php')) {
                include_once '../notifications/OneSignal.php';
                $oneSignal = new OneSignal($conn);
                $oneSignal->sendToUser($receiverId, $title, $message, array("type" => "message", "sender_id" => $senderId));
            }
        } catch (Exception $e) {
            error_log("General notification error in send.php: " . $e->getMessage());
        }
    }
    else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to send message."));
    }
}
else{
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
