<?php
include '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();
$year = isset($_GET['year']) ? $_GET['year'] : date('Y');

$query = "SELECT * FROM reading_goals WHERE user_id = :user_id AND year = :year";
$stmt = $conn->prepare($query);

$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':year', $year);

$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    http_response_code(200);
    echo json_encode($row);
} else {
    http_response_code(200);
    echo json_encode(null);
}
?>
