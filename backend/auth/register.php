<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';
include_once '../rate_limiter.php';
include_once '../auth_middleware.php';


// DEBUG LOGGING DISABLED FOR PRODUCTION
function debugLog($message)
{
    // Production'da log yazılmıyor
    // Geliştirme için: error_log($message);
}

// Rate limiting - IP bazlı, 3 kayıt/saat
$ip = getClientIp();
checkRateLimit($conn, $ip, 'register_attempt', 3, 3600);

// $data = json_decode(file_get_contents("php://input")); DELETED - moved down


$data = json_decode(file_get_contents("php://input"));
if ($data) {
    debugLog("Input data received: " . json_encode($data));
} else {
    debugLog("No input data received or JSON decode failed.");
}

// Girdi validasyonu
if (!isset($data->email) || !isset($data->password) || !isset($data->name) || !isset($data->surname) || !isset($data->username)) {
    debugLog("Validation failed: Missing fields.");
    http_response_code(400);
    echo json_encode(array("message" => "Lütfen zorunlu alanları doldurunuz (Email, Şifre, İsim, Soyisim, Kullanıcı Adı)."));
    exit;
}

// Email validasyonu
if (!Validator::validateEmail($data->email)) {
    debugLog("Validation failed: Invalid email format - " . $data->email);
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

// Şifre gücü kontrolü (özel karakter dahil)
$passwordCheck = Validator::validatePasswordStrength($data->password, true);
if (!$passwordCheck['valid']) {
    debugLog("Validation failed: Weak password.");
    http_response_code(400);
    echo json_encode(array("message" => $passwordCheck['message']));
    exit;
}

try {
    debugLog("Checking existing user...");
    // Email kontrolü
    $check_query = "SELECT id FROM users WHERE email = :email OR username = :username";
    $check_stmt = $conn->prepare($check_query);

    $email = Validator::sanitizeInput($data->email);
    $username = Validator::sanitizeInput($data->username);

    $check_stmt->bindParam(':email', $email);
    $check_stmt->bindParam(':username', $username);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        debugLog("User registration failed: User already exists (Email: $email, Username: $username)");
        http_response_code(400);
        echo json_encode(array("message" => "Bu email veya kullanıcı adı zaten kayıtlı."));
        exit;
    }

    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
    $name = Validator::sanitizeInput($data->name);
    $surname = Validator::sanitizeInput($data->surname);
    $birth_date = isset($data->birth_date) ? Validator::sanitizeInput($data->birth_date) : null;
    $gender = isset($data->gender) ? Validator::sanitizeInput($data->gender) : null;

    // Yaşı doğum tarihinden hesapla
    $age = null;
    if ($birth_date) {
        $dob = new DateTime($birth_date);
        $now = new DateTime();
        $interval = $now->diff($dob);
        $age = $interval->y;
    }

    // Generate Verification Code
    $verificationCode = rand(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    debugLog("Attempting to insert new user...");
    // Insert new user
    $sql = "INSERT INTO users (email, password, name, surname, username, birth_date, gender, is_email_verified, email_verification_code, verification_expires_at, age) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt->execute([$email, $password_hash, $name, $surname, $username, $birth_date, $gender, $verificationCode, $expiresAt, $age])) {
        $userId = $conn->lastInsertId();
        debugLog("User inserted successfully. ID: $userId");

        // Send Verification Email
        $subject = "Hesap Doğrulama Kodu";
        $message = "Merhaba $name,\n\nHesabını doğrulamak için kodun: $verificationCode\n\nBu kod 15 dakika geçerlidir.";
        $headers = "From: no-reply@mmreeo.online";

        // Attempt to send email
        debugLog("Attempting to send verification email...");
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
            debugLog("Verification email sent successfully.");
        } catch (Exception $e) {
            // Log error but don't fail registration
            debugLog("Mail Error: " . $e->getMessage());
        }

        http_response_code(201);
        echo json_encode([
            'message' => 'Kayıt başarılı. Lütfen email adresinizi doğrulayın.',
            'require_verification' => true,
            'user_id' => $userId,
            'email' => $email
        ]);
        debugLog("Registration process completed successfully.");
    } else {
        $errorInfo = $stmt->errorInfo();
        debugLog("Insert failed. Error Info: " . json_encode($errorInfo));
        http_response_code(500);
        echo json_encode(['message' => 'Kayıt oluşturulamadı.']);
    }
} catch (PDOException $e) {
    error_log("Register Database Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Bir hata oluştu. Lütfen tekrar deneyin.']);
}
?>