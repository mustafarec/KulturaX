<?php
/**
 * Notification Queue Processor
 * 
 * Bu script cron job olarak çalışır ve kuyruktaki bildirimleri işler.
 * 
 * Kurulum (crontab -e):
 * * * * * * php /path/to/backend/notifications/process_queue.php >> /var/log/notification_queue.log 2>&1
 * 
 * Veya CLI'den manuel çalıştırma:
 * php process_queue.php [batch_size]
 * 
 * @author KültüraX
 * @version 1.0
 */

// CLI kontrolü
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo json_encode(['error' => 'This script can only be run from CLI']);
    exit(1);
}

// Gerekli dosyaları yükle
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/NotificationQueue.php';
require_once __DIR__ . '/FCM.php';

// Batch size (varsayılan 50)
$batchSize = isset($argv[1]) ? (int) $argv[1] : 50;

echo "[" . date('Y-m-d H:i:s') . "] Starting notification queue processor...\n";
echo "Batch size: $batchSize\n";

try {
    // Kuyruk ve FCM istemcilerini oluştur
    $queue = new NotificationQueue($conn);
    $fcm = new FCM($conn);

    // Kuyruktaki bildirim sayısı
    $pendingCount = $queue->count();
    echo "Pending notifications: $pendingCount\n";

    if ($pendingCount === 0) {
        echo "No notifications to process. Exiting.\n";
        exit(0);
    }

    // Bildirimleri işle
    $results = $queue->process($batchSize, function ($userId, $title, $message, $data) use ($fcm) {
        // FCM ile bildirim gönder
        $result = $fcm->sendToUser($userId, $title, $message, $data);

        // Başarı kontrolü
        if ($result === false) {
            return false;
        }

        // En az bir token'a başarılı gönderdiyse success
        if (is_array($result)) {
            foreach ($result as $res) {
                if (isset($res['httpCode']) && $res['httpCode'] === 200) {
                    return true;
                }
            }
        }

        return false;
    });

    // Sonuçları yazdır
    echo "\n=== Results ===\n";
    echo "Total processed: {$results['total']}\n";
    echo "Success: {$results['success']}\n";
    echo "Failed: {$results['failed']}\n";

    // Eski bildirimleri temizle (7 günden eski olanlar)
    $cleanedCount = $queue->cleanup(7);
    if ($cleanedCount > 0) {
        echo "Cleaned up $cleanedCount old notifications.\n";
    }

    echo "[" . date('Y-m-d H:i:s') . "] Done.\n\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    error_log("Notification queue processor error: " . $e->getMessage());
    exit(1);
}
?>