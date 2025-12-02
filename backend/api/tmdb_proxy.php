<?php
/**
 * TMDB API Proxy
 * Frontend'in API anahtarına erişmesini engeller
 * Auth opsiyonel - public API, sadece anahtarı koruyoruz
 */

header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../rate_limiter.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Rate Limiting: IP başına dakikada 300 istek
$ip = $_SERVER['REMOTE_ADDR'];
checkRateLimit($conn, $ip, 'tmdb_api', 300, 60);

// .env dosyasından API anahtarını al
$envFile = __DIR__ . '/../.env';
$tmdbApiKey = '';
$debugInfo = array();

$debugInfo['env_file_path'] = $envFile;
$debugInfo['env_file_exists'] = file_exists($envFile);
$debugInfo['env_file_readable'] = is_readable($envFile);

if (file_exists($envFile)) {
    if (is_readable($envFile)) {
        $env = parse_ini_file($envFile);
        if ($env === false) {
            $debugInfo['parse_error'] = 'parse_ini_file failed';
        } else {
            $debugInfo['env_keys'] = array_keys($env);
            $tmdbApiKey = $env['TMDB_API_KEY'] ?? '';
            $debugInfo['key_found'] = isset($env['TMDB_API_KEY']);
            $debugInfo['key_empty'] = empty($tmdbApiKey);
        }
    } else {
        $debugInfo['error'] = 'File not readable';
    }
} else {
    $debugInfo['error'] = 'File does not exist';
}

if (empty($tmdbApiKey)) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "API anahtarı yapılandırılmamış.",
        "debug" => $debugInfo
    ));
    exit;
}

$baseUrl = 'https://api.themoviedb.org/3';

try {
    switch ($action) {
        case 'search':
            $query = isset($_GET['query']) ? urlencode($_GET['query']) : '';
            if (empty($query)) {
                http_response_code(400);
                echo json_encode(array("message" => "Arama sorgusu gerekli."));
                exit;
            }
            $url = "$baseUrl/search/movie?api_key=$tmdbApiKey&query=$query&language=tr-TR";
            break;
            
        case 'details':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz film ID."));
                exit;
            }
            $url = "$baseUrl/movie/$id?api_key=$tmdbApiKey&language=tr-TR&append_to_response=credits";
            break;
            
        case 'trending':
            $url = "$baseUrl/trending/movie/week?api_key=$tmdbApiKey&language=tr-TR";
            break;

        case 'popular':
            $url = "$baseUrl/movie/popular?api_key=$tmdbApiKey&language=tr-TR&page=1";
            break;

        case 'person_search':
            $query = isset($_GET['query']) ? urlencode($_GET['query']) : '';
            if (empty($query)) {
                http_response_code(400);
                echo json_encode(array("message" => "Arama sorgusu gerekli."));
                exit;
            }
            $url = "$baseUrl/search/person?api_key=$tmdbApiKey&query=$query&language=tr-TR";
            break;

        case 'person_credits':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz kişi ID."));
                exit;
            }
            $url = "$baseUrl/person/$id/movie_credits?api_key=$tmdbApiKey&language=tr-TR";
            break;

        case 'person_details':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz kişi ID."));
                exit;
            }
            $url = "$baseUrl/person/$id?api_key=$tmdbApiKey&language=tr-TR";
            break;

        case 'movie_credits':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz film ID."));
                exit;
            }
            $url = "$baseUrl/movie/$id/credits?api_key=$tmdbApiKey&language=tr-TR";
            break;
            
        default:
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz aksiyon."));
            exit;
    }
    
    // TMDB API'ye istek gönder
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "API hatası: " . $e->getMessage()));
}
?>
