<?php
/**
 * Memory-Based Rate Limiter
 * 
 * APCu / Dosya bazlı rate limiting sistemi.
 * Veritabanı kullanmadan yüksek performanslı rate limiting sağlar.
 * 
 * Öncelik sırası:
 * 1. APCu (en hızlı - memory based)
 * 2. Dosya bazlı (fallback - disk based)
 * 
 * @author KültüraX
 * @version 1.0
 */

require_once __DIR__ . '/RedisManager.php';

class MemoryRateLimiter
{
    private static $driver = null;
    private static $cacheDir = null;
    private static $initialized = false;

    // Cache prefix
    const CACHE_PREFIX = 'kulturax_rate_';

    /**
     * Rate limiter'ı başlat
     */
    private static function init()
    {
        if (self::$initialized) {
            return;
        }

        // Driver tespiti
        if (function_exists('apcu_enabled') && apcu_enabled()) {
            self::$driver = 'apcu';
        } else {
            self::$driver = 'file';
            self::$cacheDir = __DIR__ . '/cache/rate_limits';
            if (!is_dir(self::$cacheDir)) {
                mkdir(self::$cacheDir, 0755, true);
            }
        }

        self::$initialized = true;
    }

    /**
     * Rate limit kontrolü
     * 
     * @param string $key Unique identifier (user_id, IP, vb.)
     * @param string $action İşlem tipi (register, post, review, vb.)
     * @param int $limit İzin verilen maksimum istek sayısı
     * @param int $timeWindow Zaman penceresi (saniye)
     * @return bool İzin verilirse true, red edilirse false
     */
    /**
     * Rate limit kontrolü
     * 
     * @param string $key Unique identifier (user_id, IP, vb.)
     * @param string $action İşlem tipi (register, post, review, vb.)
     * @param int $limit İzin verilen maksimum istek sayısı
     * @param int $timeWindow Zaman penceresi (saniye)
     * @return bool İzin verilirse true, red edilirse false
     */
    /**
     * Rate limit kontrolü
     * 
     * @param string $key Unique identifier (user_id, IP, vb.)
     * @param string $action İşlem tipi (register, post, review, vb.)
     * @param int $limit İzin verilen maksimum istek sayısı
     * @param int $timeWindow Zaman penceresi (saniye)
     * @return bool İzin verilirse true, red edilirse false
     */
    public static function check($key, $action, $limit, $timeWindow)
    {
        self::init();

        $cacheKey = self::getCacheKey($key, $action);

        // 1. High-Performance Redis Strategy (Preferred)
        if (class_exists('RedisManager') && RedisManager::isReady()) {
            try {
                $redis = RedisManager::getClient();
                
                // LUA Script for Atomicity (INCR + EXPIRE)
                // This prevents the "Zombie Key" issue where INCR succeeds but EXPIRE fails
                $script = <<<LUA
                    local current = redis.call('INCR', KEYS[1])
                    if tonumber(current) == 1 then
                        redis.call('EXPIRE', KEYS[1], ARGV[1])
                    end
                    return current
LUA;
                
                $current = $redis->eval($script, [$cacheKey, $timeWindow], 1);

                if ($current > $limit) {
                    return false; // Limit exceeded
                }
                return true;
            } catch (Exception $e) {
                // Fallback to File/APCu if Redis fails midway
                error_log("Redis RateLimit Error: " . $e->getMessage());
            }
        }

        $now = time();

        // Callback function to process rate limit logic atomically
        $processor = function ($data) use ($limit, $timeWindow, $now) {
            // Initialize if empty or expired
            if ($data === false || $now > $data['window_end']) {
                return [
                    'count' => 1,
                    'window_start' => $now,
                    'window_end' => $now + $timeWindow,
                    'admitted' => true
                ];
            }

            // Limit check
            if ($data['count'] >= $limit) {
                $data['admitted'] = false;
                return $data;
            }

            // Increment
            $data['count']++;
            $data['admitted'] = true;
            return $data;
        };

        if (self::$driver === 'apcu') {
            // APCu atomic operations are limited, but much faster than file.
            // basic CAS loop could be implemented here for strict correctness, 
            // but standard fetch/store is usually acceptable for rate limiting.
            $data = self::get($cacheKey);
            $newData = $processor($data);
            
            if ($newData['admitted']) {
                $remainingTime = $newData['window_end'] - $now;
                self::set($cacheKey, $newData, $remainingTime > 0 ? $remainingTime : 1);
                return true;
            }
            return false;
        } else {
            // Audit Remediation: Disk-based rate limiting removed (File Locking Hell).
            // If Redis/APCu are unavailable, we fail-open to preserve system availability.
            return true; 
        }
    }

