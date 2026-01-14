<?php
/**
 * Migration: Add profile fields to users table
 * - birth_date (DATE, nullable)
 * - school (VARCHAR 255, nullable)
 * - department (VARCHAR 255, nullable)
 * - interests (JSON, nullable)
 * 
 * Run this migration once on your database
 */

include_once '../config.php';

try {
    // Add birth_date column
    $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE NULL");
    echo "✓ birth_date column added\n";
    
    // Add school column
    $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(255) NULL");
    echo "✓ school column added\n";
    
    // Add department column
    $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255) NULL");
    echo "✓ department column added\n";
    
    // Add interests column (JSON for storing array of interests)
    $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS interests JSON NULL");
    echo "✓ interests column added\n";
    
    echo "\n=== Migration completed successfully! ===\n";
    
} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
    
    // MySQL doesn't support IF NOT EXISTS for columns, try alternative approach
    try {
        // Check if columns exist and add if not
        $stmt = $conn->query("SHOW COLUMNS FROM users LIKE 'birth_date'");
        if ($stmt->rowCount() == 0) {
            $conn->exec("ALTER TABLE users ADD COLUMN birth_date DATE NULL");
            echo "✓ birth_date column added\n";
        } else {
            echo "- birth_date column already exists\n";
        }
        
        $stmt = $conn->query("SHOW COLUMNS FROM users LIKE 'school'");
        if ($stmt->rowCount() == 0) {
            $conn->exec("ALTER TABLE users ADD COLUMN school VARCHAR(255) NULL");
            echo "✓ school column added\n";
        } else {
            echo "- school column already exists\n";
        }
        
        $stmt = $conn->query("SHOW COLUMNS FROM users LIKE 'department'");
        if ($stmt->rowCount() == 0) {
            $conn->exec("ALTER TABLE users ADD COLUMN department VARCHAR(255) NULL");
            echo "✓ department column added\n";
        } else {
            echo "- department column already exists\n";
        }
        
        $stmt = $conn->query("SHOW COLUMNS FROM users LIKE 'interests'");
        if ($stmt->rowCount() == 0) {
            $conn->exec("ALTER TABLE users ADD COLUMN interests JSON NULL");
            echo "✓ interests column added\n";
        } else {
            echo "- interests column already exists\n";
        }
        
        echo "\n=== Migration completed successfully! ===\n";
        
    } catch (PDOException $e2) {
        echo "Migration failed: " . $e2->getMessage() . "\n";
    }
}
?>
