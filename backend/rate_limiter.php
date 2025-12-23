<?php
/**
 * Rate Limiter
 * IP ve kullanıcı bazlı istek sınırlama sistemi
 */

class RateLimiter {
    private $conn;
    
    public function __construct($dbConnection) {
        $this->conn = $dbConnection;
    }

    /**
     * Rate limit kontrolü
     * @param string $key - Unique identifier (user_id, IP, vb.)
     * @param string $action - İşlem tipi (register, post, review, vb.)
     * @param int $limit - İzin verilen maksimum istek sayısı
     * @param int $timeWindow - Zaman penceresi (saniye)
     * @return bool - İzin verilirse true, red edilirse false
     */
    public function check($key, $action, $limit, $timeWindow) {
        try {
            // Önce eski kayıtları temizle
            $this->cleanup($action, $timeWindow);
            
            // Mevcut istek sayısını kontrol et
            $query = "SELECT COUNT(*) as count FROM rate_limits 
                      WHERE rate_key = :key 
                      AND action = :action 
                      AND created_at > DATE_SUB(NOW(), INTERVAL :timeWindow SECOND)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':key', $key);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':timeWindow', $timeWindow);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $count = $result['count'];
            
            if ($count >= $limit) {
                return false; // Limit aşıldı
            }
            
            // Yeni istek kaydı ekle
            $insertQuery = "INSERT INTO rate_limits (rate_key, action, created_at) VALUES (:key, :action, NOW())";
            $insertStmt = $this->conn->prepare($insertQuery);
            $insertStmt->bindParam(':key', $key);
            $insertStmt->bindParam(':action', $action);
            $insertStmt->execute();
            
            return true; // İzin verildi
            
        } catch (Exception $e) {
            // Hata durumunda güvenlik için reddet
            error_log("Rate limiter error: " . $e->getMessage());
            return false; // Güvenlik: Hata durumunda isteği reddet
        }
    }

    /**
     * Eski kayıtları temizle
     */
    private function cleanup($action, $timeWindow) {
        try {
            $query = "DELETE FROM rate_limits 
                      WHERE action = :action 
                      AND created_at < DATE_SUB(NOW(), INTERVAL :timeWindow SECOND)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':timeWindow', $timeWindow);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Rate limiter cleanup error: " . $e->getMessage());
        }
    }

    /**
     * Kullanıcının kalan hakkını kontrol et
     */
    public function getRemainingAttempts($key, $action, $limit, $timeWindow) {
        try {
            $query = "SELECT COUNT(*) as count FROM rate_limits 
                      WHERE rate_key = :key 
                      AND action = :action 
                      AND created_at > DATE_SUB(NOW(), INTERVAL :timeWindow SECOND)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':key', $key);
            $stmt->bindParam(':action', $action);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $used = $result['count'];
            
            return max(0, $limit - $used);
        } catch (Exception $e) {
            return $limit;
        }
    }
}

/**
 * Helper fonksiyonu - Hızlı kullanım için
 */
function checkRateLimit($conn, $key, $action, $limit, $timeWindow) {
    $limiter = new RateLimiter($conn);
    
    if (!$limiter->check($key, $action, $limit, $timeWindow)) {
        error_log("Rate limit exceeded for: $key, action: $action");
        http_response_code(429); // Too Many Requests
        echo json_encode(array(
            "message" => "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.",
            "remaining" => 0
        ));
        exit;
    }
}
?>
