<?php
/**
 * Notification Queue
 * 
 * Asenkron push bildirim kuyruğu.
 * Bildirimleri hemen göndermek yerine kuyruğa ekler,
 * böylece API yanıt süresi azalır.
 * 
 * Kuyruk storage: Veritabanı veya dosya bazlı
 * 
 * @author KültüraX
 * @version 1.0
 */

class NotificationQueue
{
    private $conn;
    private $useDatabase;
    private $queueDir;

    // Tablo adı
    const TABLE_NAME = 'notification_queue';

    /**
     * Constructor
     * 
     * @param PDO|null $conn Veritabanı bağlantısı (null ise dosya bazlı mod)
     */
    public function __construct($conn = null)
    {
        $this->conn = $conn;
        $this->useDatabase = ($conn !== null);

        if (!$this->useDatabase) {
            $this->queueDir = __DIR__ . '/queue';
            if (!is_dir($this->queueDir)) {
                mkdir($this->queueDir, 0755, true);
            }
        }
    }

    /**
     * Bildirimi kuyruğa ekle
     * 
     * @param int $userId Hedef kullanıcı ID
     * @param string $title Bildirim başlığı
     * @param string $message Bildirim mesajı
     * @param array $data Ekstra veri
     * @param string $priority 'high' veya 'normal'
     * @return bool
     */
    public function push($userId, $title, $message, $data = [], $priority = 'normal')
    {
        $notification = [
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'priority' => $priority,
            'created_at' => date('Y-m-d H:i:s'),
            'attempts' => 0
        ];

        if ($this->useDatabase) {
            return $this->pushToDatabase($notification);
        }

        return $this->pushToFile($notification);
    }

    /**
     * Kuyruktan bildirimleri işle
     * 
     * @param int $batchSize Tek seferde işlenecek bildirim sayısı
     * @param callable $sender Bildirim gönderme fonksiyonu
     * @return array İşlenme sonuçları
     */
    public function process($batchSize = 50, callable $sender)
    {
        if ($this->useDatabase) {
            return $this->processFromDatabase($batchSize, $sender);
        }

        return $this->processFromFile($batchSize, $sender);
    }

    /**
     * Kuyruktaki bildirim sayısını al
     */
    public function count()
    {
        if ($this->useDatabase) {
            $query = "SELECT COUNT(*) as count FROM " . self::TABLE_NAME . " WHERE status = 'pending'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $row['count'];
        }

        $files = glob($this->queueDir . '/*.json');
        return count($files);
    }

    // ========== Database Methods ==========

    private function pushToDatabase($notification)
    {
        try {
            $query = "INSERT INTO " . self::TABLE_NAME . " 
                      (user_id, title, message, data, priority, created_at, status) 
                      VALUES (:user_id, :title, :message, :data, :priority, NOW(), 'pending')";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $notification['user_id']);
            $stmt->bindParam(':title', $notification['title']);
            $stmt->bindParam(':message', $notification['message']);
            $dataJson = json_encode($notification['data']);
            $stmt->bindParam(':data', $dataJson);
            $stmt->bindParam(':priority', $notification['priority']);

            return $stmt->execute();
        } catch (Exception $e) {
            error_log("NotificationQueue pushToDatabase error: " . $e->getMessage());
            // Fallback: dosya bazlı
            return $this->pushToFile($notification);
        }
    }

    private function processFromDatabase($batchSize, callable $sender)
    {
        $results = [
            'total' => 0,
            'success' => 0,
            'failed' => 0
        ];

        try {
            // Pending bildirimleri al (priority'e göre sırala)
            $query = "SELECT * FROM " . self::TABLE_NAME . " 
                      WHERE status = 'pending' AND attempts < 3
                      ORDER BY priority DESC, created_at ASC 
                      LIMIT :limit
                      FOR UPDATE SKIP LOCKED";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':limit', $batchSize, PDO::PARAM_INT);
            $stmt->execute();

            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $results['total'] = count($notifications);

            foreach ($notifications as $notification) {
                $data = json_decode($notification['data'], true) ?? [];

                try {
                    $success = $sender(
                        $notification['user_id'],
                        $notification['title'],
                        $notification['message'],
                        $data
                    );

                    if ($success) {
                        // Başarılı - sil veya işaretle
                        $this->markAsProcessed($notification['id']);
                        $results['success']++;
                    } else {
                        $this->incrementAttempts($notification['id']);
                        $results['failed']++;
                    }
                } catch (Exception $e) {
                    error_log("Notification send error: " . $e->getMessage());
                    $this->incrementAttempts($notification['id']);
                    $results['failed']++;
                }
            }

        } catch (Exception $e) {
            error_log("NotificationQueue processFromDatabase error: " . $e->getMessage());
        }

        return $results;
    }

    private function markAsProcessed($id)
    {
        $query = "UPDATE " . self::TABLE_NAME . " SET status = 'sent', processed_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }

    private function incrementAttempts($id)
    {
        $query = "UPDATE " . self::TABLE_NAME . " SET attempts = attempts + 1 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }

    // ========== File-based Methods ==========

    private function pushToFile($notification)
    {
        try {
            $filename = uniqid('notif_') . '_' . $notification['priority'] . '.json';
            $filepath = $this->queueDir . '/' . $filename;

            return file_put_contents($filepath, json_encode($notification), LOCK_EX) !== false;
        } catch (Exception $e) {
            error_log("NotificationQueue pushToFile error: " . $e->getMessage());
            return false;
        }
    }

    private function processFromFile($batchSize, callable $sender)
    {
        $results = [
            'total' => 0,
            'success' => 0,
            'failed' => 0
        ];

        // Dosyaları al (high priority önce)
        $files = glob($this->queueDir . '/*_high.json');
        $normalFiles = glob($this->queueDir . '/*_normal.json');
        $files = array_merge($files, $normalFiles);

        // Batch size'a göre kes
        $files = array_slice($files, 0, $batchSize);
        $results['total'] = count($files);

        foreach ($files as $file) {
            $content = @file_get_contents($file);
            if ($content === false) {
                @unlink($file);
                continue;
            }

            $notification = json_decode($content, true);
            if ($notification === null) {
                @unlink($file);
                continue;
            }

            try {
                $success = $sender(
                    $notification['user_id'],
                    $notification['title'],
                    $notification['message'],
                    $notification['data'] ?? []
                );

                if ($success) {
                    @unlink($file);
                    $results['success']++;
                } else {
                    // Retry sayısını artır
                    $notification['attempts'] = ($notification['attempts'] ?? 0) + 1;

                    if ($notification['attempts'] >= 3) {
                        // Max retry aşıldı, sil
                        @unlink($file);
                        error_log("Notification max retry exceeded, removing: " . $file);
                    } else {
                        file_put_contents($file, json_encode($notification), LOCK_EX);
                    }

                    $results['failed']++;
                }
            } catch (Exception $e) {
                error_log("Notification send error: " . $e->getMessage());
                $results['failed']++;
            }
        }

        return $results;
    }

    /**
     * Eski işlenmiş bildirimleri temizle (maintenance)
     * @param int $olderThanDays Kaç günden eski olanlar silinsin
     */
    public function cleanup($olderThanDays = 7)
    {
        if ($this->useDatabase) {
            $query = "DELETE FROM " . self::TABLE_NAME . " 
                      WHERE status = 'sent' AND processed_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':days', $olderThanDays, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->rowCount();
        }

        return 0; // Dosya bazlı modda cleanup otomatik (başarılı olunca silinir)
    }
}
?>