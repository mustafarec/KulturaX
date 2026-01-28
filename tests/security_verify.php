<?php
/**
 * Production Security Verification
 * Tests actual HMAC signature validation by bypassing local dev mode.
 */

// Mock production environment
$_SERVER['HTTP_HOST'] = 'mmreeo.online'; 
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '8.8.8.8';
$_SERVER['REQUEST_URI'] = '/api/tests/security_verify.php';

// Include files
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../MemoryRateLimiter.php';

echo "Starting Production Security Verification...\n";

// 1. Test API Signature Logic
echo "Testing validateApiSignature...\n";

$secret = API_SIGNATURE_SECRET;
if (empty($secret)) {
    die("FAIL: API_SIGNATURE_SECRET not set in config/env.\n");
}

// Test 1: No header -> Should fail
$_SERVER['HTTP_X_APP_SIGNATURE'] = '';
if (validateApiSignature() === false) {
    echo "PASS: Empty signature rejected.\n";
} else {
    echo "FAIL: Empty signature accepted (Bypass active?).\n";
}

// Test 2: Invalid format
$_SERVER['HTTP_X_APP_SIGNATURE'] = 'invalid';
if (validateApiSignature() === false) {
    echo "PASS: Invalid format rejected.\n";
} else {
    echo "FAIL: Invalid format accepted.\n";
}

// Test 3: Valid signature (using new logic)
$timestamp = time();
$method = strtoupper($_SERVER['REQUEST_METHOD']);
$uri = $_SERVER['REQUEST_URI'];
$search_path = '/api';
if (strpos($uri, $search_path) === 0) {
    $uri = substr($uri, strlen($search_path));
}
$body = ''; // GET request has empty body

$message = $method . ':' . $uri . ':' . $body . ':' . $timestamp . ':' . $secret;
$sig = hash_hmac('sha256', $message, $secret);
$_SERVER['HTTP_X_APP_SIGNATURE'] = "$timestamp:$sig";

if (validateApiSignature() === true) {
    echo "PASS: Valid signature accepted.\n";
} else {
    echo "FAIL: Valid signature rejected.\n";
    echo "      Expected Sig for message [$message]: $sig\n";
}

// Test 4: Expired timestamp
$oldTime = time() - 600;
$oldMessage = $method . ':' . $uri . ':' . $body . ':' . $oldTime . ':' . $secret;
$oldSig = hash_hmac('sha256', $oldMessage, $secret);
$_SERVER['HTTP_X_APP_SIGNATURE'] = "$oldTime:$oldSig";

if (validateApiSignature() === false) {
    echo "PASS: Expired timestamp rejected.\n";
} else {
    echo "FAIL: Expired timestamp accepted.\n";
}

echo "\nSecurity Verification Completed.\n";
?>