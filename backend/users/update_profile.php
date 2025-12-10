<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once '../validation.php';

$user_id = validateToken($conn);

if (!$user_id) {
    http_response_code(401);
    echo json_encode(array("message" => "Yetkisiz erişim."));
    exit;
}

$response = array();
$updates = array();
$params = array();

// Handle Text Fields
if (isset($_POST['full_name'])) {
    $updates[] = "full_name = :full_name";
    $params[':full_name'] = $_POST['full_name'];
}
if (isset($_POST['bio'])) {
    $updates[] = "bio = :bio";
    $params[':bio'] = $_POST['bio'];
}
if (isset($_POST['location'])) {
    $updates[] = "location = :location";
    $params[':location'] = $_POST['location'];
}
if (isset($_POST['website'])) {
    $updates[] = "website = :website";
    $params[':website'] = $_POST['website'];
}

// Handle File Uploads
$uploadDir = "../uploads/avatars/"; // Reusing avatars dir or create headers dir
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
    // Güvenlik Validasyonu
    $validation = Validator::validateImageFile($_FILES['avatar']);
    if ($validation['status'] !== true) {
        http_response_code(400);
        echo json_encode(array("message" => "Avatar hatası: " . $validation['message']));
        exit;
    }

    $fileName = "avatar_" . $user_id . "_" . time() . "_" . basename($_FILES['avatar']['name']);
    $targetPath = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['avatar']['tmp_name'], $targetPath)) {
        // Correct URL based on server structure
        $avatarUrl = "https://mmreeo.online/api/uploads/avatars/" . $fileName;
        $updates[] = "avatar_url = :avatar_url";
        $params[':avatar_url'] = $avatarUrl;
        $response['avatar_url'] = $avatarUrl;
    }
}

if (isset($_FILES['header_image']) && $_FILES['header_image']['error'] !== UPLOAD_ERR_NO_FILE) {
    // Güvenlik Validasyonu
    $validation = Validator::validateImageFile($_FILES['header_image']);
    if ($validation['status'] !== true) {
        http_response_code(400);
        echo json_encode(array("message" => "Header resim hatası: " . $validation['message']));
        exit;
    }

    $fileName = "header_" . $user_id . "_" . time() . "_" . basename($_FILES['header_image']['name']);
    $targetPath = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['header_image']['tmp_name'], $targetPath)) {
        // Correct URL based on server structure
        $headerUrl = "https://mmreeo.online/api/uploads/avatars/" . $fileName;
        $updates[] = "header_image_url = :header_image_url";
        $params[':header_image_url'] = $headerUrl;
        $response['header_image_url'] = $headerUrl;
    }
}

if (empty($updates)) {
    echo json_encode(array("message" => "Güncellenecek veri yok."));
    exit;
}

try {
    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :id";
    $stmt = $conn->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':id', $user_id);
    
    if ($stmt->execute()) {
        // Fetch updated user
        $stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->bindParam(':id', $user_id);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        unset($user['password']);
        unset($user['token']);
        
        $response['message'] = "Profil güncellendi.";
        $response['user'] = $user;
        echo json_encode($response);
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Veritabanı hatası."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Hata: " . $e->getMessage()));
}
?>
