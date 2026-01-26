<?php
// Ensure no accidental output
ob_start();
include '../config.php';

// Set headers explicitly
header('Content-Type: application/json; charset=UTF-8');

$user_id = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
$year = isset($_GET['year']) ? (int) $_GET['year'] : (int) date('Y');

if ($user_id <= 0) {
    echo json_encode(["message" => "Geçersiz kullanıcı kimliği."]);
    exit;
}

try {
    // We use BETWEEN for both MySQL and SQLite compatibility
    $startDate = "$year-01-01 00:00:00";
    $endDate = "$year-12-31 23:59:59";

    $query = "SELECT 
                content_type, 
                status,
                COUNT(*) as count
              FROM user_library 
              WHERE user_id = :user_id 
              AND updated_at >= :start_date 
              AND updated_at <= :end_date
              GROUP BY content_type, status";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':start_date', $startDate);
    $stmt->bindParam(':end_date', $endDate);
    $stmt->execute();

    $stats = [
        'book' => ['counts' => ['read' => 0, 'loved' => 0, 'reading' => 0, 'want_to_read' => 0, 'dropped' => 0], 'avg_rating' => 0],
        'movie' => ['counts' => ['read' => 0, 'loved' => 0, 'reading' => 0, 'want_to_read' => 0, 'dropped' => 0], 'avg_rating' => 0],
        'music' => ['counts' => ['read' => 0, 'loved' => 0, 'reading' => 0, 'want_to_read' => 0, 'dropped' => 0], 'avg_rating' => 0],
        'event' => ['counts' => ['read' => 0, 'loved' => 0, 'reading' => 0, 'want_to_read' => 0, 'dropped' => 0], 'avg_rating' => 0]
    ];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $type = $row['content_type'];
        $status = $row['status'];

        // Normalize status
        if (strpos($status, 'want_to_') === 0) {
            $status = 'want_to_read';
        }
        // Map common variations
        if ($status === 'completed' || $status === 'finished')
            $status = 'read';
        if ($status === 'watching' || $status === 'listening' || $status === 'attending')
            $status = 'reading';

        if (isset($stats[$type])) {
            // Only add if the status key is one we expect
            if (isset($stats[$type]['counts'][$status])) {
                $stats[$type]['counts'][$status] += (int) $row['count'];
            }
        }
    }

    // Accurate average rating per content_type from reviews table
    $query_avg = "SELECT 
                    content_type, 
                    AVG(rating) as avg_rating
                  FROM reviews 
                  WHERE user_id = :user_id 
                  AND created_at >= :start_date 
                  AND created_at <= :end_date
                  GROUP BY content_type";

    $stmt_avg = $conn->prepare($query_avg);
    $stmt_avg->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_avg->bindParam(':start_date', $startDate);
    $stmt_avg->bindParam(':end_date', $endDate);
    $stmt_avg->execute();

    while ($row_avg = $stmt_avg->fetch(PDO::FETCH_ASSOC)) {
        $type = $row_avg['content_type'];
        if (isset($stats[$type])) {
            $stats[$type]['avg_rating'] = round((float) $row_avg['avg_rating'], 1);
        }
    }

    // Clear buffer and send JSON
    ob_end_clean();
    echo json_encode($stats);

} catch (Exception $e) {
    ob_end_clean();
    error_log("get_stats.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["message" => "Sunucu hatası oluştu."]);
}
?>