<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';
include_once '../validation.php';

$user_id = requireAuth();
$data = json_decode(file_get_contents("php://input"));

// Input validation
if (!isset($data->current_password) || !isset($data->new_password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Mevcut şifre ve yeni şifre gereklidir."));
    exit;
}

$current_password = $data->current_password;
$new_password = $data->new_password;

// Validate new password length
if (strlen($new_password) < 6) {
    http_response_code(400);
    echo json_encode(array("message" => "Yeni şifre en az 6 karakter olmalıdır."));
    exit;
}

// Check if new password is same as current
if ($current_password === $new_password) {
    http_response_code(400);
    echo json_encode(array("message" => "Yeni şifre mevcut şifreden farklı olmalıdır."));
    exit;
}

try {
    // Get current password hash from database
    $query = "SELECT password FROM users WHERE id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Kullanıcı bulunamadı."));
        exit;
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify current password
    if (!password_verify($current_password, $row['password'])) {
        http_response_code(401);
        echo json_encode(array("message" => "Mevcut şifre yanlış."));
        exit;
    }

    // Hash new password
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

    // Update password in database
    $update_query = "UPDATE users SET password = :password WHERE id = :user_id";
    $update_stmt = $conn->prepare($update_query);
    $update_stmt->bindParam(':password', $new_password_hash);
    $update_stmt->bindParam(':user_id', $user_id);
    $update_stmt->execute();

    // Invalidate all other tokens (optional security measure)
    // $invalidate_query = "DELETE FROM user_tokens WHERE user_id = :user_id AND token != :current_token";
    // This would require passing the current token

    // Token cache'ini temizle (güvenlik için)
    $headers = getallheaders();
    if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        TokenCache::invalidate($matches[1]);
    }

    http_response_code(200);
    echo json_encode(array("message" => "Şifre başarıyla güncellendi."));

} catch (Exception $e) {
    error_log("Change password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu. Lütfen tekrar deneyin."));
}
?>
