<?php
include_once 'config.php';

try {
    $query = "ALTER TABLE notifications ADD COLUMN message TEXT AFTER title";
    $conn->exec($query);
    echo "Successfully added 'message' column to notifications table.\n";
} catch (PDOException $e) {
    echo "Error adding column: " . $e->getMessage() . "\n";
}
?>
