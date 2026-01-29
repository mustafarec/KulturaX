<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';
include_once '../validation.php';
include_once '../rate_limiter.php';

// Rate limiting - Brute force koruması: Kademeli Engelleme
try {
    $ip = getClientIp();
    checkGradualRateLimit($conn, $ip, 'login_attempt');
} catch (Exception $e) {
    // Rate limit hatası (429) ise zaten exit olur.
    // Başka bir hata (Redis, DB vb.) ise logla ve devam et (fail open) veya hata ver
    error_log("Login Rate Limit Error: " . $e->getMessage());
}

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
    $query = "SELECT id, email, password, username, full_name, bio, location, website, avatar_url, header_image_url, is_email_verified, is_frozen, frozen_at, is_premium, 
                     created_at, birth_date, is_private, school, department, interests 
              FROM users WHERE email = :email LIMIT 1";
    $stmt = $conn->prepare($query);

    $email = Validator::sanitizeInput($data->email);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if($stmt->rowCount() > 0){
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if(password_verify($data->password, $row['password'])){
            // Hesap dondurulmuş mu kontrol et
            if (isset($row['is_frozen']) && $row['is_frozen']) {
                http_response_code(403);
                echo json_encode(array(
                    "message" => "Hesabınız dondurulmuş.",
                    "is_frozen" => true,
                    "frozen_at" => $row['frozen_at'] ?? null,
                    "code" => "ACCOUNT_FROZEN"
                ));
                exit;
            }

            // Email doğrulanmış mı kontrol et
            if (isset($row['is_email_verified']) && $row['is_email_verified'] == 0) {
                http_response_code(403);
                echo json_encode(array(
                    "message" => "Lütfen önce email adresinizi doğrulayın.",
                    "code" => "EMAIL_NOT_VERIFIED"
                ));
                exit;
            }
            
            // Token oluştur ve veritabanına kaydet (expiry ile birlikte)
            $token = createTokenWithExpiry($conn, $row['id']);
            
            http_response_code(200);
            
            unset($row['password']);
            // Convert is_premium to boolean for proper JavaScript handling
            $row['is_premium'] = (bool)($row['is_premium'] ?? false);
            $row['is_private'] = (bool)($row['is_private'] ?? false);
            echo json_encode(array(
                "message" => "Giriş başarılı.",
                "token" => $token,
                "user" => $row
            ));
        } else {
            // Güvenlik: Kullanıcı enumeration'ı engellemek için aynı mesaj
            http_response_code(401);
            echo json_encode(array("message" => "Email veya şifre hatalı.", "code" => "INVALID_CREDENTIALS"));
        }
    } else {
        // Güvenlik: Kullanıcı enumeration'ı engellemek için aynı mesaj
        http_response_code(401);
        echo json_encode(array("message" => "Email veya şifre hatalı.", "code" => "INVALID_CREDENTIALS"));
    }
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu. Lütfen tekrar deneyin."));
}
?>
