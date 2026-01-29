<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';
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
$title = isset($data->title) ? $data->title : null;
$contentRaw = isset($data->content) ? $data->content : '';

// If content is empty but we have quote or comment, use them as content for legacy/validation purposes
if (empty($contentRaw)) {
    $contentRaw = $comment_text ? $comment_text : ($quote_text ? $quote_text : '');
}

// Girdi validasyonu
if (empty($contentRaw) || !isset($data->source)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

// Title validasyonu (Opsiyonel ve 60 karakter sınırı)
if (!empty($title)) {
    if (!Validator::validateString($title, 1, 60)) {
        http_response_code(400);
        echo json_encode(array("message" => "Başlık 1-60 karakter arasında olmalıdır."));
        exit;
    }
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
    $title = $title ? Validator::sanitizeInput($title) : null;
    $original_post_id = isset($data->original_post_id) ? (int) $data->original_post_id : null;
    $content_type = (isset($data->content_type) && !empty($data->content_type)) ? Validator::sanitizeInput($data->content_type) : 'general';
    $content_id = isset($data->content_id) ? Validator::sanitizeInput($data->content_id) : null;
    $image_url = isset($data->image_url) ? filter_var($data->image_url, FILTER_SANITIZE_URL) : null;
    $topic_id = isset($data->topic_id) ? (int) $data->topic_id : null;

    // Duplicate Repost Check
    // Sadece basit repost (alıntı/yorum metni olmayan veya 'Yeniden paylaşım' içerikli) için kontrol et
    $isSimpleRepost = empty($quote_text) && (empty($comment_text) || $comment_text === 'Yeniden paylaşım');

    if ($original_post_id && $isSimpleRepost) {
        // Mevcut repost'u ara (basit repost olanlar - quote/comment boş veya 'Yeniden paylaşım')
        $checkDupQuery = "SELECT id FROM posts WHERE user_id = :user_id AND original_post_id = :original_post_id 
                          AND (quote_text IS NULL OR quote_text = '')
                          AND (
                              (comment_text IS NULL OR comment_text = '' OR comment_text = 'Yeniden paylaşım')
                              OR content = 'Yeniden paylaşım'
                          )";
        $checkDupStmt = $conn->prepare($checkDupQuery);
        $checkDupStmt->bindParam(':user_id', $userId);
        $checkDupStmt->bindParam(':original_post_id', $original_post_id);
        $checkDupStmt->execute();

        if ($checkDupStmt->rowCount() > 0) {
            // Already reposted -> UN-REPOST (Toggle)
            $existing = $checkDupStmt->fetch(PDO::FETCH_ASSOC);
            $existingId = $existing['id'];

            $deleteQuery = "DELETE FROM posts WHERE id = :id";
            $deleteStmt = $conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':id', $existingId);

            if ($deleteStmt->execute()) {
                // Orijinal post'un repost_count'unu düşür
                $updateCounterQuery = "UPDATE posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = :original_id";
                $updateCounterStmt = $conn->prepare($updateCounterQuery);
                $updateCounterStmt->bindParam(':original_id', $original_post_id);
                $updateCounterStmt->execute();

                http_response_code(200);
                echo json_encode(array("message" => "Repost geri alındı.", "unreposted" => true, "post_id" => $existingId));
                exit;
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Repost geri alınamadı."));
                exit;
            }
        }
    }

    $query = "INSERT INTO posts (user_id, content, quote_text, comment_text, title, source, author, original_post_id, content_type, content_id, image_url, topic_id) VALUES (:user_id, :content, :quote_text, :comment_text, :title, :source, :author, :original_post_id, :content_type, :content_id, :image_url, :topic_id)";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':quote_text', $quote_text);
    $stmt->bindParam(':comment_text', $comment_text);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':source', $source);
    $stmt->bindParam(':author', $author);
    $stmt->bindParam(':original_post_id', $original_post_id);
    $stmt->bindParam(':content_type', $content_type);
    $stmt->bindParam(':content_id', $content_id);
    $stmt->bindParam(':image_url', $image_url);
    $stmt->bindParam(':topic_id', $topic_id);

    if ($stmt->execute()) {
        $newPostId = $conn->lastInsertId();

        // Bildirim Mantığı (Repost ve Alıntı için)
        if ($original_post_id) {
            // Orijinal post'un repost_count'unu artır
            $updateCounterQuery = "UPDATE posts SET repost_count = repost_count + 1 WHERE id = :original_id";
            $updateCounterStmt = $conn->prepare($updateCounterQuery);
            $updateCounterStmt->bindParam(':original_id', $original_post_id);
            $updateCounterStmt->execute();

            include_once '../notifications/notification_helper.php';
            // Eğer quote metni veya yorum metni varsa bu bir alıntıdır (quote), yoksa sadece paylaşımdır (repost)
            $notifType = (!empty($quote_text) || !empty($comment_text)) ? 'quote' : 'repost';
            sendRepostNotification($conn, $userId, $newPostId, $original_post_id, $notifType);
        }

        // Increment topic post count if topic_id is present
        if ($topic_id) {
            $topicUpdateStmt = $conn->prepare("UPDATE topics SET post_count = post_count + 1 WHERE id = :topic_id");
            $topicUpdateStmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
            $topicUpdateStmt->execute();
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
