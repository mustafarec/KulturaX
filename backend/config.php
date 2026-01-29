<?php
// =================================================================
// Environment Configuration with APCu Cache (Performance Optimization)
// =================================================================
$envCacheKey = 'kulturax_env_config';
$envCacheTTL = 300; // 5 dakika

// APCu varsa cache'den oku
// APCu varsa cache'den oku (CLI hariç - Worker her zaman taze config okusun)
if (php_sapi_name() !== 'cli' && function_exists('apcu_enabled') && apcu_enabled()) {
    $env = apcu_fetch($envCacheKey, $success);
    if (!$success) {
        // Cache miss - dosyadan oku ve cache'le
        $envFile = __DIR__ . '/.env';
        if (!file_exists($envFile)) {
            $envFile = dirname(__DIR__) . '/.env';
        }

        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
            if ($env === false) {
                error_log("Config: parse_ini_file failed for .env at $envFile");
                $env = [];
            }
            apcu_store($envCacheKey, $env, $envCacheTTL);
        } else {
            error_log("Config: .env file not found at $envFile");
            $env = [];
        }
    }
} else {
    // APCu yok veya CLI - her seferinde dosyadan oku
    $envFile = __DIR__ . '/.env';
    if (!file_exists($envFile)) {
        $envFile = dirname(__DIR__) . '/.env';
    }

    $env = [];
    if (file_exists($envFile)) {
        $env = parse_ini_file($envFile);
        if ($env === false) {
            error_log("Config: parse_ini_file failed for .env at $envFile");
        }
    } else {
        error_log("Config: .env file not found at $envFile");
    }
}


// Database Configuration
$host = $env['DB_HOST'] ?? 'localhost';
$db_name = $env['DB_NAME'] ?? '';
$username = $env['DB_USER'] ?? '';
$password = $env['DB_PASSWORD'] ?? '';

// API Signature Secret - Will be loaded from .env after env parsing
// Fallback is empty to enforce .env usage for security
define('API_SIGNATURE_SECRET_FALLBACK', '');
define('API_SIGNATURE_TOLERANCE', 300); // 5 minutes tolerance for timestamp
// API Signature Secret from .env
define('API_SIGNATURE_SECRET', $env['API_SIGNATURE_SECRET'] ?? API_SIGNATURE_SECRET_FALLBACK);

// Define API Constants from .env
define('SPOTIFY_CLIENT_ID', $env['SPOTIFY_CLIENT_ID'] ?? '');
define('SPOTIFY_CLIENT_SECRET', $env['SPOTIFY_CLIENT_SECRET'] ?? '');
define('SPOTIFY_REDIRECT_URI', $env['SPOTIFY_REDIRECT_URI'] ?? '');

define('LASTFM_API_KEY', $env['LASTFM_API_KEY'] ?? '');
define('LASTFM_SHARED_SECRET', $env['LASTFM_SHARED_SECRET'] ?? '');

define('GENIUS_ACCESS_TOKEN', $env['GENIUS_ACCESS_TOKEN'] ?? '');
define('TICKETMASTER_API_KEY', $env['TICKETMASTER_API_KEY'] ?? '');

// Redis Configuration
define('REDIS_HOST', $env['REDIS_HOST'] ?? '127.0.0.1');
define('REDIS_PORT', $env['REDIS_PORT'] ?? 6379);
define('REDIS_PASSWORD', $env['REDIS_PASSWORD'] ?? null);

$allowed_origins_raw = $env['ALLOWED_ORIGINS'] ?? "https://mmreeo.online,http://localhost:8081,http://localhost:19000,http://localhost:19006";
$allowed_origins = array_map('trim', explode(',', $allowed_origins_raw));


$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

/**
 * Validate API Signature for mobile app requests
 * Expected format: HMAC-SHA256(timestamp:secret)
 * Header: X-App-Signature: timestamp:signature
 */
