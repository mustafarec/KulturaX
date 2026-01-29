<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
include_once '../validation.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->code)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email ve kod gereklidir.']);
    exit;
}

$email = Validator::sanitizeInput($data->email);
$code = Validator::sanitizeInput($data->code);

try {
    $stmt = $conn->prepare("SELECT id, email, username, full_name, bio, location, website, avatar_url, header_image_url, is_email_verified, is_frozen, frozen_at, is_premium, created_at, birth_date, is_private, school, department, interests, email_verification_code, verification_expires_at FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['message' => 'Kullanıcı bulunamadı.']);
        exit;
    }

    if ($user['email_verification_code'] !== $code) {
        http_response_code(400);
        echo json_encode(['message' => 'Geçersiz kod.']);
        exit;
    }

    if (strtotime($user['verification_expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['message' => 'Kodun süresi dolmuş. Lütfen yeni kod isteyin.']);
        exit;
    }

require_once '../auth_middleware.php';

// Code is valid, update user status
$updateStmt = $conn->prepare("UPDATE users SET is_email_verified = 1, email_verification_code = NULL, verification_expires_at = NULL WHERE id = ?");
if ($updateStmt->execute([$user['id']])) {
    // Session oluştur
    $token = createSession($conn, $user['id']);
    
    http_response_code(200);
    
    // Preparation for JSON response ( parity with login.php )
    unset($user['password']);
    unset($user['email_verification_code']);
    unset($user['verification_expires_at']);
    $user['is_premium'] = (bool)($user['is_premium'] ?? false);
    $user['is_private'] = (bool)($user['is_private'] ?? false);
    $user['is_email_verified'] = true;

    echo json_encode([
        'message' => 'Hesap doğrulandı.',
        'token' => $token,
        'user' => $user
    ]);
} else {
        http_response_code(500);
        echo json_encode(['message' => 'Doğrulama işlemi sırasında bir hata oluştu.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
