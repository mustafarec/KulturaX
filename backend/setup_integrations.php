<?php
include_once 'config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS user_integrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider ENUM('spotify', 'lastfm') NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        expires_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_provider (user_id, provider)
    )";

    $conn->exec($sql);
    echo "user_integrations tablosu başarıyla oluşturuldu.";
} catch(PDOException $e) {
    echo "Hata: " . $e->getMessage();
}
?>
