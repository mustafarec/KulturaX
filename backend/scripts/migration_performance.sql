-- ========================================
-- KültüraX Performance Optimizations
-- Database Migration Script
-- ========================================

-- Notification Queue Table (for async push notifications)
-- Run this on your MySQL server if you want to use database-based queue
-- Alternative: File-based queue (no migration needed)

CREATE TABLE IF NOT EXISTS notification_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    priority ENUM('high', 'normal') DEFAULT 'normal',
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    attempts TINYINT UNSIGNED DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    
    INDEX idx_status_priority (status, priority),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate Limits tablosu için optimize edilmiş indeks (eğer hala DB kullanılacaksa)
-- Not: Yeni MemoryRateLimiter APCu/File kullanıyor, bu opsiyonel

-- Önce indeks var mı kontrol et, varsa atla
-- Bu sorguyu manuel çalıştırabilirsiniz:
-- SHOW INDEX FROM rate_limits WHERE Key_name = 'idx_rate_key_action_time';

-- Eğer indeks yoksa ekle:
CREATE INDEX idx_rate_key_action_time ON rate_limits(rate_key, action, created_at);
-- Not: Eğer "Duplicate key name" hatası alırsanız, indeks zaten mevcut demektir (sorun yok)

-- API Cache tablosu için indeks (opsiyonel)
-- CREATE INDEX idx_service_key_expires ON api_cache(service, cache_key, expires_at);
