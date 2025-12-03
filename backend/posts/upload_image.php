<?php
include_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (isset($_FILES['image']) && isset($_POST['user_id'])) {
        $user_id = $_POST['user_id'];
        $file = $_FILES['image'];

        $target_dir = "../uploads/posts/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        $new_filename = "post_" . $user_id . "_" . time() . "." . $file_extension;
        $target_file = $target_dir . $new_filename;

        // Check file type
        $allowed_types = array("jpg", "jpeg", "png", "gif");
        if (!in_array($file_extension, $allowed_types)) {
            http_response_code(400);
            echo json_encode(array("message" => "Only JPG, JPEG, PNG & GIF files are allowed."));
            exit();
        }

        // Check file size (max 5MB)
        if ($file["size"] > 5000000) {
            http_response_code(400);
            echo json_encode(array("message" => "File is too large. Max 5MB."));
            exit();
        }

        if (move_uploaded_file($file["tmp_name"], $target_file)) {
            // Construct full URL
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $domain = $_SERVER['HTTP_HOST'];
            
            // Adjust path based on server structure. Assuming /api/uploads/posts
            $image_url = "$protocol://$domain/api/uploads/posts/$new_filename"; 

            echo json_encode(array("message" => "Image uploaded successfully.", "image_url" => $image_url));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Sorry, there was an error uploading your file."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data."));
    }
}
?>
