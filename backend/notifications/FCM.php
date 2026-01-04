<?php
/**
 * Firebase Cloud Messaging Push Notification Handler
 * Uses FCM HTTP v1 API for sending push notifications
 */
class FCM
{
    private $conn;
    private $projectId;
    private $serviceAccountPath;
    private $accessToken;
    private $tokenExpiry;

    public function __construct($db)
    {
        $this->conn = $db;
        $this->loadCredentials();
    }

    private function loadCredentials()
    {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
            $this->projectId = $env['FIREBASE_PROJECT_ID'] ?? '';
            $serviceAccountFile = $env['FIREBASE_SERVICE_ACCOUNT'] ?? 'firebase-service-account.json';
            $this->serviceAccountPath = __DIR__ . '/../' . $serviceAccountFile;
        }
    }

    /**
     * Get OAuth 2.0 access token using service account credentials
     */
    private function getAccessToken()
    {
        // Return cached token if still valid
        if ($this->accessToken && $this->tokenExpiry && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }

        if (!file_exists($this->serviceAccountPath)) {
            return null;
        }

        $serviceAccount = json_decode(file_get_contents($this->serviceAccountPath), true);
        if (!$serviceAccount) {
            return null;
        }

        // Create JWT
        $now = time();
        $expiry = $now + 3600; // 1 hour

        $header = [
            'alg' => 'RS256',
            'typ' => 'JWT'
        ];

        $claims = [
            'iss' => $serviceAccount['client_email'],
            'sub' => $serviceAccount['client_email'],
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $expiry,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging'
        ];

        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $claimsEncoded = $this->base64UrlEncode(json_encode($claims));

        $signature = '';
        $privateKey = openssl_pkey_get_private($serviceAccount['private_key']);
        if (!$privateKey) {
            return null;
        }

        openssl_sign($headerEncoded . '.' . $claimsEncoded, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $signatureEncoded = $this->base64UrlEncode($signature);

        $jwt = $headerEncoded . '.' . $claimsEncoded . '.' . $signatureEncoded;

        // Exchange JWT for access token
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            return null;
        }

        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'] ?? null;
        $this->tokenExpiry = $now + ($data['expires_in'] ?? 3600) - 60; // 1 minute buffer

        return $this->accessToken;
    }

    private function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Send notification to a specific user (synchronous)
     */
    public function sendToUser($userId, $title, $message, $data = null)
    {
        if (empty($this->projectId)) {
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return false;
        }

        // Get user's device tokens
        $tokens = $this->getUserTokens($userId);
        if (empty($tokens)) {
            return false;
        }

        $results = [];
        foreach ($tokens as $token) {
            $result = $this->sendNotification($accessToken, $token, $title, $message, $data);
            $results[] = $result;
        }

        return $results;
    }

    /**
     * Send notification asynchronously (queued for background processing)
     * 
     * Bu method bildirimi kuyruğa ekler ve hemen döner.
     * Gerçek gönderim process_queue.php tarafından yapılır.
     * 
     * @param int $userId Hedef kullanıcı ID
     * @param string $title Bildirim başlığı
     * @param string $message Bildirim mesajı
     * @param array $data Ekstra veri
     * @param string $priority 'high' veya 'normal'
     * @return bool Kuyruğa ekleme başarısı
     */
    public function sendToUserAsync($userId, $title, $message, $data = null, $priority = 'normal')
    {
        try {
            require_once __DIR__ . '/NotificationQueue.php';

            $queue = new NotificationQueue($this->conn);
            $success = $queue->push($userId, $title, $message, $data ?? [], $priority);

            if (!$success) {
                // Kuyruk başarısız - sadece logla, fallback yapma (çift bildirim önleme)
                error_log("NotificationQueue push failed for user: $userId");
                return false;
            }

            return true;
        } catch (Exception $e) {
            // Hata durumunda fallback yapma
            error_log("sendToUserAsync error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a single notification to a device token
     */
    private function sendNotification($accessToken, $token, $title, $message, $data)
    {
        // Build data payload - all values must be strings
        $dataPayload = [
            'title' => (string) $title,
            'body' => (string) $message,
        ];

        // Merge additional data
        if ($data && is_array($data)) {
            foreach ($data as $key => $value) {
                $dataPayload[$key] = is_string($value) ? $value : json_encode($value);
            }
        }

        // FCM v1 API payload with both notification and data
        // notification: System-level display (reliable for background/killed state)
        // data: Custom handling in app (foreground processing by app code)
        $payload = [
            'message' => [
                'token' => $token,
                // Notification payload - Android will show this automatically when app is in background/killed
                'notification' => [
                    'title' => (string) $title,
                    'body' => (string) $message
                ],
                // Data payload - for custom app handling in foreground
                'data' => $dataPayload,
                // Android specific settings
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'messages',  // Must match channel created in app
                        'sound' => 'default',
                        'default_vibrate_timings' => true,
                        'default_light_settings' => true
                    ]
                ],
                // iOS specific settings  
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10'
                    ],
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => (string) $title,
                                'body' => (string) $message
                            ],
                            'sound' => 'default',
                            'badge' => 1
                        ]
                    ]
                ]
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send");
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            // Handle invalid/expired tokens
            $responseData = json_decode($response, true);
            if (isset($responseData['error']['details'])) {
                foreach ($responseData['error']['details'] as $detail) {
                    if (
                        isset($detail['errorCode']) &&
                        in_array($detail['errorCode'], ['UNREGISTERED', 'INVALID_ARGUMENT'])
                    ) {
                        // Token is invalid, remove it from database
                        $this->removeInvalidToken($token);
                    }
                }
            }
        }

        return [
            'httpCode' => $httpCode,
            'response' => $response
        ];
    }

    /**
     * Get all device tokens for a user
     */
    private function getUserTokens($userId)
    {
        $query = "SELECT token FROM device_tokens WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        $tokens = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tokens[] = $row['token'];
        }
        return $tokens;
    }

    /**
     * Remove invalid token from database
     */
    private function removeInvalidToken($token)
    {
        try {
            $query = "DELETE FROM device_tokens WHERE token = :token";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
        } catch (Exception $e) {
            // Silently fail
        }
    }
}
?>