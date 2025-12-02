<?php
include_once 'config.php';

echo "Starting schema update...\n";

try {
    // Add message column
    try {
        $query = "ALTER TABLE notifications ADD COLUMN message TEXT AFTER title";
        $conn->exec($query);
        echo "Successfully added 'message' column.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "'message' column already exists.\n";
        } else {
            echo "Error adding 'message' column: " . $e->getMessage() . "\n";
        }
    }

    // Add data column
    try {
        $query = "ALTER TABLE notifications ADD COLUMN data TEXT AFTER message";
        $conn->exec($query);
        echo "Successfully added 'data' column.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "'data' column already exists.\n";
        } else {
            echo "Error adding 'data' column: " . $e->getMessage() . "\n";
        }
    }

    echo "Schema update finished.\n";

} catch (Exception $e) {
    echo "Critical error: " . $e->getMessage() . "\n";
}
?>
