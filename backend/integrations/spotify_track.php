<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config.php';
include_once '../rate_limiter.php';
include_once '../lib/cache_manager.php';

// Rate Limiting: 300 requests per minute
$ip = getClientIp();
checkRateLimit($conn, $ip, 'spotify_track', 300, 60);

$id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($id)) {
    http_response_code(400);
    echo json_encode(array("error" => "Track ID is required"));
    exit;
}

// Cache Check
$cache = new CacheManager($conn);
$cacheKey = "spotify_track_" . $id;
$cacheTTL = 604800; // 1 week

$cachedData = $cache->get('spotify', $cacheKey);
if ($cachedData) {
    header('X-Cache-Status: HIT');
    echo json_encode($cachedData);
    exit;
}

// 1. Get Access Token (Client Credentials Flow)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://accounts.spotify.com/api/token');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Basic ' . base64_encode(SPOTIFY_CLIENT_ID . ':' . SPOTIFY_CLIENT_SECRET),
    'Content-Type: application/x-www-form-urlencoded'
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$tokenData = json_decode($response, true);

if (!isset($tokenData['access_token'])) {
    http_response_code(500);
    echo json_encode(array("error" => "Failed to authenticate with Spotify"));
    exit;
}

$accessToken = $tokenData['access_token'];

// 2. Get Track Details
$url = "https://api.spotify.com/v1/tracks/" . $id;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $accessToken
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $track = json_decode($response, true);
    
    $image = null;
    if (isset($track['album']['images']) && count($track['album']['images']) > 0) {
        $image = $track['album']['images'][0]['url'];
    }

    $result = array(
        "id" => $track['id'],
        "title" => $track['name'],
        "artist" => $track['artists'][0]['name'],
        "album" => $track['album']['name'],
        "image" => $image,
        "preview_url" => $track['preview_url'],
        "external_url" => $track['external_urls']['spotify']
    );

    // Save to Cache
    $cache->set('spotify', $cacheKey, $result, $cacheTTL);
    header('X-Cache-Status: MISS');

    echo json_encode($result);
} else {
    // Debug logging
    $logFile = 'spotify_debug.txt';
    $logMessage = date('Y-m-d H:i:s') . " - ID: " . $id . " - HTTP Code: " . $httpCode . " - Response: " . $response . "\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);

    http_response_code($httpCode);
    echo json_encode(array("error" => "Spotify API error: " . $httpCode, "details" => $response));
}
?>
