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
// Argümanları parse et
$args = array_slice($argv, 1);
$batchSize = 50;
$isDaemon = false;

foreach ($args as $arg) {
    if ($arg === '--daemon') {
        $isDaemon = true;
    } elseif (is_numeric($arg)) {
        $batchSize = (int) $arg;
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Starting notification queue processor...\n";
echo "Mode: " . ($isDaemon ? "Daemon (Continuous)" : "One-off") . "\n";
echo "Batch size: $batchSize\n";

// Kuyruk ve FCM istemcilerini oluştur
// Not: Daemon modunda DB bağlantısı kopsa bile supervisord scripti yeniden başlatacaktır.
$queue = new NotificationQueue($conn);
$fcm = new FCM($conn);

while (true) {
    try {
        // Kuyruktaki bildirim sayısı
        $pendingCount = $queue->count();

        if ($pendingCount === 0) {
            if ($isDaemon) {
                // Bekle ve tekrar kontrol et
                sleep(2);
                continue;
            } else {
                echo "No notifications to process. Exiting.\n";
                break;
            }
        }

        echo "Processing $pendingCount pending notifications...\n";

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
        echo "Batch Results: Total: {$results['total']}, Success: {$results['success']}, Failed: {$results['failed']}\n";

        // Eski bildirimleri temizle (Sadece daemon modunda arada bir veya one-off modunda her zaman)
        if (!$isDaemon || rand(1, 100) === 1) {
            $cleanedCount = $queue->cleanup(7);
            if ($cleanedCount > 0) {
                echo "Cleaned up $cleanedCount old notifications.\n";
            }
        }

        if (!$isDaemon) {
            break;
        }

        // Cpu dinlendirme (kısa bir sleep)
        usleep(100000); // 0.1s

    } catch (Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
        error_log("Notification queue processor error: " . $e->getMessage());

        if (!$isDaemon) {
            exit(1);
        }
        sleep(5); // Hata durumunda bekle
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Done.\n";
?>
