<?php
include_once 'config.php';

try {
    $stmt = $conn->query("SELECT id, content, source, image_url, content_type FROM posts ORDER BY created_at DESC LIMIT 5");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($posts);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
