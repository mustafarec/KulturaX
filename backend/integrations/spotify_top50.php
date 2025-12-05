<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

// Debug: Check if config is loaded
if (!defined('SPOTIFY_CLIENT_ID') || !defined('SPOTIFY_CLIENT_SECRET') || empty(SPOTIFY_CLIENT_ID) || empty(SPOTIFY_CLIENT_SECRET)) {
    echo json_encode(array(
        "results" => [], 
        "error_message" => "Spotify credentials are missing in config.",
        "error_status" => 500
    ));
    exit;
}

// Client Credentials Flow with Basic Auth
function getClientCredentialsToken() {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://accounts.spotify.com/api/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Basic ' . base64_encode(SPOTIFY_CLIENT_ID . ':' . SPOTIFY_CLIENT_SECRET),
        'Content-Type: application/x-www-form-urlencoded'
    ));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    return isset($data['access_token']) ? $data['access_token'] : null;
}

$token = getClientCredentialsToken();

if (!$token) {
    http_response_code(500);
    echo json_encode(array(
        "results" => [],
<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

// Debug: Check if config is loaded
if (!defined('SPOTIFY_CLIENT_ID') || !defined('SPOTIFY_CLIENT_SECRET') || empty(SPOTIFY_CLIENT_ID) || empty(SPOTIFY_CLIENT_SECRET)) {
    echo json_encode(array(
        "results" => [], 
        "error_message" => "Spotify credentials are missing in config.",
        "error_status" => 500
    ));
    exit;
}

// Client Credentials Flow with Basic Auth
function getClientCredentialsToken() {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://accounts.spotify.com/api/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Basic ' . base64_encode(SPOTIFY_CLIENT_ID . ':' . SPOTIFY_CLIENT_SECRET),
        'Content-Type: application/x-www-form-urlencoded'
    ));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    return isset($data['access_token']) ? $data['access_token'] : null;
}

$token = getClientCredentialsToken();

if (!$token) {
    http_response_code(500);
    echo json_encode(array(
        "results" => [],
        "error_message" => "Failed to authenticate with Spotify", 
        "details" => "Token generation failed"
    ));
    exit;
}

// Function to fetch data with error handling
function fetchSpotify($url, $token) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Bearer ' . $token));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

$tracks = array();
$source = "None";

// Attempt 1: Direct Playlist (Turkey Top 50)
// ID: 37i9dQZEVXbIVYVBNw9D5K
$playlistId = '37i9dQZEVXbIVYVBNw9D5K';
$data = fetchSpotify("https://api.spotify.com/v1/playlists/$playlistId/tracks?limit=20&market=TR", $token);

if (isset($data['items'])) {
    $source = "Direct Playlist";
    foreach ($data['items'] as $item) {
        $track = $item['track'];
        if (!$track) continue;
        $tracks[] = formatTrack($track);
    }
} 

// Attempt 2: "Top Lists" Category Playlists if Attempt 1 failed
if (empty($tracks)) {
    $catData = fetchSpotify("https://api.spotify.com/v1/browse/categories/toplists/playlists?country=TR&limit=1", $token);
    if (isset($catData['playlists']['items'][0])) {
        $playlistId = $catData['playlists']['items'][0]['id'];
        $data = fetchSpotify("https://api.spotify.com/v1/playlists/$playlistId/tracks?limit=20&market=TR", $token);
        if (isset($data['items'])) {
            $source = "Category TopList";
             foreach ($data['items'] as $item) {
                $track = $item['track'];
                if (!$track) continue;
                $tracks[] = formatTrack($track);
            }
        }
    }
}

// Attempt 3: New Releases (Ultimate Fallback)
if (empty($tracks)) {
    $newReleases = fetchSpotify("https://api.spotify.com/v1/browse/new-releases?country=TR&limit=20", $token);
    if (isset($newReleases['albums']['items'])) {
        $source = "New Releases";
        foreach ($newReleases['albums']['items'] as $album) {
            $tracks[] = array(
                'id' => $album['id'],
                'title' => $album['name'],
                'artist' => isset($album['artists'][0]) ? $album['artists'][0]['name'] : 'Unknown',
                'image' => isset($album['images'][0]) ? $album['images'][0]['url'] : null,
                'preview_url' => null, // Albums don't have track preview in this object
                'uri' => $album['uri']
            );
        }
    }
}

function formatTrack($track) {
    return array(
        'id' => $track['id'],
        'title' => $track['name'],
        'artist' => isset($track['artists'][0]) ? $track['artists'][0]['name'] : 'Unknown',
        'image' => isset($track['album']['images'][0]) ? $track['album']['images'][0]['url'] : null,
        'preview_url' => isset($track['preview_url']) ? $track['preview_url'] : null,
        'uri' => $track['uri']
    );
}

if (!empty($tracks)) {
    echo json_encode(array("results" => $tracks, "debug_source" => $source));
} else {
    http_response_code(404);
    echo json_encode(array(
        "results" => [], 
        "error_message" => "All fetch methods failed."
    ));
}
?>
