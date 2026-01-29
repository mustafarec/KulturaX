<?php
require_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->token)){
    // Token'ı veritabanından sil
    $query = "DELETE FROM device_tokens WHERE token = :token";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $data->token);

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Token removed."));
    }
    else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to remove token."));
    }
}
else{
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
