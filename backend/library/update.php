<?php
include '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->content_type) || !isset($data->content_id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

$user_id = $data->user_id;
$content_type = $data->content_type;
$content_id = $data->content_id;
$status = $data->status;
$progress = isset($data->progress) ? $data->progress : 0;

// Geçerli durumları kontrol et
$valid_statuses = ['read', 'reading', 'want_to_read', 'dropped'];
if (!in_array($status, $valid_statuses)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz durum."));
    exit;
}

// Mevcut kaydı kontrol et
$check_query = "SELECT id FROM user_library WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->bindParam(':content_type', $content_type);
$check_stmt->bindParam(':content_id', $content_id);
$check_stmt->execute();

if ($check_stmt->rowCount() > 0) {
    // Güncelle
    $query = "UPDATE user_library SET status = :status, progress = :progress WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id";
} else {
    // Ekle
    $query = "INSERT INTO user_library (user_id, content_type, content_id, status, progress) VALUES (:user_id, :content_type, :content_id, :status, :progress)";
}

$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':content_type', $content_type);
$stmt->bindParam(':content_id', $content_id);
$stmt->bindParam(':status', $status);
$stmt->bindParam(':progress', $progress);

if ($stmt->execute()) {
    // Eğer durum 'read' (okundu/izlendi) ise ve content_type 'book' ise, yıllık hedefi güncelle
    if ($status === 'read' && $content_type === 'book') {
        $year = date('Y');
        // Hedefi kontrol et ve güncelle
        $goal_query = "UPDATE reading_goals SET current_count = current_count + 1 WHERE user_id = :user_id AND year = :year";
        $goal_stmt = $conn->prepare($goal_query);
        $goal_stmt->bindParam(':user_id', $user_id);
        $goal_stmt->bindParam(':year', $year);
        $goal_stmt->execute();
    }

    http_response_code(200);
    echo json_encode(array("message" => "Kütüphane güncellendi."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Güncelleme başarısız."));
}
?>
