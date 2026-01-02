<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

try {
    // Önce basit bir sorgu ile kullanıcının varlığını kontrol et
    $checkQuery = "SELECT id, username, email, created_at FROM users WHERE id = :user_id";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $user_id);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        // Diğer alanları (full_name, bio, avatar_url) ayrı ayrı çekmeyi dene veya varsayılan değer ata
        // Bu, eğer sütunlar yoksa hatayı önler
        try {
            $detailQuery = "SELECT full_name, bio, avatar_url, header_image_url, location, website, is_email_verified, is_private, is_frozen FROM users WHERE id = :user_id";
            $detailStmt = $conn->prepare($detailQuery);
            $detailStmt->bindParam(':user_id', $user_id);
            $detailStmt->execute();
            $details = $detailStmt->fetch(PDO::FETCH_ASSOC);
            
        if ($details) {
                $user = array_merge($user, $details);
                
                // Check if account is frozen (hide from others)
                $viewer_id = isset($_GET['viewer_id']) ? $_GET['viewer_id'] : null;
                if (isset($details['is_frozen']) && $details['is_frozen'] && $viewer_id != $user_id) {
                    http_response_code(404);
                    echo json_encode(array("message" => "Kullanıcı bulunamadı."));
                    exit;
                }
            }
        } catch (Exception $e) {
            // Sütunlar yoksa veya hata olursa varsayılan değerler
            $user['full_name'] = null;
            $user['bio'] = null;
            $user['avatar_url'] = null;
            error_log("Optional fields fetch error: " . $e->getMessage());
        }

        // Check if viewer follows this user
        $viewer_id = isset($_GET['viewer_id']) ? $_GET['viewer_id'] : null;
        $user['is_following'] = false;
        $user['request_status'] = null;

        if ($viewer_id) {
            try {
                $followQuery = "SELECT id FROM follows WHERE follower_id = :viewer_id AND followed_id = :user_id";
                $followStmt = $conn->prepare($followQuery);
                $followStmt->bindParam(':viewer_id', $viewer_id);
                $followStmt->bindParam(':user_id', $user_id);
                $followStmt->execute();
                if ($followStmt->rowCount() > 0) {
                    $user['is_following'] = true;
                }
                
                // Check for pending follow request (only if not already following)
                if (!$user['is_following']) {
                    $requestQuery = "SELECT status FROM follow_requests WHERE requester_id = :viewer_id AND target_id = :user_id";
                    $requestStmt = $conn->prepare($requestQuery);
                    $requestStmt->bindParam(':viewer_id', $viewer_id);
                    $requestStmt->bindParam(':user_id', $user_id);
                    $requestStmt->execute();
                    $requestResult = $requestStmt->fetch(PDO::FETCH_ASSOC);
                    if ($requestResult) {
                        $user['request_status'] = $requestResult['status'];
                    }
                }
            } catch (Exception $e) {
                error_log("Follow check error: " . $e->getMessage());
            }
        }

        // Get follower count
        try {
            $followerCountQuery = "SELECT COUNT(*) as count FROM follows WHERE followed_id = :user_id";
            $followerCountStmt = $conn->prepare($followerCountQuery);
            $followerCountStmt->bindParam(':user_id', $user_id);
            $followerCountStmt->execute();
            $followerCountResult = $followerCountStmt->fetch(PDO::FETCH_ASSOC);
            $user['follower_count'] = $followerCountResult['count'];
        } catch (Exception $e) {
            $user['follower_count'] = 0;
        }

        // Get following count
        try {
            $followingCountQuery = "SELECT COUNT(*) as count FROM follows WHERE follower_id = :user_id";
            $followingCountStmt = $conn->prepare($followingCountQuery);
            $followingCountStmt->bindParam(':user_id', $user_id);
            $followingCountStmt->execute();
            $followingCountResult = $followingCountStmt->fetch(PDO::FETCH_ASSOC);
            $user['following_count'] = $followingCountResult['count'];
        } catch (Exception $e) {
            $user['following_count'] = 0;
        }

        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Kullanıcı bulunamadı."));
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("User fetch error: " . $e->getMessage());
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
