<?php
/**
 * Auth Middleware - Token Validation with Expiry Support
 * Bu dosya tüm korumalı endpoint'lerde kullanılacak
 * 
 * Güvenlik Özellikleri:
 * - Token süre dolumu kontrolü (30 gün)
 * - Otomatik token yenileme (son 7 gün içinde kullanılırsa)
 * - Token önbellekleme (performans optimizasyonu)
 */

// Token Cache sınıfını yükle
require_once __DIR__ . '/TokenCache.php';

// Token geçerlilik süresi (saniye cinsinden)
define('TOKEN_LIFETIME', 30 * 24 * 60 * 60); // 30 gün
define('TOKEN_REFRESH_THRESHOLD', 7 * 24 * 60 * 60); // Son 7 gün içinde yenile

function validateToken() {
    // Headers'ı al
    $headers = getallheaders();
    $authHeader = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        // Bazı sunucular küçük harf kullanır
        $authHeader = $headers['authorization'];
    } elseif (isset($headers['X-Auth-Token'])) {
        $authHeader = 'Bearer ' . $headers['X-Auth-Token'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['HTTP_X_AUTH_TOKEN'])) {
        $authHeader = 'Bearer ' . $_SERVER['HTTP_X_AUTH_TOKEN'];
    } elseif (isset($_GET['token'])) {
        $authHeader = 'Bearer ' . $_GET['token'];
    } elseif (isset($_POST['token'])) {
        $authHeader = 'Bearer ' . $_POST['token'];
    }
    
    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(array("message" => "Authorization header eksik."));
        exit;
    }

    // Bearer token formatını kontrol et
    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(array("message" => "Geçersiz token formatı."));
        exit;
    }

    $token = $matches[1];

    // Veritabanından token kontrolü
    global $conn;
    
    // Eğer conn yoksa (config.php include edilmemişse) hata ver
    if (!isset($conn)) {
        http_response_code(500);
        echo json_encode(array("message" => "Veritabanı bağlantısı bulunamadı."));
        exit;
    }

    // 1. Önce cache'e bak
    $cached = TokenCache::get($token);
    if ($cached !== false) {
        // Cache hit - Token süre dolumu kontrolü
        if (!empty($cached['expires_at'])) {
            $expiresAt = strtotime($cached['expires_at']);
            $now = time();
            
            if ($now > $expiresAt) {
                // Token süresi dolmuş - cache'i temizle
                TokenCache::invalidate($token);
                http_response_code(401);
                echo json_encode(array(
                    "message" => "Token süresi dolmuş. Lütfen tekrar giriş yapın.",
                    "code" => "TOKEN_EXPIRED"
                ));
                exit;
            }
            
            // Token yenileme: Son 7 gün kaldıysa süreyi uzat
            $timeRemaining = $expiresAt - $now;
            if ($timeRemaining < TOKEN_REFRESH_THRESHOLD) {
                refreshTokenExpiry($conn, $cached['user_id']);
                // Cache'i güncelle
                $newExpiry = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
                TokenCache::set($token, $cached['user_id'], $newExpiry);
            }
        }
        
        return $cached['user_id'];
    }

    // 2. Cache miss - Veritabanından token kontrolü
    $query = "SELECT id, token_expires_at FROM users WHERE token = :token";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Token süre dolumu kontrolü
        if (!empty($row['token_expires_at'])) {
            $expiresAt = strtotime($row['token_expires_at']);
            $now = time();
            
            if ($now > $expiresAt) {
                // Token süresi dolmuş
                http_response_code(401);
                echo json_encode(array(
                    "message" => "Token süresi dolmuş. Lütfen tekrar giriş yapın.",
                    "code" => "TOKEN_EXPIRED"
                ));
                exit;
            }
            
            // Token yenileme: Son 7 gün kaldıysa süreyi uzat
            $timeRemaining = $expiresAt - $now;
            if ($timeRemaining < TOKEN_REFRESH_THRESHOLD) {
                refreshTokenExpiry($conn, $row['id']);
                $row['token_expires_at'] = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
            }
        }
        
        // 3. Sonucu cache'e yaz
        TokenCache::set($token, $row['id'], $row['token_expires_at']);
        
        return $row['id'];
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Geçersiz veya süresi dolmuş token."));
        exit;
    }
}

/**
 * Token süresini uzat
 */
function refreshTokenExpiry($conn, $userId) {
    try {
        $newExpiry = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
        $query = "UPDATE users SET token_expires_at = :expires_at WHERE id = :user_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':expires_at', $newExpiry);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
    } catch (Exception $e) {
        // Sessizce başarısız ol, kullanıcıyı etkilemesin
        error_log("Token refresh failed: " . $e->getMessage());
    }
}

function requireAuth() {
    $userId = validateToken();
    return $userId;
}

function generateToken($userId) {
    return bin2hex(random_bytes(32));
}

/**
 * Token oluştur ve veritabanına kaydet (login.php'de kullanılacak)
 */
function createTokenWithExpiry($conn, $userId) {
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
    
    $query = "UPDATE users SET token = :token, token_expires_at = :expires_at WHERE id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->bindParam(':expires_at', $expiresAt);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    return $token;
}
?>
