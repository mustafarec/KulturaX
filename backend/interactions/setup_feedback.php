<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

try {
    // 1. Create table if not exists
    $sql = file_get_contents('../create_feedback_table.sql');
    $conn->exec($sql);
    
    // 2. Update columns (ALTER TABLE) just in case table existed with old schema
    // We try to add 'reason' column. If it exists, this might fail or we can check first.
    // Simpler approach for migration: Try to modify the enum and add reason.
    
    try {
        $alterEnum = "ALTER TABLE `feed_feedback` MODIFY COLUMN `feedback_type` enum('interested','not_interested','report','show_more') NOT NULL";
        $conn->exec($alterEnum);
    } catch (Exception $e) {
        // Ignore if already correct or other minor issue, or log it
    }

    try {
        $alterReason = "ALTER TABLE `feed_feedback` ADD COLUMN `reason` text DEFAULT NULL";
        $conn->exec($alterReason);
    } catch (Exception $e) {
        // Ignore if column already exists
    }

    echo json_encode(["message" => "Feedback table setup/updated successfully."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
