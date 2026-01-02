<?php
class CacheManager {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get data from cache if it exists and hasn't expired
     */
    public function get($service, $key) {
        $query = "SELECT response_data FROM api_cache 
                  WHERE service = :service 
                  AND cache_key = :key 
                  AND expires_at > NOW()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':service', $service);
        $stmt->bindParam(':key', $key);
        $stmt->execute();

        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            return json_decode($row['response_data'], true);
        }

        return null;
    }

    /**
     * Save data to cache
     * @param string $service Service name (tmdb, spotify, etc.)
     * @param string $key Unique cache key
     * @param mixed $data Data to cache (will be JSON encoded)
     * @param int $ttl Time to live in seconds (default 1 week)
     */
    public function set($service, $key, $data, $ttl = 604800) {
        // Calculate expiration time
        $expiresAt = date('Y-m-d H:i:s', time() + $ttl);
        $jsonData = json_encode($data);

        // Insert or Update
        $query = "INSERT INTO api_cache (service, cache_key, response_data, expires_at) 
                  VALUES (:service, :key, :data, :expires)
                  ON DUPLICATE KEY UPDATE 
                  response_data = :data_update, 
                  expires_at = :expires_update,
                  created_at = NOW()";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':service', $service);
        $stmt->bindParam(':key', $key);
        $stmt->bindParam(':data', $jsonData);
        $stmt->bindParam(':expires', $expiresAt);
        
        // Bind parameters for ON DUPLICATE KEY UPDATE
        $stmt->bindParam(':data_update', $jsonData);
        $stmt->bindParam(':expires_update', $expiresAt);

        return $stmt->execute();
    }
    
    /**
     * Clear expired cache entries (maintenance)
     */
    public function cleanup() {
        $query = "DELETE FROM api_cache WHERE expires_at < NOW()";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute();
    }
}
?>
