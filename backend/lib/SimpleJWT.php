<?php

/**
 * SimpleJWT - Güvenli JWT işleme sınıfı
 * 
 * GÜVENLİK ÖNLEMLERİ:
 * - Algorithm Confusion Attack koruması (header'daki alg zorunlu olarak kontrol edilir)
 * - Sadece HS256 algoritması desteklenir ("none" veya RSA algoritmaları kabul edilmez)
 * - Timing-safe signature karşılaştırması (hash_equals kullanılır)
 * - Expiry (exp) claim kontrolü
 */
class SimpleJWT {
    
    // İzin verilen algoritmalar - GÜVENLİK: Sadece güvenli HMAC algoritmaları
    private static $allowedAlgorithms = ['HS256'];
    
    // Algoritma -> hash fonksiyonu eşlemesi
    private static $algMethods = [
        'HS256' => 'sha256'
    ];
    
    public static function encode($payload, $key, $alg = 'HS256') {
        // Algoritma kontrolü
        if (!in_array($alg, self::$allowedAlgorithms)) {
            throw new Exception("Unsupported algorithm");
        }
        
        $header = ['typ' => 'JWT', 'alg' => $alg];
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $hashMethod = self::$algMethods[$alg];
        $signature = hash_hmac($hashMethod, "$headerEncoded.$payloadEncoded", $key, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }

    public static function decode($token, $key, $allowedAlgorithms = ['HS256']) {
        // Token yapısı kontrolü
        $parts = explode('.', $token);
        if (count($parts) != 3) {
            throw new Exception("Invalid token structure");
        }
        
        $headerEncoded = $parts[0];
        $payloadEncoded = $parts[1];
        $signatureEncoded = $parts[2];
        
        // ===== GÜVENLİK: Header doğrulaması =====
        $header = json_decode(self::base64UrlDecode($headerEncoded));
        if (!$header) {
            throw new Exception("Invalid token header");
        }
        
        // Algoritma varlık kontrolü
        if (!isset($header->alg)) {
            throw new Exception("Missing algorithm in token header");
        }
        
        // GÜVENLİK KRİTİK: "none" algoritması kesinlikle reddedilir
        if (strtolower($header->alg) === 'none') {
            throw new Exception("Algorithm 'none' is not allowed");
        }
        
        // GÜVENLİK KRİTİK: Sadece izin verilen algoritmalar kabul edilir
        // Bu, Algorithm Confusion Attack'ı önler
        if (!in_array($header->alg, $allowedAlgorithms)) {
            throw new Exception("Algorithm not allowed: " . $header->alg);
        }
        
        // Desteklenen algoritma kontrolü
        if (!isset(self::$algMethods[$header->alg])) {
            throw new Exception("Unsupported algorithm: " . $header->alg);
        }
        
        // ===== Signature doğrulaması =====
        $signature = self::base64UrlDecode($signatureEncoded);
        $hashMethod = self::$algMethods[$header->alg];
        $expectedSignature = hash_hmac($hashMethod, "$headerEncoded.$payloadEncoded", $key, true);

        // GÜVENLİK: Timing-safe karşılaştırma
        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception("Signature verification failed");
        }

        // ===== Payload decode ve doğrulama =====
        $payload = json_decode(self::base64UrlDecode($payloadEncoded));
        if (!$payload) {
            throw new Exception("Invalid token payload");
        }
        
        // GÜVENLİK: Expiry (exp) kontrolü
        if (isset($payload->exp)) {
            if ($payload->exp < time()) {
                throw new Exception("Token has expired");
            }
        }
        
        // Not-before (nbf) kontrolü
        if (isset($payload->nbf)) {
            if ($payload->nbf > time()) {
                throw new Exception("Token is not yet valid");
            }
        }
        
        return $payload;
    }
    
    /**
     * Token'ın geçerli olup olmadığını kontrol eder (exception fırlatmadan)
     */
    public static function validate($token, $key, $allowedAlgorithms = ['HS256']) {
        try {
            self::decode($token, $key, $allowedAlgorithms);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $urlUnsafeData = str_replace(['-', '_'], ['+', '/'], $data);
        $paddedData = str_pad($urlUnsafeData, strlen($data) % 4, '=', STR_PAD_RIGHT);
        return base64_decode($paddedData);
    }
}
