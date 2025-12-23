<?php
include '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();
$viewer_id = isset($_GET['viewer_id']) ? $_GET['viewer_id'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;

// Check if target user is private and if viewer can access
try {
    $privacyQuery = "SELECT is_private FROM users WHERE id = :user_id";
    $privacyStmt = $conn->prepare($privacyQuery);
    $privacyStmt->bindParam(':user_id', $user_id);
    $privacyStmt->execute();
    $userData = $privacyStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($userData && $userData['is_private'] && $viewer_id && $viewer_id != $user_id) {
        // Check if viewer follows this user
        $followCheck = "SELECT id FROM follows WHERE follower_id = :viewer_id AND followed_id = :user_id";
        $followStmt = $conn->prepare($followCheck);
        $followStmt->bindParam(':viewer_id', $viewer_id);
        $followStmt->bindParam(':user_id', $user_id);
        $followStmt->execute();
        
        if ($followStmt->rowCount() === 0) {
            // Not following private account - return empty
            http_response_code(200);
            echo json_encode([]);
            exit;
        }
    }
} catch (Exception $e) {
    error_log("Privacy check error in get_user_library: " . $e->getMessage());
}

$query = "SELECT * FROM user_library WHERE user_id = :user_id";

if ($status) {
    $query .= " AND status = :status";
}

$query .= " ORDER BY updated_at DESC";

$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);

if ($status) {
    $stmt->bindParam(':status', $status);
}

$stmt->execute();

$items = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Eksik veri tamamlama (Self-Healing)
    if (empty($row['content_title']) || empty($row['image_url'])) {
        $updated = false;
        
        // 1. Kitaplar (Google Books)
        if ($row['content_type'] === 'book') {
            $apiKey = isset($env['GOOGLE_BOOKS_API_KEY']) ? $env['GOOGLE_BOOKS_API_KEY'] : '';
            if ($apiKey) {
                $url = "https://www.googleapis.com/books/v1/volumes/" . $row['content_id'] . "?key=" . $apiKey;
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Production: SSL doğrulaması açık
                $response = curl_exec($ch);
                curl_close($ch);
                
                $bookData = json_decode($response, true);
                if (isset($bookData['volumeInfo'])) {
                    $row['content_title'] = isset($bookData['volumeInfo']['title']) ? $bookData['volumeInfo']['title'] : 'Bilinmeyen Kitap';
                    $row['author'] = isset($bookData['volumeInfo']['authors']) ? implode(', ', $bookData['volumeInfo']['authors']) : '';
                    $row['image_url'] = isset($bookData['volumeInfo']['imageLinks']['thumbnail']) ? $bookData['volumeInfo']['imageLinks']['thumbnail'] : '';
                    // Yüksek çözünürlüklü kapak varsa onu al
                    if(isset($bookData['volumeInfo']['imageLinks']['thumbnail'])){
                         $row['image_url'] = str_replace('http://', 'https://', $bookData['volumeInfo']['imageLinks']['thumbnail']);
                    }
                    $updated = true;
                }
            }
        }
        
        // 2. Filmler (TMDB)
        else if ($row['content_type'] === 'movie') {
            $apiKey = isset($env['TMDB_API_KEY']) ? $env['TMDB_API_KEY'] : '';
             if ($apiKey) {
                $url = "https://api.themoviedb.org/3/movie/" . $row['content_id'] . "?api_key=" . $apiKey . "&language=tr-TR";
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                $response = curl_exec($ch);
                curl_close($ch);
                
                $movieData = json_decode($response, true);
                if (isset($movieData['title'])) {
                    $row['content_title'] = $movieData['title'];
                    $row['image_url'] = isset($movieData['poster_path']) ? "https://image.tmdb.org/t/p/w500" . $movieData['poster_path'] : '';
                    // Film için yazar yerine belki yönetmen veya yıl? Şimdilik boş kalsın veya release_date
                    $row['author'] = isset($movieData['release_date']) ? substr($movieData['release_date'], 0, 4) : '';
                    $updated = true;
                }
            }
        }
        
        // Veritabanını güncelle
        if ($updated) {
            $updateQuery = "UPDATE user_library SET content_title = :title, image_url = :image, author = :author WHERE id = :id";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(':title', $row['content_title']);
            $updateStmt->bindParam(':image', $row['image_url']);
            $updateStmt->bindParam(':author', $row['author']);
            $updateStmt->bindParam(':id', $row['id']);
            $updateStmt->execute();
        }
    }

    array_push($items, $row);
}

http_response_code(200);
echo json_encode($items);
?>
