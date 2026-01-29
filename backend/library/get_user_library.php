<?php
/**
 * Get User Library
 * 
 * Optimized version - No N+1 queries
 * Missing metadata is flagged for async update instead of blocking the response
 */
require_once '../config.php';
require_once '../auth_middleware.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();
$viewer_id = isset($_GET['viewer_id']) ? $_GET['viewer_id'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;

// Check if target user is private and if viewer can access
try {
    $privacyQuery = "SELECT is_private FROM users WHERE id = :user_id";
    $privacyStmt = $conn->prepare($privacyQuery);
    $privacyStmt->bindParam(':user_id', $user_id);
    $privacyStmt->execute();
    $userData = $privacyStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($userData && $userData['is_private'] && $viewer_id && $viewer_id != $user_id) {
        // Check if viewer follows this user
        $followCheck = "SELECT id FROM follows WHERE follower_id = :viewer_id AND followed_id = :user_id";
        $followStmt = $conn->prepare($followCheck);
        $followStmt->bindParam(':viewer_id', $viewer_id);
        $followStmt->bindParam(':user_id', $user_id);
        $followStmt->execute();
        
        if ($followStmt->rowCount() === 0) {
            // Not following private account - return empty
            http_response_code(200);
            echo json_encode([]);
            exit;
        }
    }
} catch (Exception $e) {
    error_log("Privacy check error in get_user_library: " . $e->getMessage());
}

$query = "SELECT id, user_id, content_type, content_id, status, score, notes, progress, content_title, image_url, author, created_at, updated_at 
          FROM user_library 
          WHERE user_id = :user_id";

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
$items_needing_update = array(); // Track items that need metadata update

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Check if metadata is missing - but DON'T make API calls here (N+1 prevention)
    if (empty($row['content_title']) || empty($row['image_url'])) {
        // Flag this item as needing update - client or background job will handle it
        $row['needs_metadata_update'] = true;
        $items_needing_update[] = [
            'id' => $row['id'],
            'content_type' => $row['content_type'],
            'content_id' => $row['content_id']
        ];
    } else {
        $row['needs_metadata_update'] = false;
    }

    array_push($items, $row);
}

// Optionally: Queue background update for items with missing metadata
// This could be done via a cron job, queue system, or separate endpoint
// For now, we just flag them and let the client handle it

http_response_code(200);

// Return both items and metadata about items needing update
echo json_encode([
    'items' => $items,
    'total' => count($items),
    'needs_update_count' => count($items_needing_update),
    // Optionally include IDs that need update for client-side handling
    'items_needing_update' => count($items_needing_update) > 0 ? $items_needing_update : null
]);
?>

