<?php
include '../config.php';
include '../auth_middleware.php';

// Token'dan kimlik doğrula
$user_id = requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->content_type) || !isset($data->content_id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(array("message" => "Eksik veri."));
    exit;
}
$content_type = $data->content_type;
$content_id = $data->content_id;
$status = $data->status;
$progress = isset($data->progress) ? $data->progress : 0;
$content_title = isset($data->content_title) ? $data->content_title : null;
$isbn = isset($data->isbn) ? $data->isbn : null;

$image_url_input = isset($data->image_url) ? $data->image_url : null;
$author = isset($data->author) ? $data->author : null;
$summary = isset($data->summary) ? $data->summary : null;
$lyrics = isset($data->lyrics) ? $data->lyrics : null;

// --- HELPER FUNCTION: ZERO DEPENDENCY ---
function downloadAndSaveImage($url, $type, $contentId) {
    // 0. Eğer URL zaten bizim sunucudaysa işlem yapma
    if (strpos($url, 'mmreeo.online') !== false) {
        return $url;
    }

    // 1. Hedef Dizin ve Dosya Adı
    $uploadDir = '../uploads/covers/';
    $fileName = $type . '_' . $contentId . '.jpg';
    $filePath = $uploadDir . $fileName;
    
    // Public URL
    $publicUrl = 'https://mmreeo.online/api/uploads/covers/' . $fileName;

    // 2. Kontrol: Dosya zaten var mı?
    if (file_exists($filePath)) {
        return $publicUrl;
    }

    // 3. İndirme İşlemi (Fail-Safe)
    try {
        $context = stream_context_create([
            'http' => ['timeout' => 5, 'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n"]
        ]);
        
        $imageData = @file_get_contents($url, false, $context);

        if ($imageData === FALSE) {
            return $url;
        }

        // 4. Dosyayı Yaz
        file_put_contents($filePath, $imageData);
        
        return $publicUrl;

    } catch (Exception $e) {
        return $url;
    }
}

// --- ZERO DEPENDENCY IMAGE LOGIC ---
$image_url = null;
if ($image_url_input) {
   $image_url = downloadAndSaveImage($image_url_input, $content_type, $content_id);
}

// Geçerli durumları kontrol et
$valid_statuses = ['read', 'reading', 'want_to_read', 'dropped', 'visited', 'want_to_watch', 'want_to_listen', 'want_to_attend', ''];

if (!in_array($status, $valid_statuses)) {
    http_response_code(400);
    echo json_encode(array("message" => "Geçersiz durum."));
    exit;
}

try {
    // Transaction Başlat
    $conn->beginTransaction();

    // 1. Mevcut kaydı kilitleyerek kontrol et (Select For Update)
    $check_query = "SELECT id, status, content_title, image_url, author, summary, lyrics, isbn, progress FROM user_library WHERE user_id = :user_id AND content_type = :content_type AND content_id = :content_id FOR UPDATE";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':user_id', $user_id);
    $check_stmt->bindParam(':content_type', $content_type);
    $check_stmt->bindParam(':content_id', $content_id);
    $check_stmt->execute();
    
    $existing = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // KAYIT VAR: Güncelleme kontrolü
        $needs_update = false;
        $new_status = $existing['status']; 

        // Metadata Kontrolü (Smart Update)
        if ($content_title !== null && $content_title !== $existing['content_title']) $needs_update = true;
        if ($image_url !== null && $image_url !== $existing['image_url']) $needs_update = true;
        if ($author !== null && $author !== $existing['author']) $needs_update = true;
        if ($summary !== null && $summary !== $existing['summary']) $needs_update = true;
        if ($lyrics !== null && $lyrics !== $existing['lyrics']) $needs_update = true;
        if ($isbn !== null && $isbn !== $existing['isbn']) $needs_update = true;

        // Status Kontrolü ('visited' korumalı)
        if ($status !== 'visited' && $status !== $existing['status']) {
            $new_status = $status;
            $needs_update = true;
        }

        // Progress Kontrolü
        if ($progress != $existing['progress']) {
            $needs_update = true;
        }

        if ($needs_update) {
            $update_query = "UPDATE user_library SET 
                status = :status, 
                progress = :progress, 
                content_title = :content_title, 
                image_url = :image_url, 
                author = :author, 
                summary = :summary, 
                lyrics = :lyrics,
                isbn = :isbn,
                updated_at = NOW() 
                WHERE id = :id";
            
            $stmt = $conn->prepare($update_query);
            
            $final_title = $content_title !== null ? $content_title : $existing['content_title'];
            $final_image = $image_url !== null ? $image_url : $existing['image_url'];
            $final_author = $author !== null ? $author : $existing['author'];
            $final_summary = $summary !== null ? $summary : $existing['summary'];
            $final_lyrics = $lyrics !== null ? $lyrics : $existing['lyrics'];
            $final_isbn = $isbn !== null ? $isbn : $existing['isbn'];
            
            $stmt->bindParam(':status', $new_status);
            $stmt->bindParam(':progress', $progress);
            $stmt->bindParam(':content_title', $final_title);
            $stmt->bindParam(':image_url', $final_image);
            $stmt->bindParam(':author', $final_author);
            $stmt->bindParam(':summary', $final_summary);
            $stmt->bindParam(':lyrics', $final_lyrics);
            $stmt->bindParam(':isbn', $final_isbn);
            $stmt->bindParam(':id', $existing['id']);
            
            $stmt->execute();
            
            if ($new_status === 'read' && $existing['status'] !== 'read' && $content_type === 'book') {
                updateReadingGoal($conn, $user_id);
            }
            
            echo json_encode(array("message" => "Kütüphane güncellendi."));
        } else {
            echo json_encode(array("message" => "Değişiklik yok, güncel."));
        }

    } else {
        // KAYIT YOK: Ekle
        $insert_query = "INSERT INTO user_library (user_id, content_type, content_id, status, progress, content_title, image_url, author, summary, lyrics, isbn) VALUES (:user_id, :content_type, :content_id, :status, :progress, :content_title, :image_url, :author, :summary, :lyrics, :isbn)";
        $stmt = $conn->prepare($insert_query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':content_type', $content_type);
        $stmt->bindParam(':content_id', $content_id);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':progress', $progress);
        $stmt->bindParam(':content_title', $content_title);
        $stmt->bindParam(':image_url', $image_url);
        $stmt->bindParam(':author', $author);
        $stmt->bindParam(':summary', $summary);
        $stmt->bindParam(':lyrics', $lyrics);
        $stmt->bindParam(':isbn', $isbn);
        
        $stmt->execute();

        if ($status === 'read' && $content_type === 'book') {
            updateReadingGoal($conn, $user_id);
        }
        
        http_response_code(201);
        echo json_encode(array("message" => "Kütüphaneye eklendi."));
    }

    $conn->commit();

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    if ($e instanceof PDOException && ($e->errorInfo[1] == 1213 || $e->getCode() == '40001')) {
        http_response_code(503);
        echo json_encode(array("message" => "Sunucu yoğun, işlem geri alındı."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
    }
}

function updateReadingGoal($conn, $user_id) {
    $year = date('Y');
    $goal_query = "UPDATE reading_goals SET current_count = current_count + 1 WHERE user_id = :user_id AND year = :year";
    $goal_stmt = $conn->prepare($goal_query);
    $goal_stmt->bindParam(':user_id', $user_id);
    $goal_stmt->bindParam(':year', $year);
    $goal_stmt->execute();
}
?>
