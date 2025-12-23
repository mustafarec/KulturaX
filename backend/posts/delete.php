<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->post_id)){
    
    // Önce gönderinin bu kullanıcıya ait olup olmadığını kontrol et
    $check_query = "SELECT id FROM posts WHERE id = :id AND user_id = :user_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':id', $data->post_id);
    $check_stmt->bindParam(':user_id', $userId);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0){
        // Önce bu post'un bir repost olup olmadığını kontrol et
        $getOriginalQuery = "SELECT original_post_id FROM posts WHERE id = :id";
        $getOriginalStmt = $conn->prepare($getOriginalQuery);
        $getOriginalStmt->bindParam(':id', $data->post_id);
        $getOriginalStmt->execute();
        $originalRow = $getOriginalStmt->fetch(PDO::FETCH_ASSOC);
        $originalPostId = $originalRow ? $originalRow['original_post_id'] : null;

        // Gönderiyi sil
        $query = "DELETE FROM posts WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->post_id);

        if($stmt->execute()){
            // Eğer bu bir repost'tu, orijinal post'un repost_count'unu düşür
            if ($originalPostId) {
                $updateCounterQuery = "UPDATE posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = :original_id";
                $updateCounterStmt = $conn->prepare($updateCounterQuery);
                $updateCounterStmt->bindParam(':original_id', $originalPostId);
                $updateCounterStmt->execute();
            }
            
            http_response_code(200);
            echo json_encode(array("message" => "Gönderi silindi."));
        }
        else{
            http_response_code(503);
            echo json_encode(array("message" => "Silme işlemi başarısız."));
        }
    } else {
        http_response_code(403);
        echo json_encode(array("message" => "Bu gönderiyi silme yetkiniz yok."));
    }
}
else{
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
}
?>
