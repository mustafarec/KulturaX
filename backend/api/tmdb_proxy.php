<?php
/**
 * TMDB API Proxy with Caching
 * Frontend'in API anahtarına erişmesini engeller
 * Yüksek trafik için yanıtları önbelleğe alır
 */

header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../rate_limiter.php';
include_once '../lib/cache_manager.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Rate Limiting: IP başına dakikada 300 istek
$ip = getClientIp();
checkRateLimit($conn, $ip, 'tmdb_api', 300, 60);

// Cache Manager'ı başlat
$cache = new CacheManager($conn);

// .env dosyasından API anahtarını al
$envFile = __DIR__ . '/../.env';
$tmdbApiKey = '';

if (file_exists($envFile) && is_readable($envFile)) {
    $env = parse_ini_file($envFile);
    $tmdbApiKey = $env['TMDB_API_KEY'] ?? '';
}

if (empty($tmdbApiKey)) {
    http_response_code(500);
    echo json_encode(array("message" => "API anahtarı yapılandırılmamış."));
    exit;
}

$baseUrl = 'https://api.themoviedb.org/3';
$cacheKey = '';
$cacheTTL = 86400; // Varsayılan 1 gün

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
            $cacheKey = "tmdb_search_" . md5($query);
            $cacheTTL = 86400; // 1 gün
            break;
            
        case 'details':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz film ID."));
                exit;
            }
            $url = "$baseUrl/movie/$id?api_key=$tmdbApiKey&language=tr-TR&append_to_response=credits";
            $cacheKey = "tmdb_details_" . $id;
            $cacheTTL = 604800; // 1 hafta (film detayları nadiren değişir)
            break;
            
        case 'trending':
            $url = "$baseUrl/trending/movie/week?api_key=$tmdbApiKey&language=tr-TR";
            $cacheKey = "tmdb_trending_week";
            $cacheTTL = 43200; // 12 saat
            break;

        case 'popular':
            $url = "$baseUrl/movie/popular?api_key=$tmdbApiKey&language=tr-TR&page=1";
            $cacheKey = "tmdb_popular";
            $cacheTTL = 43200; // 12 saat
            break;

        case 'person_search':
            $query = isset($_GET['query']) ? urlencode($_GET['query']) : '';
            if (empty($query)) {
                http_response_code(400);
                echo json_encode(array("message" => "Arama sorgusu gerekli."));
                exit;
            }
            $url = "$baseUrl/search/person?api_key=$tmdbApiKey&query=$query&language=tr-TR";
            $cacheKey = "tmdb_person_search_" . md5($query);
            break;

        case 'person_credits':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz kişi ID."));
                exit;
            }
            $url = "$baseUrl/person/$id/movie_credits?api_key=$tmdbApiKey&language=tr-TR";
            $cacheKey = "tmdb_person_credits_" . $id;
            $cacheTTL = 604800; // 1 hafta
            break;

        case 'person_details':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz kişi ID."));
                exit;
            }
            $url = "$baseUrl/person/$id?api_key=$tmdbApiKey&language=tr-TR";
            $cacheKey = "tmdb_person_details_" . $id;
            $cacheTTL = 604800; // 1 hafta
            break;

        case 'movie_credits':
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Geçersiz film ID."));
                exit;
            }
            $url = "$baseUrl/movie/$id/credits?api_key=$tmdbApiKey&language=tr-TR";
            $cacheKey = "tmdb_movie_credits_" . $id;
            $cacheTTL = 604800; // 1 hafta
            break;
            
        default:
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz aksiyon."));
            exit;
    }
    
    // 1. Önbelleği kontrol et
    $cachedData = $cache->get('tmdb', $cacheKey);
    if ($cachedData) {
        // Debug header ekle (geliştirme aşamasında faydalı)
        header('X-Cache-Status: HIT');
        echo json_encode($cachedData);
        exit;
    }

    // 2. Önbellekte yoksa API'ye git
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        $data = json_decode($response, true);
        if ($data) {
            // 3. Yanıtı önbelleğe kaydet
            $cache->set('tmdb', $cacheKey, $data, $cacheTTL);
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
