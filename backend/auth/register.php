<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';
include_once '../rate_limiter.php';
include_once '../auth_middleware.php';

// Rate limiting - IP bazlı, 3 kayıt/saat
$ip = $_SERVER['REMOTE_ADDR'];
checkRateLimit($conn, $ip, 'register_attempt', 3, 3600);

$data = json_decode(file_get_contents("php://input"));

// Girdi validasyonu
if(!isset($data->email) || !isset($data->password) || !isset($data->name) || !isset($data->surname) || !isset($data->username)){
    http_response_code(400);
    echo json_encode(array("message" => "Lütfen zorunlu alanları doldurunuz (Email, Şifre, İsim, Soyisim, Kullanıcı Adı)."));
    exit;
}

// Email validasyonu
if (!Validator::validateEmail($data->email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

// Şifre gücü kontrolü
if (!Validator::validatePasswordStrength($data->password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir."));
    exit;
}

try {
    // Email kontrolü
    $check_query = "SELECT id FROM users WHERE email = :email OR username = :username";
    $check_stmt = $conn->prepare($check_query);
    
    $email = Validator::sanitizeInput($data->email);
    $username = Validator::sanitizeInput($data->username);
    
    $check_stmt->bindParam(':email', $email);
    $check_stmt->bindParam(':username', $username);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0){
        http_response_code(400);
        echo json_encode(array("message" => "Bu email veya kullanıcı adı zaten kayıtlı."));
        exit;
    }

    // Kullanıcı oluştur
    $query = "INSERT INTO users (email, password, username, name, surname, birth_date, age, gender) VALUES (:email, :password, :username, :name, :surname, :birth_date, :age, :gender)";
    $stmt = $conn->prepare($query);

    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
    $name = Validator::sanitizeInput($data->name);
    $surname = Validator::sanitizeInput($data->surname);
    $birth_date = isset($data->birth_date) ? Validator::sanitizeInput($data->birth_date) : null;
    $gender = isset($data->gender) ? Validator::sanitizeInput($data->gender) : null;
<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';
include_once '../rate_limiter.php';
include_once '../auth_middleware.php';

// Rate limiting - IP bazlı, 3 kayıt/saat
$ip = $_SERVER['REMOTE_ADDR'];
checkRateLimit($conn, $ip, 'register_attempt', 3, 3600);

$data = json_decode(file_get_contents("php://input"));

// Girdi validasyonu
if(!isset($data->email) || !isset($data->password) || !isset($data->name) || !isset($data->surname) || !isset($data->username)){
    http_response_code(400);
    echo json_encode(array("message" => "Lütfen zorunlu alanları doldurunuz (Email, Şifre, İsim, Soyisim, Kullanıcı Adı)."));
    exit;
}

// Email validasyonu
if (!Validator::validateEmail($data->email)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz email formatı."));
    exit;
}

// Şifre gücü kontrolü
if (!Validator::validatePasswordStrength($data->password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir."));
    exit;
}

try {
    // Email kontrolü
    $check_query = "SELECT id FROM users WHERE email = :email OR username = :username";
    $check_stmt = $conn->prepare($check_query);
    
    $email = Validator::sanitizeInput($data->email);
    $username = Validator::sanitizeInput($data->username);
    
    $check_stmt->bindParam(':email', $email);
    $check_stmt->bindParam(':username', $username);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0){
        http_response_code(400);
        echo json_encode(array("message" => "Bu email veya kullanıcı adı zaten kayıtlı."));
        exit;
    }

    // Kullanıcı oluştur
    // $query = "INSERT INTO users (email, password, username, name, surname, birth_date, age, gender) VALUES (:email, :password, :username, :name, :surname, :birth_date, :age, :gender)";
    // $stmt = $conn->prepare($query);

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
      // Check if email or username already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$email, $username]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['message' => 'Email veya kullanıcı adı zaten kullanımda.']);
        exit;
    }

    // Generate Verification Code
    $verificationCode = rand(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Insert new user
    $sql = "INSERT INTO users (email, password, name, surname, username, birth_date, gender, is_email_verified, email_verification_code, verification_expires_at, age) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute([$email, $password_hash, $name, $surname, $username, $birth_date, $gender, $verificationCode, $expiresAt, $age])) {
        $userId = $conn->lastInsertId();

        // Send Verification Email
        $subject = "Hesap Doğrulama Kodu";
        $message = "Merhaba $name,\n\nHesabını doğrulamak için kodun: $verificationCode\n\nBu kod 15 dakika geçerlidir.";
        $headers = "From: no-reply@mmreeo.online";

        // Attempt to send email
        // Note: This requires a working mail server configuration on the backend
        // Send Verification Email using SimpleSMTP
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
            // Log error but don't fail registration
            file_put_contents('../debug_log.txt', "Mail Error: " . $e->getMessage() . "\n", FILE_APPEND);
        }

        // Also log the code for debugging purposes
        file_put_contents('../debug_log.txt', "Verification Code for $email: $verificationCode\n", FILE_APPEND);

        http_response_code(201);
        echo json_encode([
            'message' => 'Kayıt başarılı. Lütfen email adresinizi doğrulayın.',
            'require_verification' => true,
            'user_id' => $userId,
            'email' => $email
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Kayıt oluşturulamadı.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
