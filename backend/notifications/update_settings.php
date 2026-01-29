<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

// Allowed fields
$allowed_fields = ['push_enabled', 'likes', 'comments', 'follows', 'messages', 'reposts'];

// Build update data
$updates = array();
foreach ($allowed_fields as $field) {
    if (isset($data->$field)) {
        $updates[$field] = $data->$field ? 1 : 0;
    }
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(array("message" => "Güncellenecek ayar belirtilmedi."));
    exit;
}

try {
    // Check if settings exist
    $check_query = "SELECT id FROM notification_settings WHERE user_id = :user_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':user_id', $user_id);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        // Update existing
        $set_parts = array();
        foreach ($updates as $key => $value) {
            $set_parts[] = "$key = :$key";
        }
        $set_clause = implode(", ", $set_parts);
        
        $update_query = "UPDATE notification_settings SET $set_clause WHERE user_id = :user_id";
        $update_stmt = $conn->prepare($update_query);
        
        foreach ($updates as $key => $value) {
            $update_stmt->bindValue(":$key", $value);
        }
        $update_stmt->bindParam(':user_id', $user_id);
        $update_stmt->execute();
    } else {
        // Insert new with defaults
        $defaults = array(
            'push_enabled' => 1,
            'likes' => 1,
            'comments' => 1,
            'follows' => 1,
            'messages' => 1,
            'reposts' => 1
        );
        
        // Merge with provided updates
        $final_values = array_merge($defaults, $updates);
        
        $insert_query = "INSERT INTO notification_settings 
                        (user_id, push_enabled, likes, comments, follows, messages, reposts) 
                        VALUES (:user_id, :push_enabled, :likes, :comments, :follows, :messages, :reposts)";
        $insert_stmt = $conn->prepare($insert_query);
        $insert_stmt->bindParam(':user_id', $user_id);
        foreach ($final_values as $key => $value) {
            $insert_stmt->bindValue(":$key", $value);
        }
        $insert_stmt->execute();
    }

    http_response_code(200);
    echo json_encode(array("message" => "Bildirim ayarları güncellendi."));

} catch (Exception $e) {
    error_log("Update notification settings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
