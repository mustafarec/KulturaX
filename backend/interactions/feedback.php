<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$user_id = requireAuth();

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->post_id) || !isset($data->type)) {
        http_response_code(400);
        echo json_encode(["message" => "Eksik parametreler (post_id, type)."]);
        exit();
    }

    $post_id = $data->post_id;
    $feedback_type = $data->type;
    $reason = isset($data->reason) ? $data->reason : null;

    // Validate enum
    $allowed_types = ['interested', 'not_interested', 'report', 'show_more'];
    if (!in_array($feedback_type, $allowed_types)) {
        http_response_code(400);
        echo json_encode(["message" => "Geçersiz feedback türü."]);
        exit();
    }

    // Check if exists
    $checkQuery = "SELECT id FROM feed_feedback WHERE user_id = :user_id AND post_id = :post_id";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':post_id', $post_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // Update
        $updateQuery = "UPDATE feed_feedback 
                        SET feedback_type = :type, reason = :reason, created_at = CURRENT_TIMESTAMP 
                        WHERE user_id = :user_id AND post_id = :post_id";
        $stmt = $conn->prepare($updateQuery);
        $stmt->bindParam(':type', $feedback_type);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':post_id', $post_id);
        $stmt->execute();
    } else {
        // Insert
        $insertQuery = "INSERT INTO feed_feedback (user_id, post_id, feedback_type, reason) 
                        VALUES (:user_id, :post_id, :type, :reason)";
        $stmt = $conn->prepare($insertQuery);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':post_id', $post_id);
        $stmt->bindParam(':type', $feedback_type);
        $stmt->bindParam(':reason', $reason);
        $stmt->execute();
    }

    // If 'not_interested', we might want to ensure we don't show this post again (handled in feed query probably)
    // For now just recording the feedback is enough.

    echo json_encode(["message" => "Geri bildirim kaydedildi."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Sunucu hatası: " . $e->getMessage()]);
}
?>
