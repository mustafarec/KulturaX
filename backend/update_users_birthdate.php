<?php
include_once 'config.php';

echo "Adding birth_date column to users table...\n";

try {
    $query = "ALTER TABLE users ADD COLUMN birth_date DATE AFTER surname";
    $conn->exec($query);
    echo "Successfully added 'birth_date' column.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "'birth_date' column already exists.\n";
    } else {
        echo "Error adding 'birth_date' column: " . $e->getMessage() . "\n";
    }
}
?>
