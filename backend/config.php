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

// Spotify API Keys
define('SPOTIFY_CLIENT_ID', '9f168a9782ab454bbd7d2d6572499150');
define('SPOTIFY_CLIENT_SECRET', 'b05f3705eb614afba5f113cd0034e271');
define('SPOTIFY_REDIRECT_URI', 'https://mmreeo.online/api/integrations/spotify_callback.php');

// Last.fm API Keys
define('LASTFM_API_KEY', '2af8256d971b6182268a0139188b0ebb');
define('LASTFM_SHARED_SECRET', 'da780a226d6201805eb0e24866646622');
?>
