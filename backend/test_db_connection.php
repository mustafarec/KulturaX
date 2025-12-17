<?php
header("Content-Type: application/json; charset=UTF-8");

// Error reporting open for testing
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    if (!file_exists('config.php')) {
        throw new Exception("config.php file not found in current directory.");
    }

    include_once 'config.php';

    if (isset($conn) && $conn instanceof PDO) {
        $status = $conn->getAttribute(PDO::ATTR_CONNECTION_STATUS);
        echo json_encode([
            "status" => "success", 
            "message" => "Database connection successful.",
            "db_status" => $status
        ]);
    } else {
        throw new Exception("Database connection variable '$conn' is not a valid PDO object.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Connection failed: " . $e->getMessage()
    ]);
}
?>
