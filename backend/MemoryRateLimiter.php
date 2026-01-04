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

class MemoryRateLimiter {
    private static $driver = null;
    private static $cacheDir = null;
    private static $initialized = false;
    
    // Cache prefix
    const CACHE_PREFIX = 'kulturax_rate_';
    
    /**
     * Rate limiter'ı başlat
     */
    private static function init() {
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
    public static function check($key, $action, $limit, $timeWindow) {
        self::init();
        
        $cacheKey = self::getCacheKey($key, $action);
        
        try {
            $data = self::get($cacheKey);
            $now = time();
            
            if ($data === false) {
                // İlk istek - yeni kayıt oluştur
                $data = [
                    'count' => 1,
                    'window_start' => $now,
                    'window_end' => $now + $timeWindow
                ];
                self::set($cacheKey, $data, $timeWindow);
                return true;
            }
            
            // Pencere süresi dolmuş mu?
            if ($now > $data['window_end']) {
                // Yeni pencere başlat
                $data = [
                    'count' => 1,
                    'window_start' => $now,
                    'window_end' => $now + $timeWindow
                ];
                self::set($cacheKey, $data, $timeWindow);
                return true;
            }
            
            // Limit kontrolü
            if ($data['count'] >= $limit) {
                return false; // Limit aşıldı
            }
            
            // Sayacı artır
            $data['count']++;
            $remainingTime = $data['window_end'] - $now;
            self::set($cacheKey, $data, $remainingTime > 0 ? $remainingTime : 1);
            
            return true;
            
        } catch (Exception $e) {
            error_log("MemoryRateLimiter error: " . $e->getMessage());
            // Hata durumunda izin ver (fail-open) - production'da fail-closed tercih edilebilir
            return true;
        }
    }
    
    /**
     * Kalan hak sayısını döndür
     */
    public static function getRemainingAttempts($key, $action, $limit, $timeWindow) {
        self::init();
        
        $cacheKey = self::getCacheKey($key, $action);
        
        try {
            $data = self::get($cacheKey);
            $now = time();
            
            if ($data === false || $now > $data['window_end']) {
                return $limit; // Yeni pencere, tam hak
            }
            
            return max(0, $limit - $data['count']);
            
        } catch (Exception $e) {
            return $limit;
        }
    }
    
    /**
     * Limit resetlenene kadar kalan süre (saniye)
     */
    public static function getTimeToReset($key, $action) {
        self::init();
        
        $cacheKey = self::getCacheKey($key, $action);
        
        try {
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
    private static function getCacheKey($key, $action) {
        // Güvenlik için hash kullan (çok uzun key'leri kısaltır)
        return self::CACHE_PREFIX . md5($key . ':' . $action);
    }
    
    /**
     * Cache'den oku
     */
    private static function get($key) {
        if (self::$driver === 'apcu') {
            $data = apcu_fetch($key, $success);
            return $success ? $data : false;
        }
        
        // Dosya bazlı
        return self::getFromFile($key);
    }
    
    /**
     * Cache'e yaz
     */
    private static function set($key, $data, $ttl) {
        if (self::$driver === 'apcu') {
            apcu_store($key, $data, $ttl);
            return;
        }
        
        // Dosya bazlı
        self::saveToFile($key, $data, $ttl);
    }
    
    /**
     * Dosyadan oku
     */
    private static function getFromFile($key) {
        $filePath = self::$cacheDir . '/' . $key . '.json';
        
        if (!file_exists($filePath)) {
            return false;
        }
        
        $content = @file_get_contents($filePath);
        if ($content === false) {
            return false;
        }
        
        $wrapper = json_decode($content, true);
        if ($wrapper === null || !isset($wrapper['expires_at'])) {
            @unlink($filePath);
            return false;
        }
        
        // TTL kontrolü
        if (time() > $wrapper['expires_at']) {
            @unlink($filePath);
            return false;
        }
        
        return $wrapper['data'];
    }
    
    /**
     * Dosyaya yaz
     */
    private static function saveToFile($key, $data, $ttl) {
        $filePath = self::$cacheDir . '/' . $key . '.json';
        
        $wrapper = [
            'data' => $data,
            'expires_at' => time() + $ttl
        ];
        
        file_put_contents($filePath, json_encode($wrapper), LOCK_EX);
    }
    
    /**
     * Süresi dolmuş cache dosyalarını temizle (cron için)
     */
    public static function cleanup() {
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
    public static function getDriver() {
        self::init();
        return self::$driver;
    }
    
    /**
     * İstatistikleri al (debug için)
     */
    public static function getStats() {
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
function checkMemoryRateLimit($conn, $key, $action, $limit, $timeWindow) {
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
