<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->post_id) || !isset($data->feedback_type)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

$user_id = $conn->real_escape_string($data->user_id);
$post_id = $conn->real_escape_string($data->post_id);
$feedback_type = $conn->real_escape_string($data->feedback_type);

// Validate feedback type
if (!in_array($feedback_type, ['interested', 'not_interested'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid feedback type"]);
    exit();
}

// Check if feedback already exists for this user and post
$check_sql = "SELECT id FROM feed_feedback WHERE user_id = '$user_id' AND post_id = '$post_id'";
$result = $conn->query($check_sql);

if ($result->num_rows > 0) {
    // Update existing feedback
    $sql = "UPDATE feed_feedback SET feedback_type = '$feedback_type', created_at = CURRENT_TIMESTAMP WHERE user_id = '$user_id' AND post_id = '$post_id'";
} else {
    // Insert new feedback
    $sql = "INSERT INTO feed_feedback (user_id, post_id, feedback_type) VALUES ('$user_id', '$post_id', '$feedback_type')";
}

if ($conn->query($sql) === TRUE) {
    echo json_encode(["message" => "Feedback recorded successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error: " . $sql . "<br>" . $conn->error]);
}

$conn->close();
?>
