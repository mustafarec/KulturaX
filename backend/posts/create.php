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

// Extract fields early for validation
$quote_text = isset($data->quote) ? $data->quote : null;
$comment_text = isset($data->comment) ? $data->comment : null;
$contentRaw = isset($data->content) ? $data->content : '';

// If content is empty but we have quote or comment, use them as content for legacy/validation purposes
if (empty($contentRaw)) {
    $contentRaw = $comment_text ? $comment_text : ($quote_text ? $quote_text : '');
}

// Girdi validasyonu
if(empty($contentRaw) || !isset($data->source)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

// Content validasyonu
if (!Validator::validateString($contentRaw, 1, 5000)) {
    http_response_code(400);
    echo json_encode(array("message" => "İçerik 1-5000 karakter arasında olmalıdır."));
    exit;
}

// Spam kontrolü
if (Validator::detectSpam($contentRaw)) {
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
    // Content sanitization
    $quote_text = $quote_text ? Validator::sanitizeInput($quote_text) : null;
    $comment_text = $comment_text ? Validator::sanitizeInput($comment_text) : null;
    $content = Validator::sanitizeInput($contentRaw);
    
    $source = Validator::sanitizeInput($data->source);
    $author = isset($data->author) ? Validator::sanitizeInput($data->author) : '';
    $original_post_id = isset($data->original_post_id) ? (int)$data->original_post_id : null;
    $content_type = (isset($data->content_type) && !empty($data->content_type)) ? Validator::sanitizeInput($data->content_type) : 'general';
    $content_id = isset($data->content_id) ? Validator::sanitizeInput($data->content_id) : null;
    $content_id = isset($data->content_id) ? Validator::sanitizeInput($data->content_id) : null;
    $image_url = isset($data->image_url) ? filter_var($data->image_url, FILTER_SANITIZE_URL) : null;
    $topic_id = isset($data->topic_id) ? (int)$data->topic_id : null;

    // Duplicate Repost Check
    // Sadece repost (alıntı metni olmayan) için kontrol et
    if ($original_post_id && empty($quote_text)) {
        $checkDupQuery = "SELECT id FROM posts WHERE user_id = :user_id AND original_post_id = :original_post_id AND (quote_text IS NULL OR quote_text = '')";
        $checkDupStmt = $conn->prepare($checkDupQuery);
        $checkDupStmt->bindParam(':user_id', $userId);
        $checkDupStmt->bindParam(':original_post_id', $original_post_id);
        $checkDupStmt->execute();

        if ($checkDupStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(array("message" => "Bu gönderiyi zaten paylaştınız."));
            exit;
        }
    }

    $query = "INSERT INTO posts (user_id, content, quote_text, comment_text, source, author, original_post_id, content_type, content_id, image_url, topic_id) VALUES (:user_id, :content, :quote_text, :comment_text, :source, :author, :original_post_id, :content_type, :content_id, :image_url, :topic_id)";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':quote_text', $quote_text);
    $stmt->bindParam(':comment_text', $comment_text);
    $stmt->bindParam(':source', $source);
    $stmt->bindParam(':author', $author);
    $stmt->bindParam(':original_post_id', $original_post_id);
    $stmt->bindParam(':content_type', $content_type);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->bindParam(':image_url', $image_url);
    $stmt->bindParam(':topic_id', $topic_id);

    if($stmt->execute()){
        $newPostId = $conn->lastInsertId();

        // Bildirim Mantığı (Repost ve Alıntı için)
        if ($original_post_id) {
            include_once '../notifications/notification_helper.php';
            $notifType = !empty($quote_text) ? 'quote' : 'repost';
            sendRepostNotification($conn, $userId, $newPostId, $original_post_id, $notifType);
        }

        // Increment topic post count if topic_id is present
        if ($topic_id) {
            $conn->query("UPDATE topics SET post_count = post_count + 1 WHERE id = $topic_id");
        }

        http_response_code(201);
        echo json_encode(array("message" => "Gönderi oluşturuldu.", "post_id" => $newPostId));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Gönderi oluşturulamadı."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
