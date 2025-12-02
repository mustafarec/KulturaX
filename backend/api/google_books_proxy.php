<?php
/**
 * Google Books API Proxy
 * Frontend'in API anahtarına erişmesini engeller
 * Auth opsiyonel - public API, sadece anahtarı koruyoruz
 */

header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../rate_limiter.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Rate Limiting: IP başına dakikada 60 istek
$ip = $_SERVER['REMOTE_ADDR'];
checkRateLimit($conn, $ip, 'google_books_api', 60, 60);

// .env dosyasından API anahtarını al (opsiyonel - Google Books public API)
$envFile = __DIR__ . '/../.env';
$googleApiKey = '';
$debugInfo = array();

$debugInfo['env_file_path'] = $envFile;
$debugInfo['env_file_exists'] = file_exists($envFile);

if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
    if ($env === false) {
        $debugInfo['parse_error'] = 'parse_ini_file failed';
    } else {
        $googleApiKey = $env['GOOGLE_BOOKS_API_KEY'] ?? '';
        $debugInfo['key_found'] = isset($env['GOOGLE_BOOKS_API_KEY']);
    }
}

$baseUrl = 'https://www.googleapis.com/books/v1';

try {
    switch ($action) {
        case 'search':
            $query = isset($_GET['query']) ? urlencode($_GET['query']) : '';
            $orderBy = isset($_GET['orderBy']) ? $_GET['orderBy'] : '';

            if (empty($query)) {
                http_response_code(400);
                echo json_encode(array("message" => "Arama sorgusu gerekli."));
                exit;
            }
            
            $url = "$baseUrl/volumes?q=$query&maxResults=20&langRestrict=tr";
            
            if (!empty($orderBy)) {
                $url .= "&orderBy=" . urlencode($orderBy);
            }

            if (!empty($googleApiKey)) {
                $url .= "&key=$googleApiKey";
            }
            break;
            
        case 'details':
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz kitap ID."));
                exit;
            }
            
            $url = "$baseUrl/volumes/$id";
            if (!empty($googleApiKey)) {
                $url .= "?key=$googleApiKey";
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz aksiyon."));
            exit;
    }
    
    // Google Books API'ye istek gönder
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'KitapMuzikFilm/1.0');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "API hatası: " . $e->getMessage(),
        "debug" => $debugInfo
    ));
}
?>
