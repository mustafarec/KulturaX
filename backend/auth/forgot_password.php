<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

// Rate limiting - IP bazlı, 5 istek/saat
$ip = $_SERVER['REMOTE_ADDR'];
checkRateLimit($conn, $ip, 'forgot_password_attempt', 5, 3600);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Email adresi gereklidir."));
    exit;
}

$email = Validator::sanitizeInput($data->email);

if (!Validator::validateEmail($email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

try {
    // Kullanıcıyı kontrol et
    $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Güvenlik: Kullanıcı bulunamasa bile başarılı mesajı göster
        http_response_code(200);
        echo json_encode(array("message" => "Eğer bu email kayıtlıysa, şifre sıfırlama kodu gönderildi."));
        exit;
    }

    // Reset token oluştur (6 haneli kod)
    $resetCode = rand(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Mevcut reset kodlarını sil
    $deleteStmt = $conn->prepare("DELETE FROM password_resets WHERE user_id = ?");
    $deleteStmt->execute([$user['id']]);

    // Yeni reset kodu ekle
    $insertStmt = $conn->prepare("INSERT INTO password_resets (user_id, reset_code, expires_at) VALUES (?, ?, ?)");
    $insertStmt->execute([$user['id'], $resetCode, $expiresAt]);

    // Email gönder
    try {
        $mailConfig = require '../mail/config.php';
        require_once '../mail/SimpleSMTP.php';

        $smtp = new SimpleSMTP(
            $mailConfig['smtp_host'],
            $mailConfig['smtp_port'],
            $mailConfig['smtp_username'],
            $mailConfig['smtp_password']
        );

        $subject = "Şifre Sıfırlama Kodu";
        $message = "Merhaba " . $user['name'] . ",\n\nŞifrenizi sıfırlamak için kodunuz: $resetCode\n\nBu kod 15 dakika geçerlidir.\n\nEğer bu isteği siz yapmadıysanız, bu emaili dikkate almayınız.";

        $smtp->send($email, $subject, $message, $mailConfig['from_name']);
    } catch (Exception $e) {
        error_log("Password Reset Mail Error: " . $e->getMessage());
        // Email gönderemesek bile hata verme (güvenlik)
    }

    http_response_code(200);
    echo json_encode(array("message" => "Eğer bu email kayıtlıysa, şifre sıfırlama kodu gönderildi."));

} catch (PDOException $e) {
    error_log("Forgot Password Database Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu. Lütfen tekrar deneyin."));
}
?>
