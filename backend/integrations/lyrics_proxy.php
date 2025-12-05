<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config.php';
require_once '../rate_limiter.php';
require_once '../lib/cache_manager.php';

// Rate Limiting: 60 requests per minute
$ip = getClientIp();
checkRateLimit($conn, $ip, 'lyrics_api', 60, 60);

$artist = isset($_GET['artist']) ? $_GET['artist'] : '';
$title = isset($_GET['title']) ? $_GET['title'] : '';

if (empty($artist) || empty($title)) {
    http_response_code(400);
    echo json_encode(["error" => "Artist and title are required."]);
    exit;
}

// Cache Check
$cache = new CacheManager($conn);
// Normalize cache key
$cacheKey = "lyrics_" . md5(strtolower(trim($artist)) . "_" . strtolower(trim($title)));
$cacheTTL = 604800; // 1 week (lyrics rarely change)

$cachedData = $cache->get('lyrics', $cacheKey);
if ($cachedData) {
    header('X-Cache-Status: HIT');
    echo json_encode($cachedData);
    exit;
}

if (empty(GENIUS_ACCESS_TOKEN) || GENIUS_ACCESS_TOKEN === 'your_genius_access_token_here') {
    http_response_code(500);
    echo json_encode(["error" => "Genius Access Token is not configured."]);
    exit;
}

// 1. Search for the song on Genius API
$query = $artist . ' ' . $title;
$searchUrl = "https://api.genius.com/search?q=" . rawurlencode($query);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $searchUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . GENIUS_ACCESS_TOKEN
]);
curl_setopt($ch, CURLOPT_USERAGENT, 'KulturaX/1.0');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => "Curl error (Search): " . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(["error" => "Genius API error: $httpCode"]);
    exit;
}

$json = json_decode($response, true);
$hits = $json['response']['hits'] ?? [];

if (empty($hits)) {
    echo json_encode(["lyrics" => ""]); // No song found
    exit;
}

// Find the best match (simplified: take the first hit)
// In a real app, you might compare artist names more closely
$songUrl = $hits[0]['result']['url'];

// 2. Scrape the lyrics page
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $songUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

$html = curl_exec($ch);
$scrapeHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => "Curl error (Scrape): " . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

if ($scrapeHttpCode !== 200) {
    http_response_code($scrapeHttpCode);
    echo json_encode(["error" => "Failed to fetch lyrics page: $scrapeHttpCode"]);
    exit;
}

// 3. Extract lyrics from HTML
// Genius lyrics are usually in containers with class starting with 'Lyrics__Container'
// or sometimes just simple divs in older pages.
// We will use DOMDocument to parse.

$dom = new DOMDocument();
@$dom->loadHTML($html); // Suppress warnings for malformed HTML

$xpath = new DOMXPath($dom);

// Genius uses dynamic class names like 'Lyrics__Container-sc-1ynbvzw-6'
// So we search for divs whose class contains 'Lyrics__Container'
$nodes = $xpath->query("//div[contains(@class, 'Lyrics__Container')]");

$lyrics = "";

if ($nodes->length > 0) {
    foreach ($nodes as $node) {
        // Before getting text, replace <br> with newlines
        // This is a bit tricky with DOMDocument. 
        // A simple way is to iterate children and build text.
        // But simpler: get innerHTML and replace <br> with \n, then strip tags.
        
        // Helper to get innerHTML
        $innerHTML = '';
        foreach ($node->childNodes as $child) {
            $innerHTML .= $dom->saveHTML($child);
        }
        
        // Replace <br> tags with newlines
        $innerHTML = preg_replace('/<br\s*\/?>/i', "\n", $innerHTML);
        
        // Strip other tags
        $text = strip_tags($innerHTML);
        
        $lyrics .= $text . "\n";
    }
} else {
    // Fallback for older pages (lyrics_body)
    $nodesOld = $xpath->query("//div[@class='lyrics']");
    if ($nodesOld->length > 0) {
        $lyrics = $nodesOld->item(0)->textContent;
    }
}

$lyrics = trim($lyrics);

$result = [];
if (empty($lyrics)) {
    // Sometimes scraping fails due to layout changes or anti-scraping
    $result = ["lyrics" => "Lyrics found on Genius but could not be extracted. Link: $songUrl"];
} else {
    $result = ["lyrics" => $lyrics];
}

// Save to Cache (only if we found lyrics or at least a link)
if (!empty($lyrics) || isset($result['lyrics'])) {
    $cache->set('lyrics', $cacheKey, $result, $cacheTTL);
    header('X-Cache-Status: MISS');
}

echo json_encode($result);
?>
