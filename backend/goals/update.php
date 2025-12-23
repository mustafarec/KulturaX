<?php
include '../config.php';
include '../auth_middleware.php';

// Token'dan kimlik doğrula
$user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->target_count)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}

$target_count = $data->target_count;
$year = isset($data->year) ? $data->year : date('Y');

// Mevcut hedefi kontrol et
$check_query = "SELECT id FROM reading_goals WHERE user_id = :user_id AND year = :year";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->bindParam(':year', $year);
$check_stmt->execute();

if ($check_stmt->rowCount() > 0) {
    // Güncelle
    $query = "UPDATE reading_goals SET target_count = :target_count WHERE user_id = :user_id AND year = :year";
} else {
    // Ekle
    // Mevcut okunan kitap sayısını hesapla (başlangıç için)
    $count_query = "SELECT COUNT(*) as count FROM user_library WHERE user_id = :user_id AND content_type = 'book' AND status = 'read' AND YEAR(updated_at) = :year";
    $count_stmt = $conn->prepare($count_query);
    $count_stmt->bindParam(':user_id', $user_id);
    $count_stmt->bindParam(':year', $year);
    $count_stmt->execute();
    $current_count = $count_stmt->fetch(PDO::FETCH_ASSOC)['count'];

    $query = "INSERT INTO reading_goals (user_id, year, target_count, current_count) VALUES (:user_id, :year, :target_count, :current_count)";
}

$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':year', $year);
$stmt->bindParam(':target_count', $target_count);

if (isset($current_count)) {
    $stmt->bindParam(':current_count', $current_count);
}

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(array("message" => "Hedef güncellendi."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Güncelleme başarısız."));
}
?>
