<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// Validate Token & Get User ID
$auth_user_id = requireAuth();

$other_user_id = isset($_GET['other_user_id']) ? $_GET['other_user_id'] : null;

if (!$other_user_id) {
    http_response_code(400);
    echo json_encode(["message" => "Missing other_user_id", "is_typing" => false]);
    exit;
}

try {
    // Check if other user is typing (within last 3 seconds)
    $query = "SELECT user_id, updated_at FROM typing_indicators 
              WHERE user_id = :other_user_id 
              AND receiver_id = :auth_user_id 
              AND updated_at > DATE_SUB(NOW(), INTERVAL 3 SECOND)";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':other_user_id', $other_user_id);
    $stmt->bindParam(':auth_user_id', $auth_user_id);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        "is_typing" => $result ? true : false
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage(), "is_typing" => false]);
}
?>
