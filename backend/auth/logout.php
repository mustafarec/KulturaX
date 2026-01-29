<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

// Token'ı al (Middleware kullanmadan manuel alıyoruz çünkü middleware hata verirse çıkış yapamaz)
$headers = getallheaders();
if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
    $token = $matches[1];

    // Token cache'ini temizle
    TokenCache::invalidate($token);

    // Token'ı user_sessions tablosundan sil
    $tokenHash = hash('sha256', $token);
    $query = "DELETE FROM user_sessions WHERE token_hash = :token_hash";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token_hash', $tokenHash);
    
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
