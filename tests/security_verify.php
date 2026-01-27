<?php
// Mock environment
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

// Define constants expected by config if not already defined
if (!defined('API_SIGNATURE_SECRET')) {
    // config.php uses environment or defines it.
    // We will let config.php define it.
}

// Create a dummy .env if not exists to avoid warnings in config.php
if (!file_exists(__DIR__ . '/../backend/.env')) {
    file_put_contents(__DIR__ . '/../backend/.env', "API_SIGNATURE_SECRET=testsecret\nDB_HOST=localhost\nDB_NAME=test\nDB_USER=root");
}

// Include files
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/MemoryRateLimiter.php';

echo "Starting Security Verification...\n";

// 1. Test API Signature Logic
echo "Testing validateApiSignature...\n";

// Test 1: No header -> Should fail (return false)
$_SERVER['HTTP_X_APP_SIGNATURE'] = '';
if (validateApiSignature() === false) {
    echo "PASS: Empty signature rejected.\n";
} else {
    echo "FAIL: Empty signature accepted.\n";
}

// Test 2: Invalid format
$_SERVER['HTTP_X_APP_SIGNATURE'] = 'invalid';
if (validateApiSignature() === false) {
    echo "PASS: Invalid format rejected.\n";
} else {
    echo "FAIL: Invalid format accepted.\n";
}

// Test 3: Valid signature
$timestamp = time();
$secret = API_SIGNATURE_SECRET;
$sig = hash_hmac('sha256', $timestamp . ':' . $secret, $secret);
$_SERVER['HTTP_X_APP_SIGNATURE'] = "$timestamp:$sig";

if (validateApiSignature() === true) {
    echo "PASS: Valid signature accepted.\n";
} else {
    echo "FAIL: Valid signature rejected.\n";
}

// Test 4: Expired timestamp
$oldTime = time() - 600; // 10 mins ago
$oldSig = hash_hmac('sha256', $oldTime . ':' . $secret, $secret);
$_SERVER['HTTP_X_APP_SIGNATURE'] = "$oldTime:$oldSig";
if (validateApiSignature() === false) {
    echo "PASS: Expired timestamp rejected.\n";
} else {
    echo "FAIL: Expired timestamp accepted.\n";
}


// 2. Test MemoryRateLimiter Locking
echo "\nTesting MemoryRateLimiter (File Locking)...\n";

$key = 'test_user_' . rand(1000, 9999);
$action = 'login_attempt';
$limit = 5;
$window = 60;

// Clean up previous test
$cacheFile = __DIR__ . '/../backend/cache/rate_limits/' . md5($key . ':' . $action) . '.json';
if (file_exists($cacheFile))
    unlink($cacheFile);

// Check 1: First attempt
if (MemoryRateLimiter::check($key, $action, $limit, $window)) {
    echo "PASS: First attempt allowed.\n";
} else {
    echo "FAIL: First attempt denied.\n";
}

// Check 2: Consume all attempts
for ($i = 0; $i < $limit - 1; $i++) {
    MemoryRateLimiter::check($key, $action, $limit, $window);
}

// Check 3: Next one should fail
if (!MemoryRateLimiter::check($key, $action, $limit, $window)) {
    echo "PASS: Limit exceeded correctly denied.\n";
} else {
    echo "FAIL: Limit exceeded allowed (Counter logic broken).\n";
}

// Verify file content matches
$remaining = MemoryRateLimiter::getRemainingAttempts($key, $action, $limit, $window);
if ($remaining === 0) {
    echo "PASS: Remaining attempts is 0.\n";
} else {
    echo "FAIL: Remaining attempts is $remaining (expected 0).\n";
}

echo "\nVerification Completed.\n";
?>