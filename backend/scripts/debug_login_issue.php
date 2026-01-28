<?php
// Debug script for Login Issues
// Run via CLI: php backend/scripts/debug_login_issue.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config.php';

echo "--- Debugging Login Issue ---\n";

try {
    // 1. Check DB Connection
    if (!isset($conn)) {
        throw new Exception("Database connection failed (conn is null).");
    }
    echo "[OK] Database connection successful.\n";

    // 2. Check user_sessions table existence
    echo "Checking 'user_sessions' table...\n";
    $stmt = $conn->query("SHOW TABLES LIKE 'user_sessions'");
    if ($stmt->rowCount() == 0) {
        throw new Exception("Table 'user_sessions' DOES NOT EXIST! Run migrations.");
    }
    echo "[OK] Table 'user_sessions' exists.\n";

    // 3. Check Table Schema (Optional but helpful)
    $stmt = $conn->query("DESCRIBE user_sessions");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns: " . implode(", ", $columns) . "\n";
    
    // 4. Try Dummy Insert
    echo "Attempting dummy session insert...\n";
    $stmt = $conn->query("SELECT id FROM users LIMIT 1");
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception("No users found in 'users' table to test with.");
    }
    
    $userId = $user['id'];
    $tokenHash = hash('sha256', 'debug_token_' . time());
    $deviceInfo = 'Debug Script';
    $ip = '127.0.0.1';
    $expiresAt = date('Y-m-d H:i:s', time() + 3600);

    $sql = "INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at) 
            VALUES (:user_id, :token_hash, :device_info, :ip, :expires_at)";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId,
        ':token_hash' => $tokenHash,
        ':device_info' => $deviceInfo,
        ':ip' => $ip,
        ':expires_at' => $expiresAt
    ]);
    
    echo "[OK] Dummy session inserted successfully.\n";
    
    // 5. Cleanup
    $conn->exec("DELETE FROM user_sessions WHERE token_hash = '$tokenHash'");
    echo "[OK] Dummy session cleaned up.\n";

} catch (Exception $e) {
    echo "\n[ERROR] " . $e->getMessage() . "\n";
    if ($e instanceof PDOException) {
        echo "SQL State: " . $e->errorInfo[0] . "\n";
        echo "Error Code: " . $e->errorInfo[1] . "\n";
        echo "Error Message: " . $e->errorInfo[2] . "\n";
    }
    exit(1);
}

echo "\n--- Diagnosis Complete: No obvious DB errors found. ---\n";
?>
