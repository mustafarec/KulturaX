<?php
include_once 'config.php';

try {
    echo "Checking database columns...\n";

    // 1. Check if deleted_by_sender exists
    $stmt = $conn->query("SHOW COLUMNS FROM messages LIKE 'deleted_by_sender'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        echo "Adding deleted_by_sender column...\n";
        $conn->exec("ALTER TABLE messages ADD COLUMN deleted_by_sender TINYINT(1) DEFAULT 0");
        echo "Added deleted_by_sender.\n";
    } else {
        echo "deleted_by_sender already exists.\n";
    }

    // 2. Check if deleted_by_receiver exists
    $stmt = $conn->query("SHOW COLUMNS FROM messages LIKE 'deleted_by_receiver'");
    $exists = $stmt->fetch();

    if (!$exists) {
        echo "Adding deleted_by_receiver column...\n";
        $conn->exec("ALTER TABLE messages ADD COLUMN deleted_by_receiver TINYINT(1) DEFAULT 0");
        echo "Added deleted_by_receiver.\n";
    } else {
        echo "deleted_by_receiver already exists.\n";
    }

    echo "Database schema update completed successfully.";

} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>
