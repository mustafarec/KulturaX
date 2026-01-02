<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

$userId = requireAuth();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->request_id) || empty($data->request_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "İstek ID'si gerekli."));
    exit;
}

$requestId = (int)$data->request_id;

try {
    // Verify request exists and belongs to current user
    $checkQuery = "SELECT id, requester_id FROM follow_requests 
                   WHERE id = :request_id AND target_id = :user_id AND status = 'pending'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':request_id', $requestId);
    $checkStmt->bindParam(':user_id', $userId);
    $checkStmt->execute();

    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "İstek bulunamadı veya zaten işlendi."));
        exit;
    }

    $request = $checkStmt->fetch(PDO::FETCH_ASSOC);

    // Update request status to rejected
    $updateQuery = "UPDATE follow_requests SET status = 'rejected', updated_at = NOW() WHERE id = :request_id";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bindParam(':request_id', $requestId);
    $updateStmt->execute();

    http_response_code(200);
    echo json_encode(array(
        "message" => "İstek reddedildi.",
        "requester_id" => $request['requester_id']
    ));

} catch (Exception $e) {
    error_log("Reject follow request error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Bir hata oluştu."));
}
?>
