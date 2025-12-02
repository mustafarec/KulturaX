<?php
include '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();
$status = isset($_GET['status']) ? $_GET['status'] : null;

$query = "SELECT * FROM user_library WHERE user_id = :user_id";

if ($status) {
    $query .= " AND status = :status";
}

$query .= " ORDER BY updated_at DESC";

$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);

if ($status) {
    $stmt->bindParam(':status', $status);
}

$stmt->execute();

$items = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Burada content_id'ye göre detayları çekmek gerekebilir (TMDB veya Google Books'tan)
    // Ancak performans için frontend tarafında listeleme yaparken detayları çekmek daha mantıklı olabilir
    // Veya veritabanında cache tutulabilir. Şimdilik sadece ID'leri dönüyoruz.
    array_push($items, $row);
}

http_response_code(200);
echo json_encode($items);
?>
