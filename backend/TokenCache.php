<?php
/**
 * Token Cache - Token Doğrulama Önbellekleme Sistemi
 * 
 * Bu sınıf token doğrulama sonuçlarını önbelleğe alarak
 * veritabanı yükünü azaltır.
 * 
 * Desteklenen backend'ler: APCu, Redis, Dosya tabanlı
 * Otomatik fallback mekanizması ile en uygun backend seçilir.
 */

class TokenCache {
    // Cache ayarları
    private static $driver = null;
    private static $ttl = 300; // 5 dakika (saniye)
    private static $cacheDir = null;
    private static $redis = null;
    private static $initialized = false;
    
    // Cache prefix (collision önleme)
    const CACHE_PREFIX = 'kulturax_token_';
    
    /**
     * Cache sistemini başlat
     */
    private static function init() {
        if (self::$initialized) {
            return;
        }
        
        // .env'den ayarları oku
        $envFile = __DIR__ . '/.env';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
            
            if (isset($env['TOKEN_CACHE_TTL'])) {
                self::$ttl = (int)$env['TOKEN_CACHE_TTL'];
            }
            
            $preferredDriver = $env['TOKEN_CACHE_DRIVER'] ?? 'auto';
            if ($preferredDriver !== 'auto') {
                self::$driver = $preferredDriver;
            }
        }
        
        // Otomatik driver tespiti
        if (self::$driver === null) {
            self::$driver = self::detectDriver();
        }
        
        // Driver'a göre başlatma
        if (self::$driver === 'file') {
            self::$cacheDir = __DIR__ . '/cache/tokens';
            if (!is_dir(self::$cacheDir)) {
                mkdir(self::$cacheDir, 0755, true);
            }
        } elseif (self::$driver === 'redis') {
            self::initRedis();
        }
        
