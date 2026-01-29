<?php
/**
 * Cron Job - Cleanup Rate Limits & Sessions
 * 
 * Bu script periodik olarak (örn: her saat başı veya gece) çalıştırılmalıdır.
 * Veritabanındaki süresi dolmuş rate limit kayıtlarını ve session'ları temizler.
 * 
 * Kullanım:
 * php backend/scripts/cron_cleanup.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../MemoryRateLimiter.php';
require_once __DIR__ . '/../TokenCache.php';

// CLI Kontrolü (Güvenlik)
if (php_sapi_name() !== 'cli') {
    die("This script can only be run from the command line.");
}

echo "Starting cleanup job..." . PHP_EOL;
$start = microtime(true);

try {
    global $conn;

    // 1. Rate Limit Tablosu Temizliği
    // 24 saatten eski kayıtları sil (Rate limit pencereleri genellikle max 1 saattir, 24 saat güvenli marj)
    echo "Cleaning up rate_limits table..." . PHP_EOL;
    $query = "DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $rateLimitCount = $stmt->rowCount();
    echo "Deleted $rateLimitCount old rate limit records." . PHP_EOL;

    // 2. User Sessions Temizliği (Eğer tablo varsa)
    // Gelecekte eklenecek user_sessions tablosu için hazırlık
    try {
        $checkTable = $conn->query("SHOW TABLES LIKE 'user_sessions'");
        if ($checkTable->rowCount() > 0) {
            echo "Cleaning up user_sessions table..." . PHP_EOL;
            $query = "DELETE FROM user_sessions WHERE expires_at < NOW()";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $sessionCount = $stmt->rowCount();
            echo "Deleted $sessionCount expired sessions." . PHP_EOL;
        }
    } catch (Exception $e) {
        echo "Skipping user_sessions cleanup (Table might not exist yet)." . PHP_EOL;
    }

    // 3. File-Based Rate Limiter Temizliği (Redis yoksa)
    echo "Cleaning up file-based rate limit cache..." . PHP_EOL;
    $deletedFiles = MemoryRateLimiter::cleanup();
    echo "Deleted $deletedFiles expired cache files." . PHP_EOL;

    // 4. Token Cache Temizliği
    echo "Cleaning up file-based token cache..." . PHP_EOL;
    $deletedTokens = TokenCache::cleanup();
    echo "Deleted $deletedTokens expired token cache files." . PHP_EOL;

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
    exit(1);
}

$duration = microtime(true) - $start;
echo "Cleanup completed in " . number_format($duration, 4) . " seconds." . PHP_EOL;
