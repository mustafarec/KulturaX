<?php
/**
 * Validation Functions
 * Kullanıcı girdilerini doğrulama ve temizleme fonksiyonları
 */

class Validator
{

    /**
     * String validasyonu
     */
    public static function validateString($input, $minLength = 1, $maxLength = 255)
    {
        if (!is_string($input)) {
            return false;
        }

        $length = mb_strlen(trim($input));
        return $length >= $minLength && $length <= $maxLength;
    }

    /**
     * Email validasyonu
     */
    public static function validateEmail($email)
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Integer validasyonu
     */
    public static function validateInteger($input, $min = null, $max = null)
    {
        if (!is_numeric($input)) {
            return false;
        }

        $value = (int) $input;

        if ($min !== null && $value < $min) {
            return false;
        }

        if ($max !== null && $value > $max) {
            return false;
        }

        return true;
    }

    /**
     * Enum validasyonu
     */
    public static function validateEnum($input, $allowedValues)
    {
        return in_array($input, $allowedValues, true);
    }

    /**
     * Input temizleme
     */
    public static function sanitizeInput($input)
    {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }

        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * URL validasyonu
     */
    public static function validateUrl($url)
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Tarih validasyonu
     */
    public static function validateDate($date, $format = 'Y-m-d')
    {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    /**
     * JSON validasyonu
     */
    public static function validateJson($string)
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Telefon numarası validasyonu (Türkiye)
     */
    public static function validatePhoneNumber($phone)
    {
        // Türk telefon numarası formatı: +90 veya 0 ile başlayan 10 haneli
        $pattern = '/^(\+90|0)?[0-9]{10}$/';
        return preg_match($pattern, $phone) === 1;
    }

    /**
     * Şifre gücü kontrolü
     * @param string $password Şifre
     * @param bool $returnMessage true ise başarısızlıkta mesaj döndürür
     * @return bool|array
     */
    public static function validatePasswordStrength($password, $returnMessage = false)
    {
        $errors = [];

        // En az 8 karakter
        if (strlen($password) < 8) {
            $errors[] = "en az 8 karakter";
        }

        // En az 1 büyük harf
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "en az 1 büyük harf";
        }

        // En az 1 küçük harf
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "en az 1 küçük harf";
        }

        // En az 1 rakam
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "en az 1 rakam";
        }

        // En az 1 özel karakter
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\\\/~`]/', $password)) {
            $errors[] = "en az 1 özel karakter (!@#$%^&* vb.)";
        }

        if (count($errors) > 0) {
            if ($returnMessage) {
                return [
                    "valid" => false,
                    "message" => "Şifre şunları içermelidir: " . implode(", ", $errors)
                ];
            }
            return false;
        }

        return $returnMessage ? ["valid" => true] : true;
    }

    /**
     * Spam kontrolü (optimize edilmiş)
     * Kısa metinler atlanır, static keywords ile performans artırılır
     */
    public static function detectSpam($text)
    {
        // Boş veya çok kısa metinleri atla (10 karakterden az - spam olamaz)
        if (empty($text) || mb_strlen($text) < 10) {
            return false;
        }

        // Spam keywords (static - her çağrıda yeniden oluşturulmaz)
        static $spamKeywords = ['viagra', 'casino', 'xxx', 'porn', 'sex', 'click here', 'buy now', 'free money', 'winner', 'lottery'];

        $lowerText = strtolower($text);

        // Keyword kontrolü (strpos en hızlı yöntem)
        foreach ($spamKeywords as $keyword) {
            if (strpos($lowerText, $keyword) !== false) {
                return true;
            }
        }

        // Aşırı link kontrolü (sadece 100+ karakter metinlerde)
        if (mb_strlen($text) > 100) {
            $linkCount = preg_match_all('/https?:\/\//', $text);
            if ($linkCount > 3) {
                return true;
            }
        }

        return false;
    }

    /**
     * Rate limit kontrolü için yardımcı
     */
    public static function validateRateLimit($userId, $action, $limit, $timeWindow)
    {
        // Bu fonksiyon rate_limiter.php ile birlikte çalışacak
        return true;
    }

    /**
     * Güvenli Görsel Dosya Kontrolü
     * @param array $file $_FILES['input_name'] dizisi
     * @return array|bool Hata mesajı dizisi veya true
     */
    public static function validateImageFile($file)
    {
        // 1. Dosya Yükleme Hatası Kontrolü
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ["status" => false, "message" => "Dosya yüklenirken bir hata oluştu."];
        }

        // 2. Boyut Kontrolü (Örn: 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            return ["status" => false, "message" => "Dosya boyutu çok büyük (Max 5MB)."];
        }

        // 3. Uzantı Kontrolü (Whitelist)
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions)) {
            return ["status" => false, "message" => "Geçersiz dosya uzantısı. Sadece JPG, PNG, GIF ve WEBP."];
        }

        // 4. MIME Type Kontrolü (Dosya içeriğinden)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (!in_array($mimeType, $allowedMimeTypes)) {
            return ["status" => false, "message" => "Geçersiz dosya içeriği. (MIME: $mimeType)"];
        }

        // 5. Ekstra Resim Kontrolü (getimagesize)
        if (!getimagesize($file['tmp_name'])) {
            return ["status" => false, "message" => "Dosya geçerli bir resim değil."];
        }

        return ["status" => true];
    }
}
?>