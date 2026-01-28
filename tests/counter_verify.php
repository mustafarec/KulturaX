<?php
/**
 * Counter Verification Test (Server Path Corrected)
 * Tests if like and comment actions correctly update denormalized counts.
 */

include_once __DIR__ . '/../config.php';

echo "--- KulturaX Counter Verification ---\n";

function getCounts($conn, $post_id) {
    if (!$conn) return ['like_count' => 'ERR', 'comment_count' => 'ERR'];
    $stmt = $conn->prepare("SELECT like_count, comment_count FROM posts WHERE id = ?");
    $stmt->execute([$post_id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// 1. Pick a test post automatically (newest one)
$postQuery = $conn->query("SELECT id FROM posts ORDER BY id DESC LIMIT 1");
$postRow = $postQuery->fetch();
$test_post_id = $postRow ? $postRow['id'] : 0;

if ($test_post_id == 0) {
    die("Error: No posts found in database to test.\n");
}
echo "Testing with Post ID: $test_post_id\n";

$initial = getCounts($conn, $test_post_id);
echo "Initial: Likes=" . ($initial['like_count'] ?? 0) . ", Comments=" . ($initial['comment_count'] ?? 0) . "\n";

echo "\n--- Verification Logic Check ---\n";
echo "Checking code in files...\n";

// Path logic: if script is in api/tests/, then interaction files are in api/interactions/
$files_to_check = [
    __DIR__ . '/../interactions/like.php' => "UPDATE posts SET like_count = like_count + 1",
    __DIR__ . '/../interactions/comment.php' => "UPDATE posts SET comment_count = comment_count + 1",
    __DIR__ . '/../interactions/delete_comment.php' => "UPDATE posts SET comment_count = GREATEST(0, comment_count - 1)"
];

foreach ($files_to_check as $file => $pattern) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (strpos($content, $pattern) !== false) {
            echo "[PASS] " . basename($file) . " contains correct atomic update logic.\n";
        } else {
            echo "[FAIL] " . basename($file) . " MISSING atomic update logic or pattern mismatch.\n";
        }
    } else {
        echo "[ERROR] File not found: " . basename($file) . " (Checked: " . realpath($file) . ")\n";
    }
}

echo "\nManual Steps:\n";
echo "1. Like post $test_post_id via app.\n";
echo "2. Run this script again to see if 'Likes' increased.\n";
?>
