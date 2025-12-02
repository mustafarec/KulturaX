<?php
/**
 * Validation Functions
 * Kullanıcı girdilerini doğrulama ve temizleme fonksiyonları
 */

class Validator {
    
    /**
     * String validasyonu
     */
    public static function validateString($input, $minLength = 1, $maxLength = 255) {
        if (!is_string($input)) {
            return false;
        }
        
        $length = mb_strlen(trim($input));
        return $length >= $minLength && $length <= $maxLength;
    }

    /**
     * Email validasyonu
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Integer validasyonu
     */
    public static function validateInteger($input, $min = null, $max = null) {
        if (!is_numeric($input)) {
            return false;
        }
        
        $value = (int)$input;
        
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
    public static function validateEnum($input, $allowedValues) {
        return in_array($input, $allowedValues, true);
    }

    /**
     * Input temizleme
     */
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * URL validasyonu
     */
    public static function validateUrl($url) {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Tarih validasyonu
     */
    public static function validateDate($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    /**
     * JSON validasyonu
     */
    public static function validateJson($string) {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Telefon numarası validasyonu (Türkiye)
     */
    public static function validatePhoneNumber($phone) {
        // Türk telefon numarası formatı: +90 veya 0 ile başlayan 10 haneli
        $pattern = '/^(\+90|0)?[0-9]{10}$/';
        return preg_match($pattern, $phone) === 1;
    }

    /**
     * Şifre gücü kontrolü
     */
    public static function validatePasswordStrength($password) {
        // En az 8 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam
        if (strlen($password) < 8) {
            return false;
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            return false;
        }
        
        return true;
    }

    /**
     * Spam kontrolü (basit)
     */
    public static function detectSpam($text) {
        $spamKeywords = ['viagra', 'casino', 'xxx', 'porn', 'sex', 'click here', 'buy now'];
        
        $lowerText = strtolower($text);
        
        foreach ($spamKeywords as $keyword) {
            if (strpos($lowerText, $keyword) !== false) {
                return true;
            }
        }
        
        // Aşırı link kontrolü
        $linkCount = preg_match_all('/https?:\/\//', $text);
        if ($linkCount > 3) {
            return true;
        }
        
        return false;
    }

    /**
     * Rate limit kontrolü için yardımcı
     */
    public static function validateRateLimit($userId, $action, $limit, $timeWindow) {
        // Bu fonksiyon rate_limiter.php ile birlikte çalışacak
        return true;
    }
}
?>
