<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';
include_once '../rate_limiter.php';
include_once '../lib/image_helper.php';

// Auth kontrolü
$userId = requireAuth();

// Rate limiting - 50 inceleme/saat
checkRateLimit($conn, $userId, 'add_review', 50, 3600);

$data = json_decode(file_get_contents("php://input"));

// Girdi validasyonu
if (!isset($data->content_type) || !isset($data->content_id) || !isset($data->rating)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

// Content type validasyonu
if (!Validator::validateEnum($data->content_type, ['movie', 'book', 'music', 'event'])) {
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

    // Sanitize metadata
    $content_title = isset($data->content_title) ? Validator::sanitizeInput($data->content_title) : null;
    $image_url = isset($data->image_url) ? filter_var($data->image_url, FILTER_SANITIZE_URL) : null;
    $author = isset($data->author) ? Validator::sanitizeInput($data->author) : null;
    $title = isset($data->title) ? Validator::sanitizeInput($data->title) : null;

    // Cache image locally if provided
    if ($image_url) {
        $image_url = downloadAndSaveImage($image_url, $data->content_type, $data->content_id);
    }

    // 1. Update/Insert into user_library (Cache content details)
    $check_lib_query = "SELECT id, status FROM user_library WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    $check_lib_stmt = $conn->prepare($check_lib_query);
    $check_lib_stmt->bindParam(':user_id', $userId);
    $check_lib_stmt->bindParam(':content_type', $data->content_type);
    $check_lib_stmt->bindParam(':content_id', $data->content_id);
    $check_lib_stmt->execute();

    if ($check_lib_stmt->rowCount() > 0) {
        $lib_query = "UPDATE user_library SET content_title = :content_title, image_url = :image_url, author = :author, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    } else {
        $lib_query = "INSERT INTO user_library (user_id, content_type, content_id, status, content_title, image_url, author) VALUES (:user_id, :content_type, :content_id, 'read', :content_title, :image_url, :author)";
    }

    $lib_stmt = $conn->prepare($lib_query);
    $lib_stmt->bindParam(':user_id', $userId);
    $lib_stmt->bindParam(':content_type', $data->content_type);
    $lib_stmt->bindParam(':content_id', $data->content_id);
    $lib_stmt->bindParam(':content_title', $content_title);
    $lib_stmt->bindParam(':image_url', $image_url);
    $lib_stmt->bindParam(':author', $author);
    $lib_stmt->execute();

    // 2. Insert/Update Review with full metadata
    if ($check_stmt->rowCount() > 0) {
        $query = "UPDATE reviews SET rating = :rating, review_text = :review_text, title = :title, content_title = :content_title, image_url = :image_url, author = :author, created_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
    } else {
        $query = "INSERT INTO reviews (user_id, content_type, content_id, rating, review_text, title, content_title, image_url, author) VALUES (:user_id, :content_type, :content_id, :rating, :review_text, :title, :content_title, :image_url, :author)";
    }

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':content_type', $data->content_type);
    $stmt->bindParam(':content_id', $data->content_id);
    $stmt->bindParam(':rating', $data->rating);
    $stmt->bindParam(':review_text', $review_text);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content_title', $content_title);
    $stmt->bindParam(':image_url', $image_url);
    $stmt->bindParam(':author', $author);

    if ($stmt->execute()) {
        // 3. Create/Update Feed Post
        // İnceleme yapıldığında bunu ana akışta (posts) da gösterelim.
        // Eğer zaten bu inceleme için bir post varsa onu güncelle, yoksa yeni oluştur.
        $check_post_query = "SELECT id FROM posts WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id AND source = :source";
        $check_post_stmt = $conn->prepare($check_post_query);
        $check_post_stmt->bindParam(':user_id', $userId);
        $check_post_stmt->bindParam(':content_type', $data->content_type);
        $check_post_stmt->bindParam(':content_id', $data->content_id);
        $check_post_stmt->bindParam(':source', $data->content_title); // Source as title to identify
        $check_post_stmt->execute();

        if ($check_post_stmt->rowCount() > 0) {
            $existing_post = $check_post_stmt->fetch(PDO::FETCH_ASSOC);
            $post_update_query = "UPDATE posts SET content = :content, image_url = :image_url, created_at = CURRENT_TIMESTAMP WHERE id = :id";
            $post_update_stmt = $conn->prepare($post_update_query);
            $post_update_stmt->execute([
                ':content' => $review_text,
                ':image_url' => $image_url,
                ':id' => $existing_post['id']
            ]);
        } else {
            $post_insert_query = "INSERT INTO posts (user_id, content, title, source, author, content_type, content_id, image_url) VALUES (:user_id, :content, :title, :source, :author, :content_type, :content_id, :image_url)";
            $post_insert_stmt = $conn->prepare($post_insert_query);
            $post_insert_stmt->execute([
                ':user_id' => $userId,
                ':content' => $review_text,
                ':title' => "İnceleme: " . $data->content_title,
                ':source' => $data->content_title,
                ':author' => $author,
                ':content_type' => $data->content_type,
                ':content_id' => $data->content_id,
                ':image_url' => $image_url
            ]);
        }

        http_response_code(200);
        echo json_encode(array("message" => "İnceleme kaydedildi ve paylaşıldı."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "İnceleme kaydedilemedi."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>