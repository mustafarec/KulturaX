<?php
/**
 * Google Books API Proxy with Caching
 * Frontend'in API anahtarına erişmesini engeller
 * Yüksek trafik için yanıtları önbelleğe alır
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
include_once '../rate_limiter.php';
include_once '../lib/cache_manager.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Rate Limiting: IP başına dakikada 60 istek
$ip = getClientIp();
checkRateLimit($conn, $ip, 'google_books_api', 60, 60);

// Cache Manager'ı başlat
$cache = new CacheManager($conn);

// .env dosyasından API anahtarını al (opsiyonel - Google Books public API)
$envFile = __DIR__ . '/../.env';
$googleApiKey = '';

if (file_exists($envFile) && is_readable($envFile)) {
    $env = parse_ini_file($envFile);
    $googleApiKey = $env['GOOGLE_BOOKS_API_KEY'] ?? '';
}

$baseUrl = 'https://www.googleapis.com/books/v1';
$cacheKey = '';
$cacheTTL = 86400; // Varsayılan 1 gün

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
            // Parametreleri al ve güvenli hale getir
            $langRestrict = isset($_GET['langRestrict']) ? $_GET['langRestrict'] : 'tr'; // Varsayılan TR
            $printType = isset($_GET['printType']) ? $_GET['printType'] : 'books';
            $maxResults = isset($_GET['maxResults']) ? (int)$_GET['maxResults'] : 20;
            $startIndex = isset($_GET['startIndex']) ? (int)$_GET['startIndex'] : 0;
            
            // Güvenlik kontrolleri (Validation)
            if (!in_array($langRestrict, ['tr', 'en'])) $langRestrict = 'tr';
            if (!in_array($printType, ['all', 'books', 'magazines'])) $printType = 'books';
            if ($maxResults < 1 || $maxResults > 40) $maxResults = 20;
            if ($startIndex < 0) $startIndex = 0;

            // URL oluştur
            $url = "$baseUrl/volumes?q=$query";
            $url .= "&maxResults=$maxResults";
            $url .= "&startIndex=$startIndex";
            $url .= "&langRestrict=" . urlencode($langRestrict);
            $url .= "&printType=" . urlencode($printType);
            
            if (!empty($orderBy)) {
                // orderBy için de basit bir validation iyi olur
                if (in_array($orderBy, ['relevance', 'newest'])) {
                    $url .= "&orderBy=" . urlencode($orderBy);
                }
            }

            if (!empty($googleApiKey)) {
                $url .= "&key=$googleApiKey";
            }
            
            // Cache key'i tüm parametreleri içerecek şekilde güncelle
            $cacheKey = "google_books_search_" . md5($query . $orderBy . $langRestrict . $printType . $maxResults . $startIndex);
            $cacheTTL = 86400; // 1 gün
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
            
            $cacheKey = "google_books_details_" . $id;
            $cacheTTL = 604800; // 1 hafta
            break;
            
        default:
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz aksiyon."));
            exit;
    }
    
    // 1. Önbelleği kontrol et
    $cachedData = $cache->get('google_books', $cacheKey);
    if ($cachedData) {
        header('X-Cache-Status: HIT');
        echo json_encode($cachedData);
        exit;
    }
    
    // 2. Önbellekte yoksa API'ye git
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'KitapMuzikFilm/1.0');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        $data = json_decode($response, true);
        if ($data) {
            // 3. Yanıtı önbelleğe kaydet
            $cache->set('google_books', $cacheKey, $data, $cacheTTL);
            header('X-Cache-Status: MISS');
        }
    }
    
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "API hatası: " . $e->getMessage()));
}
?>
