<?php
require_once '../config.php';

$eventId = isset($_GET['id']) ? $_GET['id'] : '';

if (!defined('TICKETMASTER_API_KEY') || empty(TICKETMASTER_API_KEY)) {
    http_response_code(500);
    echo json_encode(["message" => "Ticketmaster API Key not configured"]);
    exit;
}

if (empty($eventId)) {
    http_response_code(400);
    echo json_encode(["message" => "Event ID is required"]);
    exit;
}

$apiKey = TICKETMASTER_API_KEY;
$url = "https://app.ticketmaster.com/discovery/v2/events/" . urlencode($eventId) . ".json?apikey=" . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development/local testing

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["message" => "Curl Error: " . curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
