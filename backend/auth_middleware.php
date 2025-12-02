<?php
/**
 * Auth Middleware - Token Validation
 * Bu dosya tüm korumalı endpoint'lerde kullanılacak
 */

function validateToken() {
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
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

    $query = "SELECT id FROM users WHERE token = :token";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['id'];
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Geçersiz veya süresi dolmuş token."));
        exit;
    }
}

function requireAuth() {
    $userId = validateToken();
    return $userId;
}

function generateToken($userId) {
    return bin2hex(random_bytes(32));
}
?>
