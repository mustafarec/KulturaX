<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config.php';
include_once '../rate_limiter.php';
include_once '../lib/cache_manager.php';

// Rate Limiting: 100 requests per minute
$ip = getClientIp();
checkRateLimit($conn, $ip, 'spotify_search', 100, 60);

$query = isset($_GET['query']) ? $_GET['query'] : '';

if (empty($query)) {
    echo json_encode(array("results" => []));
    exit;
}

// Cache Check
$cache = new CacheManager($conn);
$cacheKey = "spotify_search_" . md5($query);
$cacheTTL = 86400; // 1 day

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
    echo json_encode(array("error" => "Failed to authenticate with Spotify"));
    exit;
}

$accessToken = $tokenData['access_token'];

// 2. Search for Tracks
$searchUrl = "https://api.spotify.com/v1/search?q=" . urlencode($query) . "&type=track&limit=10";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $searchUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $accessToken
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$searchData = json_decode($response, true);

$results = array();

if (isset($searchData['tracks']['items'])) {
    foreach ($searchData['tracks']['items'] as $track) {
        $image = null;
        if (isset($track['album']['images']) && count($track['album']['images']) > 0) {
            $image = $track['album']['images'][0]['url'];
        }

        $results[] = array(
            "id" => $track['id'],
            "title" => $track['name'],
            "artist" => $track['artists'][0]['name'],
            "album" => $track['album']['name'],
            "image" => $image,
            "preview_url" => $track['preview_url'],
            "external_url" => $track['external_urls']['spotify']
        );
    }
}

$finalResult = array("results" => $results);

// Save to Cache
$cache->set('spotify', $cacheKey, $finalResult, $cacheTTL);
header('X-Cache-Status: MISS');

echo json_encode($finalResult);
?>
