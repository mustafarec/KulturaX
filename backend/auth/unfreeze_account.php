<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Email ve şifre gereklidir."));
    exit;
}

$email = Validator::sanitizeInput($data->email);

if (!Validator::validateEmail($email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

try {
    // Kullanıcıyı bul
    $stmt = $conn->prepare("SELECT id, password, is_frozen FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(array("message" => "Kullanıcı bulunamadı."));
        exit;
    }

    // Şifre kontrolü
    if (!password_verify($data->password, $user['password'])) {
        http_response_code(401);
        echo json_encode(array("message" => "Geçersiz şifre."));
        exit;
    }

    // Hesap donmuş değilse
    if (!$user['is_frozen']) {
        http_response_code(400);
        echo json_encode(array("message" => "Hesabınız zaten aktif."));
        exit;
    }

    // Hesabı aktifleştir
    $updateStmt = $conn->prepare("UPDATE users SET is_frozen = 0, frozen_at = NULL, frozen_reason = NULL WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // Yeni token oluştur
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    $tokenStmt = $conn->prepare("INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $tokenStmt->execute([$user['id'], $token, $expiresAt]);

    // Kullanıcı bilgilerini al
    $userStmt = $conn->prepare("SELECT id, email, username, name, surname, avatar_url FROM users WHERE id = ?");
    $userStmt->execute([$user['id']]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(array(
        "message" => "Hesabınız başarıyla aktifleştirildi.",
        "success" => true,
        "token" => $token,
        "user" => $userData
    ));

} catch (PDOException $e) {
    error_log("Unfreeze Account Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu. Lütfen tekrar deneyin."));
}
?>
