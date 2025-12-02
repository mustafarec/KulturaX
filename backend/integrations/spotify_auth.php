<?php
include_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die("User ID required");

// State parametresi ile user_id'yi taşıyoruz, böylece callback'te kimin bağlandığını bileceğiz
$state = $user_id; 

$scope = 'user-read-currently-playing user-read-playback-state';

$params = array(
    'response_type' => 'code',
    'client_id' => SPOTIFY_CLIENT_ID,
    'scope' => $scope,
    'redirect_uri' => SPOTIFY_REDIRECT_URI,
    'state' => $state
);

$url = 'https://accounts.spotify.com/authorize?' . http_build_query($params);

header('Location: ' . $url);
exit;
?>