        self::$initialized = true;
    }
    
    /**
     * En uygun cache driver'ını tespit et
     */
    private static function detectDriver() {
        // 1. APCu kontrolü (en hızlı)
        if (function_exists('apcu_enabled') && apcu_enabled()) {
            return 'apcu';
        }
        
        // 2. Redis kontrolü
        if (class_exists('Redis')) {
            try {
                $redis = new Redis();
                $envFile = __DIR__ . '/.env';
                $host = 'localhost';
                $port = 6379;
                
                if (file_exists($envFile)) {
                    $env = parse_ini_file($envFile);
                    $host = $env['REDIS_HOST'] ?? 'localhost';
                    $port = (int)($env['REDIS_PORT'] ?? 6379);
                }
                
                if (@$redis->connect($host, $port, 1)) {
                    $redis->close();
                    return 'redis';
                }
            } catch (Exception $e) {
                // Redis bağlanamadı, devam et
            }
        }
        
        // 3. Fallback: Dosya tabanlı
        return 'file';
    }
    
    /**
     * Redis bağlantısını başlat
     */
    private static function initRedis() {
        if (self::$redis !== null) {
            return;
        }
        
        try {
            self::$redis = new Redis();
            
            $envFile = __DIR__ . '/.env';
            $host = 'localhost';
            $port = 6379;
            
            if (file_exists($envFile)) {
                $env = parse_ini_file($envFile);
                $host = $env['REDIS_HOST'] ?? 'localhost';
                $port = (int)($env['REDIS_PORT'] ?? 6379);
            }
            
            self::$redis->connect($host, $port);
        } catch (Exception $e) {
            error_log("TokenCache Redis error: " . $e->getMessage());
            self::$redis = null;
            self::$driver = 'file'; // Fallback
        }
    }
    
    /**
     * Aktif driver'ı döndür
     */
    public static function getDriver() {
        self::init();
        return self::$driver;
    }
    
    /**
     * Cache key oluştur
     */
    private static function getCacheKey($token) {
        // Token'ın hash'ini kullan (güvenlik için)
        return self::CACHE_PREFIX . hash('sha256', $token);
    }
    
    /**
     * Token'ı cache'den al
     * @return array|false Cache'deki veri veya false (bulunamadı/süresi dolmuş)
     */
    public static function get($token) {
        self::init();
        
        $key = self::getCacheKey($token);
        
        try {
            switch (self::$driver) {
                case 'apcu':
                    $data = apcu_fetch($key, $success);
                    return $success ? $data : false;
                    
                case 'redis':
                    if (self::$redis === null) {
                        return false;
                    }
                    $data = self::$redis->get($key);
                    return $data !== false ? json_decode($data, true) : false;
                    
                case 'file':
                default:
                    return self::getFromFile($key);
            }
        } catch (Exception $e) {
            error_log("TokenCache get error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Token'ı cache'e yaz
     * @param string $token
     * @param int $userId
     * @param string $expiresAt Token'ın DB'deki expire tarihi (ISO format)
     */
    public static function set($token, $userId, $expiresAt) {
        self::init();
        
        $key = self::getCacheKey($token);
        $data = [
            'user_id' => $userId,
            'expires_at' => $expiresAt,
            'cached_at' => time()
        ];
        
        try {
            switch (self::$driver) {
                case 'apcu':
                    apcu_store($key, $data, self::$ttl);
                    break;
                    
                case 'redis':
                    if (self::$redis !== null) {
                        self::$redis->setex($key, self::$ttl, json_encode($data));
                    }
                    break;
                    
                case 'file':
                default:
                    self::saveToFile($key, $data);
                    break;
            }
        } catch (Exception $e) {
            error_log("TokenCache set error: " . $e->getMessage());
        }
    }
    
    /**
     * Token'ı cache'den sil (logout, şifre değişikliği vb.)
     */
    public static function invalidate($token) {
        self::init();
        
        $key = self::getCacheKey($token);
        
        try {
            switch (self::$driver) {
                case 'apcu':
                    apcu_delete($key);
                    break;
                    
                case 'redis':
                    if (self::$redis !== null) {
                        self::$redis->del($key);
                    }
                    break;
                    
                case 'file':
                default:
                    self::deleteFile($key);
                    break;
            }
        } catch (Exception $e) {
            error_log("TokenCache invalidate error: " . $e->getMessage());
        }
    }
    
    // ========== Dosya tabanlı cache metodları ==========
    
    /**
     * Dosyadan oku
     */
    private static function getFromFile($key) {
        $filePath = self::$cacheDir . '/' . $key . '.cache';
        
        if (!file_exists($filePath)) {
            return false;
        }
        
        $content = file_get_contents($filePath);
        if ($content === false) {
            return false;
        }
        
        $data = json_decode($content, true);
        if ($data === null) {
            return false;
        }
        
        // TTL kontrolü
        $cachedAt = $data['cached_at'] ?? 0;
        if (time() - $cachedAt > self::$ttl) {
            // Süresi dolmuş, dosyayı sil
            @unlink($filePath);
            return false;
        }
        
        return $data;
    }
    
    /**
     * Dosyaya yaz
     */
    private static function saveToFile($key, $data) {
        $filePath = self::$cacheDir . '/' . $key . '.cache';
        file_put_contents($filePath, json_encode($data), LOCK_EX);
    }
    
    /**
     * Dosyayı sil
     */
    private static function deleteFile($key) {
        $filePath = self::$cacheDir . '/' . $key . '.cache';
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
    
    /**
     * Süresi dolmuş cache dosyalarını temizle (cron job için)
     */
    public static function cleanup() {
        self::init();
        
        if (self::$driver !== 'file') {
            return 0; // APCu ve Redis otomatik temizler
        }
        
        $deleted = 0;
        $files = glob(self::$cacheDir . '/*.cache');
        
        foreach ($files as $file) {
            $content = @file_get_contents($file);
            if ($content === false) {
                @unlink($file);
                $deleted++;
                continue;
            }
            
            $data = json_decode($content, true);
            if ($data === null || !isset($data['cached_at'])) {
                @unlink($file);
                $deleted++;
                continue;
            }
            
            if (time() - $data['cached_at'] > self::$ttl) {
                @unlink($file);
                $deleted++;
            }
        }
        
        return $deleted;
    }
    
    /**
     * Cache istatistiklerini al
     */
    public static function getStats() {
        self::init();
        
        $stats = [
            'driver' => self::$driver,
            'ttl' => self::$ttl
        ];
        
        if (self::$driver === 'file') {
            $files = glob(self::$cacheDir . '/*.cache');
            $stats['cached_tokens'] = count($files);
        } elseif (self::$driver === 'apcu') {
            $info = apcu_cache_info(true);
            $stats['cached_tokens'] = $info['num_entries'] ?? 0;
        } elseif (self::$driver === 'redis' && self::$redis !== null) {
            $keys = self::$redis->keys(self::CACHE_PREFIX . '*');
            $stats['cached_tokens'] = count($keys);
        }
        
        return $stats;
    }
}
?>
