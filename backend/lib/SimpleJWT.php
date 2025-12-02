<?php

class SimpleJWT {
    public static function encode($payload, $key, $alg = 'HS256') {
        $header = ['typ' => 'JWT', 'alg' => $alg];
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $key, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }

    public static function decode($token, $key, $alg = ['HS256']) {
        $parts = explode('.', $token);
        if (count($parts) != 3) {
            throw new Exception("Invalid token structure");
        }
        
        $headerEncoded = $parts[0];
        $payloadEncoded = $parts[1];
        $signatureEncoded = $parts[2];

        $signature = self::base64UrlDecode($signatureEncoded);
        $expectedSignature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $key, true);

        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception("Signature verification failed");
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded));
        return $payload;
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
