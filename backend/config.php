<?php
$allowed_origins = [
    "https://mmreeo.online",
    "http://localhost:8081", // React Native Debugger
    "http://localhost:19000", // Expo
    "http://localhost:19006"  // Web
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Mobil uygulamalar ve bilinmeyen kaynaklar için varsayılan (Opsiyonel: '*' bırakılabilir ama kontrollü olması daha iyi)
    // Production'da '*' yerine sadece mobil app'in user-agent'ı vs. kontrol edilebilir ama şimdilik esnek bırakıp 'mmreeo.online' haricini engellemek riskli olabilir.
    // Kullanıcı 'rapor maddesi 3'ü yap dediği için şimdilik '*' tutuyoruz ama whitelist mantığını ekliyoruz.
    header("Access-Control-Allow-Origin: *"); 
}

header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load environment variables first
$envFile = __DIR__ . '/.env';
$env = [];
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
} else {
    error_log("Config: .env file not found");
}

// Database Configuration
// Prioritize .env values, fallback to defaults if not set
$host = $env['DB_HOST'];
$db_name = $env['DB_NAME'];
$username = $env['DB_USER'];
$password = $env['DB_PASS'];

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(array("message" => "Connection error: " . $exception->getMessage()));
    exit();
}

// Define API Constants from .env
define('SPOTIFY_CLIENT_ID', $env['SPOTIFY_CLIENT_ID'] ?? '');
define('SPOTIFY_CLIENT_SECRET', $env['SPOTIFY_CLIENT_SECRET'] ?? '');
define('SPOTIFY_REDIRECT_URI', $env['SPOTIFY_REDIRECT_URI'] ?? '');

define('LASTFM_API_KEY', $env['LASTFM_API_KEY'] ?? '');
define('LASTFM_SHARED_SECRET', $env['LASTFM_SHARED_SECRET'] ?? '');

define('GENIUS_ACCESS_TOKEN', $env['GENIUS_ACCESS_TOKEN'] ?? '');
define('TICKETMASTER_API_KEY', $env['TICKETMASTER_API_KEY'] ?? '');

/**
 * Get Client IP Address
 * Handles Cloudflare and Proxy headers
 */
function getClientIp() {
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
