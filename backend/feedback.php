<?php
/**
 * Feed Feedback Endpoint
 * SQL Injection açığı düzeltildi - PDO prepared statements kullanılıyor
 */

header("Content-Type: application/json; charset=UTF-8");
include_once 'config.php';
include_once 'auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Token'dan kimlik doğrula
$userId = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->post_id) || !isset($data->feedback_type)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

$post_id = $data->post_id;
$feedback_type = $data->feedback_type;

// Validate feedback type
if (!in_array($feedback_type, ['interested', 'not_interested'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid feedback type"]);
    exit();
}

try {
    // Check if feedback already exists for this user and post
    $checkQuery = "SELECT id FROM feed_feedback WHERE user_id = :user_id AND post_id = :post_id";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $userId);
    $checkStmt->bindParam(':post_id', $post_id);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        // Update existing feedback
        $query = "UPDATE feed_feedback SET feedback_type = :feedback_type, created_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND post_id = :post_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':feedback_type', $feedback_type);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':post_id', $post_id);
    } else {
        // Insert new feedback
        $query = "INSERT INTO feed_feedback (user_id, post_id, feedback_type) VALUES (:user_id, :post_id, :feedback_type)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':post_id', $post_id);
        $stmt->bindParam(':feedback_type', $feedback_type);
    }

    if ($stmt->execute()) {
        echo json_encode(["message" => "Feedback recorded successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save feedback"]);
    }
} catch (Exception $e) {
    error_log("Feedback error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
?>
