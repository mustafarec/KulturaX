<?php
require_once '../config.php';
require_once '../auth_middleware.php';

// 1. Validate Token & Get User ID
$auth_user_id = requireAuth();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["message" => "Missing user_id"]);
    exit;
}

// 2. Authorization Check
if ($auth_user_id != $user_id) {
    http_response_code(403);
    echo json_encode(["message" => "Unauthorized access to these notifications."]);
    exit;
}

try {
    // 1. Fetch notifications
    $query = "SELECT id, user_id, type, data, is_read, created_at FROM notifications WHERE user_id = :user_id AND type != 'message' ORDER BY created_at DESC LIMIT 50";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($notifications)) {
        echo json_encode([]);
        exit;
    }

    // 2. Collect sender IDs
    $senderIds = [];
    foreach ($notifications as $n) {
        if (!empty($n['data'])) {
            $data = json_decode($n['data'], true);
            if (isset($data['sender_id'])) {
                $senderIds[] = $data['sender_id'];
            }
        }
    }
    
    $senderIds = array_unique($senderIds);
    $usersMap = [];

    // 3. Fetch users if there are any senders
    if (!empty($senderIds)) {
        $placeholders = implode(',', array_fill(0, count($senderIds), '?'));
        $userQuery = "SELECT id, username, avatar_url FROM users WHERE id IN ($placeholders)";
        $userStmt = $conn->prepare($userQuery);
        $userStmt->execute(array_values($senderIds));
        
        while ($user = $userStmt->fetch(PDO::FETCH_ASSOC)) {
            $usersMap[$user['id']] = $user;
        }
    }

    // 4. Merge user data into notifications
    $result = [];
    foreach ($notifications as $n) {
        $n['sender_username'] = null;
        $n['sender_avatar'] = null;
        
        if (!empty($n['data'])) {
            $data = json_decode($n['data'], true);
            if (isset($data['sender_id']) && isset($usersMap[$data['sender_id']])) {
                $user = $usersMap[$data['sender_id']];
                $n['sender_username'] = $user['username'];
                $n['sender_avatar'] = $user['avatar_url'];
            }
        }
        $result[] = $n;
    }

    http_response_code(200);
    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>
