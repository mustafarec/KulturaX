<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    // Get all feedback by user
    // We join with posts to get some context (like content snippet, author) to show in the list
    $query = "SELECT pf.id, pf.type, pf.created_at, pf.post_id,
                     p.content, p.content_type, p.image_url,
                     u.username, u.full_name
              FROM post_feedback pf
              JOIN posts p ON pf.post_id = p.id
              JOIN users u ON p.user_id = u.id
              WHERE pf.user_id = :user_id
              ORDER BY pf.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $preferences = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        // Clean up content for display (truncate)
        $row['content_preview'] = mb_substr($row['content'], 0, 100) . (mb_strlen($row['content']) > 100 ? '...' : '');
        unset($row['content']); // Don't send full content if not needed

        array_push($preferences, $row);
    }

    echo json_encode($preferences);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
