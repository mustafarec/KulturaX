<?php
class OneSignal {
    private $conn;
    private $appId;
    private $apiKey;

    public function __construct($db) {
        $this->conn = $db;
        $this->loadCredentials();
    }

    private function loadCredentials() {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
            $this->appId = $env['ONESIGNAL_APP_ID'] ?? '';
            $this->apiKey = $env['ONESIGNAL_API_KEY'] ?? '';
        }
    }

    public function sendToUser($userId, $title, $message, $data = null) {
        file_put_contents(__DIR__ . '/../debug_log.txt', date('Y-m-d H:i:s') . " - OneSignal: Sending to user $userId\n", FILE_APPEND);
        
        if (empty($this->appId) || empty($this->apiKey)) {
            error_log("OneSignal credentials missing");
            file_put_contents(__DIR__ . '/../debug_log.txt', date('Y-m-d H:i:s') . " - OneSignal: Credentials missing\n", FILE_APPEND);
            return false;
        }

        // Get user's device tokens
        $tokens = $this->getUserTokens($userId);
        if (empty($tokens)) {
            error_log("No device tokens found for user $userId");
            file_put_contents(__DIR__ . '/../debug_log.txt', date('Y-m-d H:i:s') . " - OneSignal: No tokens for user $userId\n", FILE_APPEND);
            return false;
        }

        $fields = array(
            'app_id' => $this->appId,
            'include_player_ids' => $tokens,
            'headings' => array("en" => $title),
            'contents' => array("en" => $message),
            'data' => $data
        );

        $fields = json_encode($fields);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://onesignal.com/api/v1/notifications");
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json; charset=utf-8',
            'Authorization: Basic ' . $this->apiKey
        ));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        curl_setopt($ch, CURLOPT_POST, TRUE);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);

        $response = curl_exec($ch);
        curl_close($ch);

        file_put_contents(__DIR__ . '/../debug_log.txt', date('Y-m-d H:i:s') . " - OneSignal Response: " . $response . "\n", FILE_APPEND);

        return $response;
    }

    private function getUserTokens($userId) {
        $query = "SELECT token FROM device_tokens WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        $tokens = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tokens[] = $row['token'];
        }
        file_put_contents(__DIR__ . '/../debug_log.txt', date('Y-m-d H:i:s') . " - OneSignal: Found " . count($tokens) . " tokens for user $userId\n", FILE_APPEND);
        return $tokens;
    }
}
?>
