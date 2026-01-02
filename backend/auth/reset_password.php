<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

// Rate limiting - IP bazlı, 10 istek/saat
$ip = $_SERVER['REMOTE_ADDR'];
checkRateLimit($conn, $ip, 'reset_password_attempt', 10, 3600);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->code) || !isset($data->new_password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Email, kod ve yeni şifre gereklidir."));
    exit;
}

$email = Validator::sanitizeInput($data->email);
$code = Validator::sanitizeInput($data->code);
$newPassword = $data->new_password;

// Email validasyonu
if (!Validator::validateEmail($email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

// Şifre gücü kontrolü
$passwordCheck = Validator::validatePasswordStrength($newPassword, true);
if (!$passwordCheck['valid']) {
    http_response_code(400);
    echo json_encode(array("message" => $passwordCheck['message']));
    exit;
}

try {
    // Kullanıcıyı bul
    $userStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $userStmt->execute([$email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz veya süresi dolmuş kod."));
        exit;
    }

    // Reset kodunu doğrula
    $resetStmt = $conn->prepare("SELECT id FROM password_resets WHERE user_id = ? AND reset_code = ? AND expires_at > NOW()");
    $resetStmt->execute([$user['id'], $code]);
    $resetRecord = $resetStmt->fetch(PDO::FETCH_ASSOC);

    if (!$resetRecord) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz veya süresi dolmuş kod."));
        exit;
    }

    // Şifreyi güncelle
    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $updateStmt->execute([$passwordHash, $user['id']]);

    // Kullanılan reset kodunu sil
    $deleteStmt = $conn->prepare("DELETE FROM password_resets WHERE user_id = ?");
    $deleteStmt->execute([$user['id']]);

    http_response_code(200);
    echo json_encode(array("message" => "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz."));

} catch (PDOException $e) {
    error_log("Reset Password Database Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu. Lütfen tekrar deneyin."));
}
?>
