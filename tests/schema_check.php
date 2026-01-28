<?php
include_once __DIR__ . '/../config.php';

header('Content-Type: text/plain');

try {
    echo "--- Table: posts ---\n";
    $stmt = $conn->query("DESCRIBE posts");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "{$row['Field']} - {$row['Type']} - {$row['Null']} - {$row['Key']}\n";
    }

    echo "\n--- Table: interactions ---\n";
    $stmt = $conn->query("DESCRIBE interactions");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "{$row['Field']} - {$row['Type']} - {$row['Null']} - {$row['Key']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
