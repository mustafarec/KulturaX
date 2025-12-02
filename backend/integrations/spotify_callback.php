<?php
include_once '../config.php';

if (isset($_GET['code'])) {
    $code = $_GET['code'];
    $state = $_GET['state']; // user_id
    $user_id = $state;

    $token_url = 'https://accounts.spotify.com/api/token';
    // Authorization Code Flow için parametreler
    $data = array(
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => SPOTIFY_REDIRECT_URI
    );

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $token_url);
    curl_setopt($ch, CURLOPT_POST, 1);
    
    // http_build_query zaten URL encode yapar, bu doğru
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Authorization header'ını oluştur
    $auth_header = 'Authorization: Basic ' . base64_encode(SPOTIFY_CLIENT_ID . ':' . SPOTIFY_CLIENT_SECRET);
    
    $headers = [
        $auth_header,
        'Content-Type: application/x-www-form-urlencoded'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    curl_close($ch);

    $token_data = json_decode($response, true);

    if (isset($token_data['access_token'])) {
        $access_token = $token_data['access_token'];
        $refresh_token = $token_data['refresh_token'];
        $expires_in = $token_data['expires_in'];
        $expires_at = date('Y-m-d H:i:s', time() + $expires_in);

        // Veritabanına kaydet (Varsa güncelle, yoksa ekle)
        $query = "INSERT INTO user_integrations (user_id, provider, access_token, refresh_token, expires_at) 
                  VALUES (:user_id, 'spotify', :access_token, :refresh_token, :expires_at)
                  ON DUPLICATE KEY UPDATE 
                  access_token = :access_token_update, 
                  refresh_token = :refresh_token_update, 
                  expires_at = :expires_at_update";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':access_token', $access_token);
        $stmt->bindParam(':refresh_token', $refresh_token);
        $stmt->bindParam(':expires_at', $expires_at);
        
        $stmt->bindParam(':access_token_update', $access_token);
        $stmt->bindParam(':refresh_token_update', $refresh_token);
        $stmt->bindParam(':expires_at_update', $expires_at);

        if ($stmt->execute()) {
            // Başarılı, uygulamaya geri dön
            // Deep link şeması: kitapmuzikfilm://settings?status=success&provider=spotify
            // Şimdilik basit bir başarı sayfası gösterelim, deep link sonraki iş
            echo "<h1>Spotify Başarıyla Bağlandı!</h1><p>Uygulamaya geri dönebilirsiniz.</p>";
            // header("Location: kitapmuzikfilm://settings?status=success"); // Mobil uygulama için
        } else {
            echo "Veritabanı hatası.";
        }
    } else {
        echo "<h1>Bağlantı Hatası</h1>";
        echo "<p>Token alınamadı. Spotify'dan dönen hata:</p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
        echo "<hr>";
        echo "<h3>Debug Bilgileri:</h3>";
        echo "<p><strong>Kullanılan Redirect URI:</strong> " . SPOTIFY_REDIRECT_URI . "</p>";
        echo "<p><strong>Dashboard'daki URI ile bu URI'nin BİREBİR aynı olduğundan emin olun.</strong></p>";
        echo "<p><strong>Gönderilen Code (İlk 10 karakter):</strong> " . substr($code, 0, 10) . "...</p>";
    }
} else {
    echo "Hata: Kod bulunamadı.";
}
?>
