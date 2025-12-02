<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$db_name = "trakyali_kitapmuzikfilmapp"; // Veritabanı adınızı buraya yazın
$username = "trakyali_admin"; // Veritabanı kullanıcı adınızı buraya yazın
$password = "Marmara34.?"; // Veritabanı şifrenizi buraya yazın

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(array("message" => "Connection error: " . $exception->getMessage()));
    exit();
}

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
    
    // Spotify API Keys
    define('SPOTIFY_CLIENT_ID', $env['SPOTIFY_CLIENT_ID'] ?? '');
    define('SPOTIFY_CLIENT_SECRET', $env['SPOTIFY_CLIENT_SECRET'] ?? '');
    define('SPOTIFY_REDIRECT_URI', $env['SPOTIFY_REDIRECT_URI'] ?? '');

    // Last.fm API Keys
    define('LASTFM_API_KEY', $env['LASTFM_API_KEY'] ?? '');
    define('LASTFM_SHARED_SECRET', $env['LASTFM_SHARED_SECRET'] ?? '');
} else {
    // Fallback or error logging
    error_log("Config: .env file not found");
}
?>
