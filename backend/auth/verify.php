<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
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
    $stmt = $conn->prepare("SELECT id, username, name, surname, email_verification_code, verification_expires_at, token FROM users WHERE email = ?");
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

    // Use existing token if available, otherwise generate new one
    $token = $user['token'];
    if (empty($token)) {
        $token = bin2hex(random_bytes(32));
    }

    // Code is valid, update user status AND token
    $updateStmt = $conn->prepare("UPDATE users SET is_email_verified = 1, email_verification_code = NULL, verification_expires_at = NULL, token = ? WHERE id = ?");
    if ($updateStmt->execute([$token, $user['id']])) {
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Hesap doğrulandı.',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $email,
                'username' => $user['username'],
                'name' => $user['name'],
                'surname' => $user['surname']
            ]
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
