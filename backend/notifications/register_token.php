<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->token) &&
    !empty($data->platform)
){
    // Insert or Update token
    $query = "INSERT INTO device_tokens (user_id, token, platform) 
              VALUES (:user_id, :token, :platform) 
              ON DUPLICATE KEY UPDATE token = :token, platform = :platform";
    
    $stmt = $conn->prepare($query);

    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':token', $data->token);
    $stmt->bindParam(':platform', $data->platform);

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Token registered."));
    }
    else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to register token."));
    }
}
else{
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
