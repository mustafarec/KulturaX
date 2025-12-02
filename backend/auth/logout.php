<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Token'ı al (Middleware kullanmadan manuel alıyoruz çünkü middleware hata verirse çıkış yapamaz)
$headers = getallheaders();
if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
    $token = $matches[1];

    // Token'ı veritabanından sil (NULL yap)
    $query = "UPDATE users SET token = NULL WHERE token = :token";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    
    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Çıkış başarılı."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Çıkış yapılamadı."));
    }
} else {
    // Token yoksa zaten çıkış yapılmış sayılır
    http_response_code(200);
    echo json_encode(array("message" => "Çıkış başarılı (Token yok)."));
}
?>
