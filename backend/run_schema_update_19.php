<?php
include_once 'config.php';

try {
    $sqlContent = file_get_contents('schema_update_19.sql');
    // Split by semicolon and new line to get individual queries
    $queries = array_filter(array_map('trim', explode(';', $sqlContent)));

    foreach ($queries as $query) {
        if (empty($query)) continue;
        
        try {
            $conn->exec($query);
            echo "Executed: " . substr($query, 0, 50) . "...\n";
        } catch (PDOException $e) {
            // Check for duplicate column error (Code 42S21 or specific message)
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "Skipped (Column exists): " . substr($query, 0, 50) . "...\n";
            } else {
                echo "Error executing query: " . $e->getMessage() . "\n";
            }
        }
    }
    echo "Schema update 19 process completed.\n";
} catch (Exception $e) {
    echo "General Error: " . $e->getMessage() . "\n";
}
?>
