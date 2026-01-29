<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

try {
    // 1. Setup Table if not exists
    $sql = file_get_contents('../create_user_preferences_table.sql');
    $conn->exec($sql);
    
    echo json_encode(["message" => "User preferences table setup successfully."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
