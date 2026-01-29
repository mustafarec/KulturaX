<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    // Get existing settings or return defaults
    $query = "SELECT push_enabled, likes, comments, follows, messages, reposts 
              FROM notification_settings 
              WHERE user_id = :user_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        // Convert to boolean
        $settings = array(
            "push_enabled" => (bool)$settings['push_enabled'],
            "likes" => (bool)$settings['likes'],
            "comments" => (bool)$settings['comments'],
            "follows" => (bool)$settings['follows'],
            "messages" => (bool)$settings['messages'],
            "reposts" => (bool)$settings['reposts']
        );
    } else {
        // Return defaults if no settings exist
        $settings = array(
            "push_enabled" => true,
            "likes" => true,
            "comments" => true,
            "follows" => true,
            "messages" => true,
            "reposts" => true
        );
    }

    http_response_code(200);
    echo json_encode($settings);

} catch (Exception $e) {
    error_log("Get notification settings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
