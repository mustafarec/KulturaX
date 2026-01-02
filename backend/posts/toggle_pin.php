<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->post_id)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing post_id."]);
        exit();
    }

    $post_id = $data->post_id;

    // 1. Verify ownership
    $checkSql = "SELECT user_id, is_pinned FROM posts WHERE id = :post_id";
    $stmt = $conn->prepare($checkSql);
    $stmt->execute([':post_id' => $post_id]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        http_response_code(404);
        echo json_encode(["message" => "Post not found."]);
        exit();
    }

    if ($post['user_id'] != $user_id) {
        http_response_code(403);
        echo json_encode(["message" => "Unauthorized."]);
        exit();
    }

    $current_status = (bool)$post['is_pinned'];
    $new_status = !$current_status;

    // 2. Check limit (Max 3 pinned posts)
    if ($new_status) {
        $countSql = "SELECT COUNT(*) as count FROM posts WHERE user_id = :user_id AND is_pinned = 1";
        $countStmt = $conn->prepare($countSql);
        $countStmt->execute([':user_id' => $user_id]);
        $result = $countStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] >= 3) {
            http_response_code(400);
            echo json_encode(["message" => "En fazla 3 gönderi sabitleyebilirsiniz."]);
            exit();
        }
    }

    // 3. Update status
    $updateSql = "UPDATE posts SET is_pinned = :status WHERE id = :post_id";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->execute([':status' => $new_status ? 1 : 0, ':post_id' => $post_id]);

    echo json_encode([
        "message" => $new_status ? "Gönderi sabitlendi." : "Sabitleme kaldırıldı.",
        "is_pinned" => $new_status
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
