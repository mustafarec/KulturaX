<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    echo "Attempting to add 'reason' column...\n";
    
    // Check if column exists first to avoid error if possible, or just try ADD
    // Simple way: just run the ALTER command.
    
    $sql = "ALTER TABLE `feed_feedback` ADD COLUMN `reason` text DEFAULT NULL";
    $conn->exec($sql);
    
    echo json_encode([
        "status" => "success", 
        "message" => "Column 'reason' added successfully."
    ]);

} catch (PDOException $e) {
    // Check if error is "Duplicate column name" (Code 42S21)
    if ($e->getCode() == '42S21') {
        echo json_encode([
            "status" => "success", 
            "message" => "Column 'reason' already exists."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Migration failed: " . $e->getMessage(),
            "code" => $e->getCode()
        ]);
    }
}
?>
