<?php
/**
 * KültüraX - Get Post Likes
 * Component: Posts
 * Standards: HMAC Signature, PDO Persistent, JSON Error Output
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth_middleware.php';

// Public endpoint but signature validated in config.php
// Expected params: post_id

$postId = $_GET['post_id'] ?? null;

try {
    if (!$postId) {
        throw new Exception("post_id parametresi gerekli.", 400);
    }

    // Database Operation with persistent $conn
    $stmt = $conn->prepare("
        SELECT u.id, u.username, u.display_name, u.avatar 
        FROM post_interactions pi
        JOIN users u ON pi.user_id = u.id
        WHERE pi.post_id = :post_id AND pi.interaction_type = 'like'
        ORDER BY pi.created_at DESC
    ");
    $stmt->execute(['post_id' => $postId]);
    $likes = $stmt->fetchAll();

    echo json_encode([
        "status" => "success",
        "data" => $likes,
        "count" => count($likes)
    ]);

} catch (PDOException $e) {
    error_log("DB Error in get_likes.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "Veritabanı hatası oluştu.",
        "code" => "DATABASE_ERROR"
    ]);
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 400);
    echo json_encode([
        "error" => $e->getMessage(),
        "code" => "INVALID_REQUEST"
    ]);
}
?>
