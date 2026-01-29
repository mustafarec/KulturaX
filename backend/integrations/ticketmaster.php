<?php
require_once '../config.php';

$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '';
$city = isset($_GET['city']) ? $_GET['city'] : '';
$page = isset($_GET['page']) ? $_GET['page'] : 0;

if (!defined('TICKETMASTER_API_KEY') || empty(TICKETMASTER_API_KEY)) {
    http_response_code(500);
    echo json_encode(["message" => "Ticketmaster API Key not configured"]);
    exit;
}

$apiKey = TICKETMASTER_API_KEY;
$baseUrl = "https://app.ticketmaster.com/discovery/v2/events.json";

$params = [
    'apikey' => $apiKey,
    'keyword' => $keyword,
    'city' => $city,
    'countryCode' => 'TR',
    'classificationName' => 'Music',
    'sort' => 'date,asc',
    'startDateTime' => '2000-01-01T00:00:00Z', // Include past events
    'page' => $page,
    'size' => 20
];

// Remove empty params
$params = array_filter($params, function($value) {
    return $value !== '';
});

$queryString = http_build_query($params);
$url = $baseUrl . "?" . $queryString;

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
