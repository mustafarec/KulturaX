<?php
/**
 * Background Metadata Updater
 * 
 * Eksik metadata olan içerikleri toplu olarak güncelleyen endpoint
 * Cron job veya client tarafından tetiklenebilir
 * 
 * Kullanım:
 * - GET: Eksik metadata olan itemleri listele
 * - POST: Belirli itemların metadata'sını güncelle
 * 
 * Cron Job örneği (her saat):
 * 0 * * * * curl -X POST https://your-domain.com/api/library/update_metadata.php?mode=batch&limit=50
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';
include_once '../rate_limiter.php';

// Rate Limiting
$ip = getClientIp();
checkRateLimit($conn, $ip, 'metadata_update', 30, 60); // 30 req/min

// Load API keys from .env
$envFile = __DIR__ . '/../.env';
$env = [];
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // ==================== LİST ITEMS NEEDING UPDATE ====================
        $limit = isset($_GET['limit']) ? min(intval($_GET['limit']), 100) : 20;
        $content_type = isset($_GET['content_type']) ? $_GET['content_type'] : null;
        
        $query = "SELECT id, user_id, content_type, content_id, content_title, image_url, author 
                  FROM user_library 
                  WHERE (content_title IS NULL OR content_title = '' OR image_url IS NULL OR image_url = '')";
        
        if ($content_type) {
            $query .= " AND content_type = :content_type";
        }
        
        $query .= " ORDER BY updated_at DESC LIMIT :limit";
        
        $stmt = $conn->prepare($query);
        if ($content_type) {
            $stmt->bindParam(':content_type', $content_type);
        }
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            "total" => count($items),
            "items" => $items
        ]);
        
    } elseif ($method === 'POST') {
        // ==================== UPDATE METADATA ====================
        
        $mode = isset($_GET['mode']) ? $_GET['mode'] : 'single';
        $limit = isset($_GET['limit']) ? min(intval($_GET['limit']), 50) : 10;
        
        if ($mode === 'batch') {
            // Batch mode: Automatically find and update items with missing metadata
            $query = "SELECT id, content_type, content_id, content_title, image_url 
                      FROM user_library 
                      WHERE (content_title IS NULL OR content_title = '' OR image_url IS NULL OR image_url = '')
                      LIMIT :limit";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // Single mode: Update specific items from request body
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->items) || !is_array($data->items)) {
                http_response_code(400);
                echo json_encode(["message" => "items array required"]);
                exit;
            }
            
            $items = $data->items;
        }
        
        $updated = 0;
        $failed = 0;
        $results = [];
        
        foreach ($items as $item) {
            $item = (array) $item;
            $contentType = $item['content_type'];
            $contentId = $item['content_id'];
            $itemId = $item['id'];
            
            $newTitle = null;
            $newImage = null;
            $newAuthor = null;
            
            // Fetch from external API based on content type
            if ($contentType === 'book') {
                $apiKey = isset($env['GOOGLE_BOOKS_API_KEY']) ? $env['GOOGLE_BOOKS_API_KEY'] : '';
                if ($apiKey) {
                    $url = "https://www.googleapis.com/books/v1/volumes/" . $contentId . "?key=" . $apiKey;
                    $response = fetchUrl($url);
                    
                    if ($response) {
                        $bookData = json_decode($response, true);
                        if (isset($bookData['volumeInfo'])) {
                            $newTitle = $bookData['volumeInfo']['title'] ?? null;
                            $newAuthor = isset($bookData['volumeInfo']['authors']) ? implode(', ', $bookData['volumeInfo']['authors']) : null;
                            if (isset($bookData['volumeInfo']['imageLinks']['thumbnail'])) {
                                $newImage = str_replace('http://', 'https://', $bookData['volumeInfo']['imageLinks']['thumbnail']);
                            }
                        }
                    }
                }
            } elseif ($contentType === 'movie') {
                $apiKey = isset($env['TMDB_API_KEY']) ? $env['TMDB_API_KEY'] : '';
                if ($apiKey) {
                    $url = "https://api.themoviedb.org/3/movie/" . $contentId . "?api_key=" . $apiKey . "&language=tr-TR";
                    $response = fetchUrl($url);
                    
                    if ($response) {
                        $movieData = json_decode($response, true);
                        if (isset($movieData['title'])) {
                            $newTitle = $movieData['title'];
                            $newAuthor = isset($movieData['release_date']) ? substr($movieData['release_date'], 0, 4) : null;
                            if (isset($movieData['poster_path'])) {
                                $newImage = "https://image.tmdb.org/t/p/w500" . $movieData['poster_path'];
                            }
                        }
                    }
                }
            } elseif ($contentType === 'music') {
                // Spotify requires OAuth - skip for now or implement client credentials
                // Music metadata should ideally be passed when saving
            }
            
            // Update database if we got new data
            if ($newTitle || $newImage) {
                $updateQuery = "UPDATE user_library SET 
                                content_title = COALESCE(:title, content_title),
                                image_url = COALESCE(:image, image_url),
                                author = COALESCE(:author, author),
                                updated_at = NOW()
                                WHERE id = :id";
                
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->bindParam(':title', $newTitle);
                $updateStmt->bindParam(':image', $newImage);
                $updateStmt->bindParam(':author', $newAuthor);
                $updateStmt->bindParam(':id', $itemId);
                
                if ($updateStmt->execute()) {
                    $updated++;
                    $results[] = [
                        'id' => $itemId,
                        'status' => 'updated',
                        'title' => $newTitle
                    ];
                } else {
                    $failed++;
                    $results[] = [
                        'id' => $itemId,
                        'status' => 'db_error'
                    ];
                }
            } else {
                $failed++;
                $results[] = [
                    'id' => $itemId,
                    'status' => 'no_data_found',
                    'content_type' => $contentType,
                    'content_id' => $contentId
                ];
            }
            
            // Sleep a bit to avoid rate limiting external APIs
            usleep(100000); // 100ms
        }
        
        http_response_code(200);
        echo json_encode([
            "message" => "Metadata update completed",
            "updated" => $updated,
            "failed" => $failed,
            "total_processed" => count($items),
            "results" => $results
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
    }
    
} catch (Exception $e) {
    error_log("Metadata update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}

/**
 * Helper function to fetch URL with timeout
 */
function fetchUrl($url, $timeout = 5) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MetadataUpdater/1.0)');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return $response;
    }
    
    return null;
}
?>
