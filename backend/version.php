<?php
/**
 * Version API - KültüraX
 * 
 * Mobil uygulama için versiyon bilgilerini döndürür.
 * 
 * Kullanım:
 * - latest_version: Uygulama versiyonunu artırarak kullanıcılara güncelleme bildirimi gönderebilirsiniz
 * - minimum_version: Bu versiyonun altındaki kullanıcılar uygulamayı kullanamaz (zorunlu güncelleme)
 * 
 * Endpoint: GET /api/version.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token, X-App-Signature');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Android & iOS store URLs
$android_store_url = 'https://play.google.com/store/apps/details?id=com.anonymous.kitapmuzikfilm';
$ios_store_url = 'https://apps.apple.com/app/idXXXXXXXXX'; // iOS App Store ID'yi güncelleyin

// Detect platform from User-Agent (optional, for platform-specific URLs)
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$is_ios = stripos($user_agent, 'iPhone') !== false || stripos($user_agent, 'iPad') !== false;
$update_url = $is_ios ? $ios_store_url : $android_store_url;

echo json_encode([
    'latest_version'  => '0.0.2',      // En son versiyon - güncelleme için artırın
    'minimum_version' => '0.0.1',      // Minimum desteklenen versiyon
    'update_url'      => $update_url,
    'release_notes'   => 'Yeni özellikler ve hata düzeltmeleri'
], JSON_UNESCAPED_UNICODE);
