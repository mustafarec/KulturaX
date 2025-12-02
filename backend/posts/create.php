<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

// Auth kontrolü
$userId = requireAuth();

// Rate limiting - 100 gönderi/saat
checkRateLimit($conn, $userId, 'create_post', 100, 3600);

$data = json_decode(file_get_contents("php://input"));

// Girdi validasyonu
if(!isset($data->content) || !isset($data->source)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

// Content validasyonu
if (!Validator::validateString($data->content, 1, 5000)) {
    http_response_code(400);
    echo json_encode(array("message" => "İçerik 1-5000 karakter arasında olmalıdır."));
    exit;
}

// Spam kontrolü
if (Validator::detectSpam($data->content)) {
    http_response_code(400);
    echo json_encode(array("message" => "İçeriğiniz spam olarak tespit edildi."));
    exit;
}

// Source validasyonu
if (!Validator::validateString($data->source, 1, 255)) {
    http_response_code(400);
    echo json_encode(array("message" => "Kaynak 1-255 karakter arasında olmalıdır."));
    exit;
}

try {
    $content = Validator::sanitizeInput($data->content);
    $source = Validator::sanitizeInput($data->source);
    $author = isset($data->author) ? Validator::sanitizeInput($data->author) : '';
    $original_post_id = isset($data->original_post_id) ? (int)$data->original_post_id : null;
    $content_type = isset($data->content_type) ? Validator::sanitizeInput($data->content_type) : 'general';
    $content_id = isset($data->content_id) ? Validator::sanitizeInput($data->content_id) : null;
    $image_url = isset($data->image_url) ? filter_var($data->image_url, FILTER_SANITIZE_URL) : null;

    $query = "INSERT INTO posts (user_id, content, source, author, original_post_id, content_type, content_id, image_url) VALUES (:user_id, :content, :source, :author, :original_post_id, :content_type, :content_id, :image_url)";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':source', $source);
    $stmt->bindParam(':author', $author);
    $stmt->bindParam(':original_post_id', $original_post_id);
    $stmt->bindParam(':content_type', $content_type);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->bindParam(':image_url', $image_url);

    if($stmt->execute()){
        http_response_code(201);
        echo json_encode(array("message" => "Gönderi oluşturuldu.", "post_id" => $conn->lastInsertId()));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Gönderi oluşturulamadı."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
