<?php
/**
 * Post Image Upload Endpoint
 * Güvenlik düzeltmeleri: Token doğrulaması, MIME type kontrolü, güvenli dizin izinleri
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';
require_once '../auth_middleware.php';
include_once '../validation.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Token'dan kimlik doğrula
    $userId = requireAuth();
    
    if (isset($_FILES['image'])) {
        $file = $_FILES['image'];

        // Güvenli MIME type ve dosya validasyonu
        $validation = Validator::validateImageFile($file);
        if ($validation['status'] !== true) {
            http_response_code(400);
            echo json_encode(array("message" => $validation['message']));
            exit();
        }

        $target_dir = "../uploads/posts/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0755, true); // 0755 daha güvenli
        }

        $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        // Güvenli dosya adı oluştur
        $new_filename = "post_" . $userId . "_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $file_extension;
        $target_file = $target_dir . $new_filename;

        if (move_uploaded_file($file["tmp_name"], $target_file)) {
            // Construct full URL
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $domain = $_SERVER['HTTP_HOST'];
            
            // Adjust path based on server structure
            $image_url = "$protocol://$domain/api/uploads/posts/$new_filename"; 

            echo json_encode(array("message" => "Image uploaded successfully.", "image_url" => $image_url));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Sorry, there was an error uploading your file."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "No image file provided."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>
