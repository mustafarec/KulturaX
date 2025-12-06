<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

// Auth kontrolü
$userId = requireAuth();

// Rate limiting - 50 inceleme/saat
checkRateLimit($conn, $userId, 'add_review', 50, 3600);

$data = json_decode(file_get_contents("php://input"));

// Girdi validasyonu
if(!isset($data->content_type) || !isset($data->content_id) || !isset($data->rating)){
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

// Content type validasyonu
if (!Validator::validateEnum($data->content_type, ['movie', 'book'])) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz içerik tipi."));
    exit;
}

// Rating validasyonu
if (!Validator::validateInteger($data->rating, 1, 5)) {
    http_response_code(400);
    echo json_encode(array("message" => "Puan 1-5 arasında olmalıdır."));
    exit;
}

// Review text validasyonu (opsiyonel)
$review_text = "";
if (isset($data->review_text) && !empty($data->review_text)) {
    if (!Validator::validateString($data->review_text, 1, 2000)) {
        http_response_code(400);
        echo json_encode(array("message" => "İnceleme metni 1-2000 karakter arasında olmalıdır."));
        exit;
    }
    
    // Spam kontrolü
    if (Validator::detectSpam($data->review_text)) {
        http_response_code(400);
        echo json_encode(array("message" => "İncelemeniz spam olarak tespit edildi."));
        exit;
    }
    
    $review_text = Validator::sanitizeInput($data->review_text);
}

try {
    // Check if review already exists
    $check_query = "SELECT id FROM reviews WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':user_id', $userId);
    $check_stmt->bindParam(':content_type', $data->content_type);
    $check_stmt->bindParam(':content_id', $data->content_id);
    $check_stmt->execute();

    // 1. Update/Insert into user_library (Cache content details)
    // Varsayılan durum 'read' (okundu/izlendi) olsun ki listelerde görünsün.
    // Eğer kullanıcı daha önce eklediyse statüsünü değiştirmeyelim, sadece metadatasını güncelleyelim.
    $check_lib_query = "SELECT id, status FROM user_library WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    $check_lib_stmt = $conn->prepare($check_lib_query);
    $check_lib_stmt->bindParam(':user_id', $userId);
    $check_lib_stmt->bindParam(':content_type', $data->content_type);
    $check_lib_stmt->bindParam(':content_id', $data->content_id);
    $check_lib_stmt->execute();

    if ($check_lib_stmt->rowCount() > 0) {
        // Zaten kütüphanede var, sadece resim ve başlık eksikse güncelle
        $lib_query = "UPDATE user_library SET content_title = :content_title, image_url = :image_url, author = :author, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    } else {
        // Kütüphaneye yeni ekle, status='read' olarak varsayalım (inceleme yaptığına göre bitirmiştir)
        $lib_query = "INSERT INTO user_library (user_id, content_type, content_id, status, content_title, image_url, author) VALUES (:user_id, :content_type, :content_id, 'read', :content_title, :image_url, :author)";
    }
    
    $lib_stmt = $conn->prepare($lib_query);
    $lib_stmt->bindParam(':user_id', $userId);
    $lib_stmt->bindParam(':content_type', $data->content_type);
    $lib_stmt->bindParam(':content_id', $data->content_id);
    $lib_stmt->bindParam(':content_title', $data->content_title);
    $lib_stmt->bindParam(':image_url', $data->image_url);
    // author frontend'den gelmiyor olabilir, null geçelim şimdilik veya varsa
    $author = isset($data->author) ? $data->author : null; 
    $lib_stmt->bindParam(':author', $author);
    $lib_stmt->execute();

    // 2. Insert/Update Review
    if($check_stmt->rowCount() > 0){
        // Update existing review
        $query = "UPDATE reviews SET rating = :rating, review_text = :review_text, created_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    } else {
        // Insert new review
        $query = "INSERT INTO reviews (user_id, content_type, content_id, rating, review_text) VALUES (:user_id, :content_type, :content_id, :rating, :review_text)";
    }

    $stmt = $conn->prepare($query);

    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':content_type', $data->content_type);
    $stmt->bindParam(':content_id', $data->content_id);
    $stmt->bindParam(':rating', $data->rating);
    $stmt->bindParam(':review_text', $review_text);
    // content_title and image_url removed from reviews table operations

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "İnceleme kaydedildi."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "İnceleme kaydedilemedi."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
