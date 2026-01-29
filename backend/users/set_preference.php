<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->key) || !isset($data->value)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing key or value."]);
        exit();
    }

    $key = $data->key;
    $value = $data->value;
    $expires_at = null;

    if (isset($data->expires_in_hours)) {
        $hours = (int)$data->expires_in_hours;
        $expires_at = date('Y-m-d H:i:s', strtotime("+$hours hours"));
    }

    $sql = "INSERT INTO user_preferences (user_id, pref_key, pref_value, expires_at) 
            VALUES (:user_id, :key, :value, :expires_at)
            ON DUPLICATE KEY UPDATE pref_value = :value_update, expires_at = :expires_update";
            
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':key', $key);
    $stmt->bindParam(':value', $value);
    $stmt->bindParam(':expires_at', $expires_at);
    $stmt->bindParam(':value_update', $value);
    $stmt->bindParam(':expires_update', $expires_at);
    
    $stmt->execute();

    echo json_encode(["message" => "Preference saved."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
