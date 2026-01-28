<?php
// Migration: Create mail_queue table
require_once __DIR__ . '/../config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS mail_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_email VARCHAR(191) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        alt_body TEXT NULL,
        from_name VARCHAR(100) NULL,
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        attempts INT DEFAULT 0,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $conn->exec($sql);
    echo "Migration successful: mail_queue table created.\n";

} catch (PDOException $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
?>
