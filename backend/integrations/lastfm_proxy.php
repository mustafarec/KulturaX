<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$username = isset($_GET['username']) ? $_GET['username'] : null;
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$username && $user_id) {
    // Veritabanından LastFM kullanıcı adını çek (Eğer kaydettiysek - şimdilik basit tutalım, username parametresi bekleyelim)
    // Gelecekte user_integrations tablosuna lastfm username'i de kaydedebiliriz.
    // Şimdilik username zorunlu olsun.
    echo json_encode(array("message" => "Username required"));
    exit;
}

if (!$username) {
    echo json_encode(array("message" => "Username required"));
    exit;
}

$url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" . urlencode($username) . "&api_key=" . LASTFM_API_KEY . "&format=json&limit=1";


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (isset($data['recenttracks']['track'][0])) {
    $track = $data['recenttracks']['track'][0];

    // LastFM "now playing" durumunu '@attr' ile belirtir
    $is_playing = isset($track['@attr']['nowplaying']) && $track['@attr']['nowplaying'] == "true";

    $artist = $track['artist']['#text'];
    $song = $track['name'];
    $image = $track['image'][2]['#text']; // Large image
    if (strpos($image, 'http://') === 0) {
        $image = str_replace('http://', 'https://', $image);
    }

    echo json_encode(array(
        "is_playing" => $is_playing, // LastFM her zaman son şarkıyı döner, çalmıyor olsa bile
        "provider" => "lastfm",
        "track" => $song,
        "artist" => $artist,
        "image" => $image
    ));
} else {
    echo json_encode(array("is_playing" => false));
}
?>