    /**
     * Kalan hak sayısını döndür
     */
    public static function getRemainingAttempts($key, $action, $limit, $timeWindow)
    {
        self::init();

        $cacheKey = self::getCacheKey($key, $action);

        try {
            // Redis optimization
            if (class_exists('RedisManager') && RedisManager::isReady()) {
                $redis = RedisManager::getClient();
                $count = $redis->get($cacheKey);
                if ($count === false) return $limit;
                return max(0, $limit - $count);
            }

            $data = self::get($cacheKey); 
            $now = time();

            if ($data === false || $now > $data['window_end']) {
                return $limit; 
            }

            return max(0, $limit - $data['count']);

        } catch (Exception $e) {
            return $limit;
        }
    }

    /**
     * Limit resetlenene kadar kalan süre (saniye)
     */
    public static function getTimeToReset($key, $action)
    {
        self::init();

        $cacheKey = self::getCacheKey($key, $action);

        try {
            // Redis optimization
            if (class_exists('RedisManager') && RedisManager::isReady()) {
                $redis = RedisManager::getClient();
                $ttl = $redis->ttl($cacheKey);
                return $ttl > 0 ? $ttl : 0;
            }

            $data = self::get($cacheKey);
            $now = time();

            if ($data === false || $now > $data['window_end']) {
                return 0;
            }

            return $data['window_end'] - $now;

        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Cache key oluştur
     */
    private static function getCacheKey($key, $action)
    {
        return self::CACHE_PREFIX . md5($key . ':' . $action);
    }

    /**
     * Cache'den oku
     */
    private static function get($key)
    {
        if (self::$driver === 'apcu') {
            $data = apcu_fetch($key, $success);
            return $success ? $data : false;
        }

        // Dosya bazlı - Shared Lock ile oku
        return self::readFileWithLock($key);
    }

    /**
     * Cache'e yaz
     */
    private static function set($key, $data, $ttl)
    {
        if (self::$driver === 'apcu') {
            apcu_store($key, $data, $ttl);
            return;
        }

        self::writeFileWithLock($key, $data, $ttl);
    }

    /**
     * Atomic Update for File Driver
     * Reads, Processes, and Writes back while holding a lock.
     */
    private static function updateFileWithLock($key, callable $callback)
    {
        $filePath = self::$cacheDir . '/' . $key . '.json';
        
        // Use 'c+' mode: Open for reading and writing; assign file pointer to beginning of file. 
        // If file does not exist, check/create it safely.
        $fp = @fopen($filePath, 'c+'); 

        if (!$fp) return true; // Fail open if FS is readonly

        // Acquire Exclusive Lock - Non-blocking preferred to avoid queuing
        // If we can't get a lock instantly, it means high contention. 
        // For rate limiting, fail-open (allow request) is better than hanging the server.
        // NOTE: We change LOCK_EX to LOCK_EX | LOCK_NB
        if (!flock($fp, LOCK_EX | LOCK_NB)) {
            fclose($fp);
            return true; // Fail open: allow request rather than blocking process
        }

        try {
            // Read
            $content = '';
            while (!feof($fp)) {
                $content .= fread($fp, 8192);
            }

            $data = false;
            $wrapper = json_decode($content, true);
            if ($wrapper && isset($wrapper['expires_at']) && time() <= $wrapper['expires_at']) {
                $data = $wrapper['data'];
            }

            // Process
            $newData = $callback($data);
            $admitted = $newData['admitted'] ?? true;
            unset($newData['admitted']); 

            if ($admitted) {
                $now = time();
                $ttl = ($newData['window_end'] ?? $now) - $now;
                if ($ttl < 1) $ttl = 1;

                $newWrapper = [
                    'data' => $newData,
                    'expires_at' => $now + $ttl
                ];

                // Write
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, json_encode($newWrapper));
            }

            flock($fp, LOCK_UN);
            fclose($fp);

            return $admitted;

        } catch (Exception $e) {
            flock($fp, LOCK_UN);
            fclose($fp);
            return true; 
        }
    }

    /**
     * Dosyadan oku (Shared Lock)
     */
    private static function readFileWithLock($key)
    {
        $filePath = self::$cacheDir . '/' . $key . '.json';

        if (!file_exists($filePath)) {
            return false;
        }

        $fp = fopen($filePath, 'r');
        if (!$fp) return false;

        // Try to get shared lock, but don't wait too long
        if (!flock($fp, LOCK_SH | LOCK_NB)) {
            fclose($fp);
            return false;
        }

        $content = '';
        while (!feof($fp)) {
            $content .= fread($fp, 8192);
        }

        flock($fp, LOCK_UN);
        fclose($fp);

        $wrapper = json_decode($content, true);
        if ($wrapper === null || !isset($wrapper['expires_at'])) {
            @unlink($filePath);
            return false;
        }

        if (time() > $wrapper['expires_at']) {
            @unlink($filePath);
            return false;
        }

        return $wrapper['data'];
    }

    /**
     * Dosyaya yaz (Exclusive Lock)
     */
    private static function writeFileWithLock($key, $data, $ttl)
    {
        $filePath = self::$cacheDir . '/' . $key . '.json';
        $fp = fopen($filePath, 'c+');

        if (!$fp) return;

        if (!flock($fp, LOCK_EX | LOCK_NB)) {
            fclose($fp);
            return;
        }

        $wrapper = [
            'data' => $data,
            'expires_at' => time() + $ttl
        ];

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($wrapper));

        flock($fp, LOCK_UN);
        fclose($fp);
    }

