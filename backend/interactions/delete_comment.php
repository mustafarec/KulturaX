<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $userId = requireAuth();
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->comment_id)) {
            http_response_code(400);
            echo json_encode(array("message" => "Eksik veri: comment_id gereklidir."));
            exit;
        }

        if (!Validator::validateInteger($data->comment_id, 1)) {
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz yorum ID."));
            exit;
        }
        
        // Yorumun varlığını ve sahibini kontrol et
        $checkQuery = "SELECT user_id, post_id FROM interactions WHERE id = :comment_id AND type = 'comment'";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':comment_id', $data->comment_id); // Düzeltme: id yerine comment_id kullanılıyor parametre olarak
        
        // Parametre adı :comment_id olduğu için bindParam doğru olmalı. Ancak sorguda id = :comment_id dedik.
        
        $checkStmt->execute();
        $comment = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment) {
            http_response_code(404);
            echo json_encode(array("message" => "Yorum bulunamadı."));
            exit;
        }

        // Sadece yorum sahibi silebilir
        if ($comment['user_id'] != $userId) {
            http_response_code(403);
            echo json_encode(array("message" => "Bu yorumu silme yetkiniz yok."));
            exit;
        }

        // Yorumu sil
        $deleteQuery = "DELETE FROM interactions WHERE id = :comment_id";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':comment_id', $data->comment_id);

        if ($deleteStmt->execute()) {
            // Atomic decrement post comment count
            $updateCount = "UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = :post_id";
            $updateStmt = $conn->prepare($updateCount);
            $updateStmt->bindParam(':post_id', $comment['post_id']);
            $updateStmt->execute();

            // İlgili bildirimleri de temizlemek iyi olabilir ama zorunlu değil
            // Bildirim tablosunda comment_id doğrudan bir sütun değil, data json içinde tutuluyor.
            // Karmaşık olacağı için şimdilik pas geçiyoruz.

            http_response_code(200);
            echo json_encode(array("message" => "Yorum silindi."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Yorum silinemedi."));
        }

    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Method Not Allowed"));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
