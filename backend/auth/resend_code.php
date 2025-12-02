<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email gereklidir.']);
    exit;
}

$email = Validator::sanitizeInput($data->email);

try {
    $stmt = $conn->prepare("SELECT id, name, is_email_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['message' => 'Kullanıcı bulunamadı.']);
        exit;
    }

    if ($user['is_email_verified'] == 1) {
        http_response_code(400);
        echo json_encode(['message' => 'Hesap zaten doğrulanmış.']);
        exit;
    }

    // Generate New Code
    $verificationCode = rand(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $updateStmt = $conn->prepare("UPDATE users SET email_verification_code = ?, verification_expires_at = ? WHERE id = ?");
    
    if ($updateStmt->execute([$verificationCode, $expiresAt, $user['id']])) {
        
        // Send Email
        $subject = "Yeni Hesap Doğrulama Kodu";
        $message = "Merhaba " . $user['name'] . ",\n\nYeni doğrulama kodun: $verificationCode\n\nBu kod 15 dakika geçerlidir.";
        $headers = "From: no-reply@mmreeo.online";

        try {
            $mailConfig = require '../mail/config.php';
            require_once '../mail/SimpleSMTP.php';

            $smtp = new SimpleSMTP(
                $mailConfig['smtp_host'],
                $mailConfig['smtp_port'],
                $mailConfig['smtp_username'],
                $mailConfig['smtp_password']
            );

            $smtp->send($email, $subject, $message, $mailConfig['from_name']);
        } catch (Exception $e) {
            file_put_contents('../debug_log.txt', "Mail Error: " . $e->getMessage() . "\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(['message' => 'Kod gönderilemedi: ' . $e->getMessage()]);
            exit;
        }
        
        // Log for debugging
        file_put_contents('../debug_log.txt', "Resent Verification Code for $email: $verificationCode\n", FILE_APPEND);

        http_response_code(200);
        echo json_encode(['message' => 'Yeni kod gönderildi.']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Kod gönderilemedi.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