    /**
     * Süresi dolmuş cache dosyalarını temizle (cron için)
     */
    public static function cleanup()
    {
        self::init();

        if (self::$driver !== 'file') {
            return 0; // APCu otomatik temizler
        }

        $deleted = 0;
        $files = glob(self::$cacheDir . '/*.json');
        $now = time();

        foreach ($files as $file) {
            $content = @file_get_contents($file);
            if ($content === false) {
                @unlink($file);
                $deleted++;
                continue;
            }

            $wrapper = json_decode($content, true);
            if ($wrapper === null || !isset($wrapper['expires_at']) || $now > $wrapper['expires_at']) {
                @unlink($file);
                $deleted++;
            }
        }

        return $deleted;
    }

    /**
     * Aktif driver'ı döndür (debug için)
     */
    public static function getDriver()
    {
        self::init();
        return self::$driver;
    }

    /**
     * İstatistikleri al (debug için)
     */
    public static function getStats()
    {
        self::init();

        $stats = [
            'driver' => self::$driver,
        ];

        if (self::$driver === 'file') {
            $files = glob(self::$cacheDir . '/*.json');
            $stats['active_entries'] = count($files);
        } elseif (self::$driver === 'apcu') {
            $info = apcu_cache_info(true);
            $stats['memory_size'] = $info['mem_size'] ?? 0;
            $stats['num_entries'] = $info['num_entries'] ?? 0;
        }

        return $stats;
    }
}

/**
 * Helper fonksiyon - Mevcut checkRateLimit() yerine kullanılabilir
 * Geriye uyumlu interface
 * 
 * @param mixed $conn Veritabanı bağlantısı (artık kullanılmıyor, geriye uyumluluk için)
 * @param string $key
 * @param string $action
 * @param int $limit
 * @param int $timeWindow
 */
function checkMemoryRateLimit($conn, $key, $action, $limit, $timeWindow)
{
    if (!MemoryRateLimiter::check($key, $action, $limit, $timeWindow)) {
        $remaining = MemoryRateLimiter::getRemainingAttempts($key, $action, $limit, $timeWindow);
        $retryAfter = MemoryRateLimiter::getTimeToReset($key, $action);

        error_log("Rate limit exceeded for: $key, action: $action");
        http_response_code(429);
        header("Retry-After: $retryAfter");
        echo json_encode([
            "message" => "Çok fazla istek gönderdiniz. Lütfen $retryAfter saniye sonra tekrar deneyin.",
            "remaining" => $remaining,
            "retry_after" => $retryAfter
        ]);
        exit;
    }
}
?>
