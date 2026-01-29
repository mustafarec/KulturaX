<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->notification_id) && !empty($data->user_id)){
    
    $query = "UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :user_id";
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':id', $data->notification_id);
    $stmt->bindParam(':user_id', $data->user_id);

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Bildirim okundu olarak işaretlendi."));
    }
    else{
        http_response_code(503);
        echo json_encode(array("message" => "İşlem başarısız."));
    }
}
else{
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
}
?>
