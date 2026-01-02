<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$user_id = requireAuth();

// Token'ı çek
$query = "SELECT * FROM user_integrations WHERE user_id = :user_id AND provider = 'spotify'";
$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();
$integration = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$integration) {
    echo json_encode(array("is_playing" => false, "message" => "Spotify not connected"));
    exit;
}

$access_token = $integration['access_token'];
$refresh_token = $integration['refresh_token'];
$expires_at = strtotime($integration['expires_at']);

// Token süresi dolmuş mu? (5 dakika tolerans)
if (time() > ($expires_at - 300)) {
    // Token yenile
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://accounts.spotify.com/api/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(array(
        'grant_type' => 'refresh_token',
        'refresh_token' => $refresh_token,
        'client_id' => SPOTIFY_CLIENT_ID,
        'client_secret' => SPOTIFY_CLIENT_SECRET
    )));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if (isset($data['access_token'])) {
        $access_token = $data['access_token'];
        $new_expires_in = $data['expires_in'];
        $new_expires_at = date('Y-m-d H:i:s', time() + $new_expires_in);
        
        // Veritabanını güncelle
        $updateQuery = "UPDATE user_integrations SET access_token = :access_token, expires_at = :expires_at WHERE id = :id";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(':access_token', $access_token);
        $updateStmt->bindParam(':expires_at', $new_expires_at);
        $updateStmt->bindParam(':id', $integration['id']);
        $updateStmt->execute();
    }
}

// Şu an çalan şarkıyı çek
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.spotify.com/v1/me/player/currently-playing');
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $access_token
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code == 204 || empty($response)) {
    echo json_encode(array("is_playing" => false));
    exit;
}

$data = json_decode($response, true);

if (isset($data['item'])) {
    $track = $data['item'];
    $artist = $track['artists'][0]['name'];
    $song = $track['name'];
    $album_art = $track['album']['images'][0]['url']; // 640px
    // $album_art_small = $track['album']['images'][2]['url']; // 64px
    
    echo json_encode(array(
        "is_playing" => $data['is_playing'],
        "provider" => "spotify",
        "track" => $song,
        "artist" => $artist,
        "image" => $album_art
    ));
} else {
    echo json_encode(array("is_playing" => false));
}
?>
