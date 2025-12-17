<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

try {
    // Add is_pinned column if not exists
    $sql = "ALTER TABLE posts ADD COLUMN is_pinned TINYINT(1) DEFAULT 0";
    $conn->exec($sql);
    
    echo json_encode(["message" => "Column 'is_pinned' added successfully."]);

} catch (PDOException $e) {
    if ($e->getCode() == '42S21') { // Duplicate column
        echo json_encode(["message" => "Column 'is_pinned' already exists."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }
}
?>
