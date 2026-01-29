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

function validateToken()
{
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

    // Token hash'ini hesapla (güvenlik için)
    $tokenHash = hash('sha256', $token);

    // Veritabanından token kontrolü
    global $conn;

    // Eğer conn yoksa (config.php include edilmemişse) hata ver
    if (!isset($conn)) {
        http_response_code(500);
        echo json_encode(array("message" => "Veritabanı bağlantısı bulunamadı."));
        exit;
    }

    // 1. Önce cache'e bak (TokenCache kendisi hash'ler)
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
                TokenCache::set($tokenHash, $cached['user_id'], $newExpiry);
            }
        }

        return $cached['user_id'];
    }

    // 2. Cache miss - Veritabanından token kontrolü (Multi-Session Support)
    // user_sessions tablosunu kontrol et
    // SERVER SCHEMA: id, user_id, token_hash, device_id, device_name, device_type, ip_address, user_agent, expires_at, last_active_at, created_at, is_active
    $query = "SELECT s.user_id, s.expires_at, s.last_active_at 
              FROM user_sessions s 
              WHERE s.token_hash = :token_hash AND (s.is_active = 1 OR s.is_active IS NULL)";
              
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':token_hash', $tokenHash);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $expiresAt = strtotime($row['expires_at']);
        $now = time();

        if ($now > $expiresAt) {
            // Token süresi dolmuş - DB'den sil
            $deleteQuery = "DELETE FROM user_sessions WHERE token_hash = :token_hash";
            $delStmt = $conn->prepare($deleteQuery);
            $delStmt->bindValue(':token_hash', $tokenHash);
            $delStmt->execute();

            http_response_code(401);
            echo json_encode(array(
                "message" => "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
                "code" => "SESSION_EXPIRED"
            ));
            exit;
        }

        // Token yenileme / Last Seen Güncelleme
        // Her istekte update yapmamak için buffer kullan (örn: 5 dakikada bir)
        $lastUsed = $row['last_active_at'] ? strtotime($row['last_active_at']) : 0;
        if ($now - $lastUsed > 300) { // 5 dakika
            updateSessionActivity($conn, $tokenHash);
        }

        // Cache'e yaz (Raw token ile!)
        TokenCache::set($token, $row['user_id'], $row['expires_at']);

        return $row['user_id'];
    }

    // Fallback: Legacy 'users' table check (Migration süreci için opsiyonel, ama burada kaldırıyoruz)
    // Ruthless review: Eski tekil oturum yapısını desteklemeyi bırakıyoruz.
    // Kullanıcıların tekrar login olması gerekecek.
    
    http_response_code(401);
    echo json_encode(array("message" => "Geçersiz veya süresi dolmuş oturum.", "code" => "INVALID_TOKEN"));
    exit;
}

/**
 * Update session activity timestamp
 */
function updateSessionActivity($conn, $tokenHash)
{
    try {
        // Expiry'yi de uzat (Sliding Window)
        $newExpiry = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
        $nowStr = date('Y-m-d H:i:s');
        
        $query = "UPDATE user_sessions SET last_active_at = :last_used, expires_at = :expires_at WHERE token_hash = :token_hash";
        $stmt = $conn->prepare($query);
        $stmt->bindValue(':last_used', $nowStr);
        $stmt->bindValue(':expires_at', $newExpiry);
        $stmt->bindValue(':token_hash', $tokenHash);
        $stmt->execute();
    } catch (Exception $e) {
        // Update hatası logla ama akışı bozma
        error_log("Session update failed: " . $e->getMessage());
    }
}

/**
 * Compatibility wrapper
 */
function refreshTokenExpiry($conn, $userId) {
    // Deprecated in favor of updateSessionActivity
    // Legacy calls might need refactoring
}

function requireAuth()
{
    $userId = validateToken();
    return $userId;
}

function generateToken($userId)
{
    return bin2hex(random_bytes(32));
}

/**
 * Yeni Session Oluştur (Multi-Device)
 * @param PDO $conn
 * @param int $userId
 * @param string|null $deviceInfo User-Agent vb.
 * @return string Plain token
 */
function createSession($conn, $userId, $deviceInfo = null)
{
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + TOKEN_LIFETIME);
    $ip = getClientIp();

    // SERVER SCHEMA UPDATE:
    // Columns: insert into user_agent (instead of device_info), last_active_at, is_active
    // Skipping device_id, device_name, device_type (assuming nullable/default)
    $query = "INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, expires_at, last_active_at, is_active) 
              VALUES (:user_id, :token_hash, :device_info, :ip, :expires_at, NOW(), 1)";
    
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':token_hash', $tokenHash);
    $stmt->bindValue(':device_info', substr($deviceInfo, 0, 255)); // Truncate to fit
    $stmt->bindValue(':ip', $ip);
    $stmt->bindValue(':expires_at', $expiresAt);
    $stmt->execute();

    return $token;
}

/**
 * Legacy Support Wrapper
 */
function createTokenWithExpiry($conn, $userId)
{
    return createSession($conn, $userId, $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');
}
?>
