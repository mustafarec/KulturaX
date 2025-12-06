<?php
include_once '../config.php';

$user_id = 3; // Hedef kullanıcı ID

echo "<h3>Reviews Table (Last 5)</h3>";
$stmt = $conn->prepare("SELECT content_type, content_id, content_title, image_url, created_at FROM reviews WHERE user_id = :uid ORDER BY created_at DESC LIMIT 5");
$stmt->execute([':uid' => $user_id]);
$reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>" . print_r($reviews, true) . "</pre>";

echo "<h3>User Library Table (Matching Content)</h3>";
// Check if these items exist in user_library
foreach ($reviews as $r) {
    echo "Checking: Type={$r['content_type']}, ID={$r['content_id']}<br>";
    $stmt = $conn->prepare("SELECT content_type, content_id, content_title, image_url, status FROM user_library WHERE user_id = :uid AND content_type = :ctype AND content_id = :cid");
    $stmt->execute([
        ':uid' => $user_id,
        ':ctype' => $r['content_type'],
        ':cid' => $r['content_id']
    ]);
    $libParams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if ($libParams) {
        echo "<pre>" . print_r($libParams, true) . "</pre>";
    } else {
        echo "NOT FOUND in user_library<br>";
    }
    echo "<hr>";
}
?>
