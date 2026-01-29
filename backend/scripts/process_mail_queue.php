<?php
// Worker: Process Mail Queue
// Run this via cron: * * * * * php /path/to/process_mail_queue.php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../mail/SimpleSMTP.php';
$mailConfig = require __DIR__ . '/../mail/config.php';

// Prevent timeout for long running script
set_time_limit(55); // Less than 60s to avoid overlap if running every minute

try {
    // 1. Fetch pending emails (Limit 20 per run to prevent overloading)
    // Also retry failed ones if attempts < 3 and created_at > 1 hour ago
    $stmt = $conn->prepare("SELECT id, recipient_email, subject, body, from_name, status, attempts, created_at FROM mail_queue 
                            WHERE status = 'pending' 
                            OR (status = 'failed' AND attempts < 3 AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR))
                            ORDER BY created_at ASC 
                            LIMIT 20");
    $stmt->execute();
    $emails = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($emails)) {
        // Nothing to do
        exit;
    }

    $smtp = new SimpleSMTP(
        $mailConfig['smtp_host'],
        $mailConfig['smtp_port'],
        $mailConfig['smtp_username'],
        $mailConfig['smtp_password']
    );

    foreach ($emails as $email) {
        $id = $email['id'];
        
        // Update to processing (optional, simple locking could be implemented if multiple workers)
        // Here we just increment attempts immediately
        $conn->prepare("UPDATE mail_queue SET attempts = attempts + 1 WHERE id = ?")->execute([$id]);

        try {
            $fromName = $email['from_name'] ?: $mailConfig['from_name'];
            $sent = $smtp->send($email['recipient_email'], $email['subject'], $email['body'], $fromName);

            if ($sent) {
                // Success
                $update = $conn->prepare("UPDATE mail_queue SET status = 'sent', processed_at = NOW(), error_message = NULL WHERE id = ?");
                $update->execute([$id]);
                echo "Email sent ID: $id\n";
            } else {
                throw new Exception("SMTP send returned false");
            }
        } catch (Exception $e) {
            // Failure
            $errorMsg = substr($e->getMessage(), 0, 1000); // Truncate
            $update = $conn->prepare("UPDATE mail_queue SET status = 'failed', error_message = ?, processed_at = NULL WHERE id = ?");
            $update->execute([$errorMsg, $id]);
            echo "Email failed ID: $id - " . $e->getMessage() . "\n";
        }
    }

} catch (Exception $e) {
    echo "Worker Error: " . $e->getMessage() . "\n";
}
?>
