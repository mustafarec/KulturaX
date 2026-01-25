<?php
/**
 * KulturaX Maintenance Script
 * This script should be run via Cron job every 5-10 minutes.
 * Usage: php maintenance.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../rate_limiter.php';
require_once __DIR__ . '/../TokenCache.php';

echo "KulturaX Maintenance Started [" . date('Y-m-d H:i:s') . "]\n";

try {
    // 1. Clean up old rate limit logs (De-coupled from main API flow for performance)
    $query = "DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    echo "- Rate limit cleanup: " . $stmt->rowCount() . " rows deleted.\n";

    // 2. Clean up file-based token cache
    $deletedTokens = TokenCache::cleanup();
    echo "- Token cache cleanup: $deletedTokens files removed.\n";

    // 3. Clean up expired memory rate limits (file fallback)
    require_once __DIR__ . '/../MemoryRateLimiter.php';
    $deletedMemoryLimits = MemoryRateLimiter::cleanup();
    echo "- Memory rate limit cleanup: $deletedMemoryLimits files removed.\n";

    echo "Maintenance Completed Successfully.\n";

} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
    error_log("Maintenance Script Error: " . $e->getMessage());
    exit(1);
}
