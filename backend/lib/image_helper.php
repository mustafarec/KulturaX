<?php
/**
 * Shared Image Helper Utility
 * Downloads external images and caches them locally to avoid ATS issues and improve performance.
 */

function downloadAndSaveImage($url, $type, $contentId)
{
    if (empty($url)) {
        return null;
    }

    // 0. Normalize URL
    if (strpos($url, 'http://books.google.com/') === 0) {
        $url = str_replace('http://', 'https://', $url);
    }

    // 1. Skip if already on our server
    if (strpos($url, 'mmreeo.online') !== false) {
        return $url;
    }

    // 2. Setup paths
    $baseDir = dirname(__DIR__); // backend root
    $uploadDir = $baseDir . '/uploads/covers/';

    if (!file_exists($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    $safeContentId = preg_replace('/[^A-Za-z0-9_\-]/', '', $contentId);
    $fileName = $type . '_' . $safeContentId . '.jpg';
    $filePath = $uploadDir . $fileName;

    $publicUrl = 'https://mmreeo.online/api/uploads/covers/' . $fileName;

    // 3. Cache check
    if (file_exists($filePath) && filesize($filePath) > 0) {
        return $publicUrl;
    }

    // 4. Download via CURL (More robust than file_get_contents)
    try {
        error_log("Attempting to download image via CURL: " . $url);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($imageData === FALSE || $httpCode !== 200) {
            error_log("Failed to download image via CURL. URL: $url. HTTP Code: $httpCode. Error: $error");
            // If download fails, return original URL (normalized to https)
            return strpos($url, 'http://') === 0 ? str_replace('http://', 'https://', $url) : $url;
        }

        if (empty($imageData)) {
            error_log("Downloaded image data is empty. URL: $url");
            return $url;
        }

        if (file_put_contents($filePath, $imageData) === false) {
            error_log("Failed to save image to: $filePath");
            return $url;
        } else {
            error_log("Successfully saved image to: $filePath (" . strlen($imageData) . " bytes)");
        }

        return $publicUrl;

    } catch (Exception $e) {
        error_log("Exception during image download (CURL): " . $e->getMessage());
        return $url;
    }
}
