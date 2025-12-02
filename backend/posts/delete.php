<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->post_id) && !empty($data->user_id)){
    
    // Önce gönderinin bu kullanıcıya ait olup olmadığını kontrol et
    $check_query = "SELECT id FROM posts WHERE id = :id AND user_id = :user_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':id', $data->post_id);
    $check_stmt->bindParam(':user_id', $data->user_id);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0){
        // Gönderi bu kullanıcıya ait, silebiliriz
        $query = "DELETE FROM posts WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->post_id);

        if($stmt->execute()){
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
