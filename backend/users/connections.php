<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die(json_encode(array("message" => "user_id missing")));
$type = isset($_GET['type']) ? $_GET['type'] : 'followers'; // 'followers' or 'following'
$viewer_id = isset($_GET['viewer_id']) ? $_GET['viewer_id'] : null;

try {
    if ($type === 'followers') {
        // Users who follow $user_id
        $query = "SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio 
                  FROM users u 
                  JOIN follows f ON u.id = f.follower_id 
                  WHERE f.followed_id = :user_id";
    } else {
        // Users who $user_id follows
        $query = "SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio 
                  FROM users u 
                  JOIN follows f ON u.id = f.followed_id 
                  WHERE f.follower_id = :user_id";
    }

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If viewer_id depends provided, check if viewer follows these users
    if ($viewer_id && count($users) > 0) {
        foreach ($users as &$user) {
            try {
                $followQuery = "SELECT id FROM follows WHERE follower_id = :viewer_id AND followed_id = :target_id";
                $followStmt = $conn->prepare($followQuery);
                $followStmt->bindParam(':viewer_id', $viewer_id);
                $followStmt->bindParam(':target_id', $user['id']);
                $followStmt->execute();
                
                $user['is_following'] = $followStmt->rowCount() > 0;
            } catch (Exception $e) {
                $user['is_following'] = false;
            }
        }
    }

    echo json_encode($users);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Db error: " . $e->getMessage()));
}
?>
