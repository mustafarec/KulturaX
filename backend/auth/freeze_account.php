<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../validation.php';
include_once '../auth_middleware.php';

// Token doğrulama - requireAuth() kullan
try {
    $userId = requireAuth();
} catch (Exception $e) {
    // requireAuth zaten exit yapıyor, buraya düşmemeli
    http_response_code(401);
    echo json_encode(array("message" => "Yetkilendirme gerekli."));
    exit;
}

// Kullanıcı bilgilerini al
try {
    $userStmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(array("message" => "Kullanıcı bulunamadı."));
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Veritabanı hatası: " . $e->getMessage()));
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// Şifre kontrolü (güvenlik için)
if (!isset($data->password)) {
    http_response_code(400);
    echo json_encode(array("message" => "Şifre gereklidir."));
    exit;
}

try {
    // Kullanıcıyı ve şifresini al
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData || !password_verify($data->password, $userData['password'])) {
        http_response_code(401);
        echo json_encode(array("message" => "Şifre yanlış."));
        exit;
    }

    // Hesabı dondur
    $reason = isset($data->reason) ? Validator::sanitizeInput($data->reason) : 'Kullanıcı isteği';
    
    $updateStmt = $conn->prepare("UPDATE users SET is_frozen = 1, frozen_at = NOW(), frozen_reason = ? WHERE id = ?");
    $updateStmt->execute([$reason, $user['id']]);

    // Aktif oturumları sonlandır (token'ları sil)
    // users tablosundaki token'ı temizle
    try {
        $clearToken = $conn->prepare("UPDATE users SET token = NULL, token_expires_at = NULL WHERE id = ?");
        $clearToken->execute([$user['id']]);
    } catch (Exception $e) {
        error_log("Token clear error (non-critical): " . $e->getMessage());
    }
    
    // user_tokens tablosu varsa oradaki token'ları da sil (opsiyonel)
    try {
        $deleteTokens = $conn->prepare("DELETE FROM user_tokens WHERE user_id = ?");
        $deleteTokens->execute([$user['id']]);
    } catch (Exception $e) {
        // Tablo yoksa veya hata olursa devam et
        error_log("user_tokens delete error (non-critical): " . $e->getMessage());
    }

    http_response_code(200);
    echo json_encode(array(
        "message" => "Hesabınız başarıyla donduruldu. Tekrar aktifleştirmek için giriş yapın.",
        "success" => true
    ));

} catch (PDOException $e) {
    error_log("Freeze Account Error: " . $e->getMessage());
    http_response_code(500);
    
    // is_frozen kolonu yoksa özel mesaj
    if (strpos($e->getMessage(), 'is_frozen') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
        echo json_encode(array("message" => "Veritabanı güncellemesi gerekli. Lütfen add_frozen_fields.sql migration'ını çalıştırın."));
    } else {
        echo json_encode(array("message" => "Veritabanı hatası: " . $e->getMessage()));
    }
}
?>
