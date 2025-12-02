<?php
include_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (isset($_FILES['avatar']) && isset($_POST['user_id'])) {
        $user_id = $_POST['user_id'];
        $file = $_FILES['avatar'];

        $target_dir = "../uploads/avatars/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        $new_filename = "avatar_" . $user_id . "_" . time() . "." . $file_extension;
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
            // Update user avatar in database
            // Construct full URL (adjust domain as needed)
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $domain = $_SERVER['HTTP_HOST'];
            // Assuming backend is in a subfolder, adjust path accordingly
            // For example if backend is at /api, and uploads are at /api/uploads
            // We need to know the relative path from the web root
            
            // A simple way is to store the relative path or full URL if we know the base
            // Here we will store the full URL assuming standard setup
            $avatar_url = "$protocol://$domain/api/uploads/avatars/$new_filename"; 
            // Note: User might need to adjust this path based on their actual server structure

            $query = "UPDATE users SET avatar_url = :avatar_url WHERE id = :user_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':avatar_url', $avatar_url);
            $stmt->bindParam(':user_id', $user_id);

            if ($stmt->execute()) {
                echo json_encode(array("message" => "Avatar uploaded successfully.", "avatar_url" => $avatar_url));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Database update failed."));
            }
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
