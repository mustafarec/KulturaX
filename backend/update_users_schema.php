<?php
include_once 'config.php';

echo "Updating users table schema...\n";

$columnsToAdd = [
    "name" => "VARCHAR(50) AFTER id",
    "surname" => "VARCHAR(50) AFTER name",
    "age" => "INT AFTER surname",
    "gender" => "VARCHAR(20) AFTER age"
];

foreach ($columnsToAdd as $column => $definition) {
    try {
        $query = "ALTER TABLE users ADD COLUMN $column $definition";
        $conn->exec($query);
        echo "Successfully added '$column' column.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "'$column' column already exists.\n";
        } else {
            echo "Error adding '$column' column: " . $e->getMessage() . "\n";
        }
    }
}

echo "Schema update finished.\n";
?>