function validateApiSignature()
{
    // Skip validation in development (Localhost & Local Network)
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (
        strpos($host, 'localhost') !== false ||
        strpos($host, '127.0.0.1') !== false ||
        strpos($host, '192.168.') === 0 ||
        strpos($host, '10.') === 0
    ) {
        return true;
    }

    $signatureHeader = $_SERVER['HTTP_X_APP_SIGNATURE'] ?? '';
    if (empty($signatureHeader)) {
        return false;
    }

    $parts = explode(':', $signatureHeader);
    if (count($parts) !== 2) {
        return false;
    }

    $timestamp = (int) $parts[0];
    $signature = $parts[1];

    // Check timestamp is within tolerance
    $now = time();
    if (abs($now - $timestamp) > API_SIGNATURE_TOLERANCE) {
        error_log("API Signature: Timestamp expired - now: $now, received: $timestamp");
        return false;
    }

    // Validate signature
    if (empty(API_SIGNATURE_SECRET)) {
        error_log("Security Critical: API_SIGNATURE_SECRET is not set!");
        return false; // Fail secure
    }

    // Reconstruct the message: METHOD:URL:BODY:TIMESTAMP:SECRET
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    // Use REQUEST_URI but strip the domain if present, and handle the fact that client.ts sends the relative path usually
    // However, apiClient.baseURL is 'https://mmreeo.online/api', so config.url is just the relative part like '/auth/login'
    // Backend also needs to know exactly what 'url' was used in the hash. 
    // In axios, config.url is usually the string passed to the request method.
    
    // We need to be careful with URL matching. Let's assume the client sends the path relative to the /api endpoint.
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    // Strip /api prefix if exists to match client-side relative URLs
    $search_path = '/api';
    if (strpos($uri, $search_path) === 0) {
        $uri = substr($uri, strlen($search_path));
    }
    // Ensure URI starts with / for consistency with client getUri()
    if (empty($uri) || $uri[0] !== '/') {
        $uri = '/' . $uri;
    }

    // Remove query params for signature consistency if needed, but client.ts uses the full url property.
    // If config.url has query params, they should be in the hash.
    
    $body = file_get_contents('php://input');
    
    $message = strtoupper($method) . ':' . $uri . ':' . $body . ':' . $timestamp . ':' . API_SIGNATURE_SECRET;
    $expectedSignature = hash_hmac('sha256', $message, API_SIGNATURE_SECRET);

    if (!hash_equals($expectedSignature, $signature)) {
        error_log("API Signature: Invalid signature. Expected for message: $message");
        return false;
    }

    return true;
}

if (in_array($origin, $allowed_origins)) {
    // Bilinen origin - izin ver
    header("Access-Control-Allow-Origin: $origin");
} elseif (empty($origin)) {
    // Origin header yok - muhtemelen mobil uygulama veya sunucu-sunucu isteği
    // Mobil uygulamalar için signature kontrolü yap (production'da)
    // CLI (Worker/Cron) isteklerini hariç tut
    if (php_sapi_name() !== 'cli') {
        if (!validateApiSignature()) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid API signature", "code" => "INVALID_SIGNATURE"]);
            exit();
        }
    }
    // Access-Control-Allow-Origin: * KALDIRILDI
    // Native uygulamalar CORS headerina ihtiyaç duymaz.
    // Web tarayıcıları ise Origin gönderir, bu bloğa girmez.
} else {
    // Bilinmeyen origin - güvenlik için kısıtlı izin
    error_log("Unknown CORS origin attempt: " . $origin);
    header("Access-Control-Allow-Origin: https://mmreeo.online");
}

header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token, X-App-Signature, X-App-Timestamp");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // PDO ile veritabanı bağlantısı - Persistent Connection aktif
    $conn = new PDO(
        "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_PERSISTENT => true,  // Bağlantı yeniden kullanımı
            PDO::ATTR_EMULATE_PREPARES => true,  // Mevcut sorgularla uyumluluk için
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection error"]);
    error_log("Config DB Error: " . $exception->getMessage());
    exit();
}

/**
 * Get Client IP Address
 * Handles Cloudflare and Proxy headers
 */
function getClientIp()
{
    // List of trusted proxy IP ranges (e.g. Cloudflare)
    // In production, this should be maintained/updated.
    static $trustedProxies = [
        '127.0.0.1', '::1'
        // Add Cloudflare IPs here if using CF
    ];

    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
    $isTrusted = false;
    
    foreach ($trustedProxies as $proxy) {
        if ($remoteAddr === $proxy) {
            $isTrusted = true;
            break;
        }
    }

    // Only trust headers if they come from a known proxy
    // NOTE: If not behind a proxy, we should ONLY use REMOTE_ADDR.
    if ($isTrusted) {
        if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
            return $_SERVER["HTTP_CF_CONNECTING_IP"];
        }

        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
    }

    return $remoteAddr;
}
?>
