<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $userId = requireAuth();
        $data = json_decode(file_get_contents("php://input"));

        if(!isset($data->comment_id)){
            http_response_code(400);
            echo json_encode(array("message" => "Eksik veri."));
            exit;
        }

        // Check if like exists
        $checkQuery = "SELECT id FROM comment_likes WHERE user_id = :user_id AND comment_id = :comment_id";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId);
        $checkStmt->bindParam(':comment_id', $data->comment_id);
        $checkStmt->execute();

        $liked = false;

        if($checkStmt->rowCount() > 0){
            // Unlike
            $query = "DELETE FROM comment_likes WHERE user_id = :user_id AND comment_id = :comment_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':comment_id', $data->comment_id);
            $stmt->execute();
            $liked = false;
        } else {
            // Like
            $query = "INSERT INTO comment_likes (user_id, comment_id) VALUES (:user_id, :comment_id)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':comment_id', $data->comment_id);
            $stmt->execute();
            $liked = true;

            // Bildirim (Opsiyonel: Yorum sahibine bildirim gönderilebilir)
            // ...
        }

        // Get updated like count
        $countQuery = "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = :comment_id";
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bindParam(':comment_id', $data->comment_id);
        $countStmt->execute();
        $row = $countStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(array("liked" => $liked, "count" => $row['count']));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
}
?>
