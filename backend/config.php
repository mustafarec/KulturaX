<?php
// =================================================================
// Environment Configuration with APCu Cache (Performance Optimization)
// =================================================================
$envCacheKey = 'kulturax_env_config';
$envCacheTTL = 300; // 5 dakika

// APCu varsa cache'den oku
if (function_exists('apcu_enabled') && apcu_enabled()) {
    $env = apcu_fetch($envCacheKey, $success);
    if (!$success) {
        // Cache miss - dosyadan oku ve cache'le
        $envFile = __DIR__ . '/.env';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
            apcu_store($envCacheKey, $env, $envCacheTTL);
        } else {
            error_log("Config: .env file not found");
            $env = [];
        }
    }
} else {
    // APCu yok - her seferinde dosyadan oku
    $envFile = __DIR__ . '/.env';
    $env = [];
    if (file_exists($envFile)) {
        $env = parse_ini_file($envFile);
    } else {
        error_log("Config: .env file not found");
    }
}

// Database Configuration
$host = $env['DB_HOST'] ?? 'localhost';
$db_name = $env['DB_NAME'] ?? '';
$username = $env['DB_USER'] ?? '';
$password = $env['DB_PASS'] ?? '';

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

$allowed_origins = [
    "https://mmreeo.online",
    "http://localhost:8081", // React Native Debugger
    "http://localhost:19000", // Expo
    "http://localhost:19006"  // Web
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

/**
 * Validate API Signature for mobile app requests
 * Expected format: HMAC-SHA256(timestamp:secret)
 * Header: X-App-Signature: timestamp:signature
 */
function validateApiSignature()
{
    // Skip validation in development
    if (
        isset($_SERVER['HTTP_HOST']) &&
        (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
            strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false)
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
    $expectedSignature = hash_hmac('sha256', $timestamp . ':' . API_SIGNATURE_SECRET, API_SIGNATURE_SECRET);

    if (!hash_equals($expectedSignature, $signature)) {
        error_log("API Signature: Invalid signature");
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
    // Not: Geçiş sürecinde validation zorunlu değil, sadece log
    if (!validateApiSignature()) {
        // Geçiş sürecinde sadece uyarı logla, engellemiyoruz
        // İleride bu satırı uncomment ederek zorunlu yapabilirsiniz:
        // http_response_code(401);
        // echo json_encode(["error" => "Invalid API signature"]);
        // exit();
    }
    header("Access-Control-Allow-Origin: *");
} else {
    // Bilinmeyen origin - güvenlik için kısıtlı izin
    error_log("Unknown CORS origin attempt: " . $origin);
    header("Access-Control-Allow-Origin: https://mmreeo.online");
}

header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token, X-App-Signature, X-App-Timestamp");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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
    if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
        $_SERVER['REMOTE_ADDR'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
        return $_SERVER["HTTP_CF_CONNECTING_IP"];
    }

    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Handle multiple IPs in X-Forwarded-For (take the first one)
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }

    return $_SERVER['REMOTE_ADDR'];
}
?>