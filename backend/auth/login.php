<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';

$data = json_decode(file_get_contents("php://input"));

// Girdi validasyonu
if(!isset($data->email) || !isset($data->password)){
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

// Email validasyonu
if (!Validator::validateEmail($data->email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

// Password validasyonu
if (!Validator::validateString($data->password, 1, 255)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz şifre."));
    exit;
}

try {
    $query = "SELECT id, email, password, username, full_name, avatar_url, is_email_verified FROM users WHERE email = :email LIMIT 1";
    $stmt = $conn->prepare($query);

    $email = Validator::sanitizeInput($data->email);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if($stmt->rowCount() > 0){
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if(password_verify($data->password, $row['password'])){
            // Token oluştur ve veritabanına kaydet
            $token = generateToken($row['id']);
            
            $updateQuery = "UPDATE users SET token = :token WHERE id = :id";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(':token', $token);
            $updateStmt->bindParam(':id', $row['id']);
            $updateStmt->execute();
            
            http_response_code(200);
            
            unset($row['password']);
            echo json_encode(array(
                "message" => "Giriş başarılı.",
                "token" => $token,
                "user" => $row
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Geçersiz şifre."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Kullanıcı bulunamadı."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
