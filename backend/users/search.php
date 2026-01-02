<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$query = isset($_GET['query']) ? trim($_GET['query']) : '';

if (empty($query)) {
    echo json_encode([]);
    exit;
}

try {
    // Search by username, full_name (if exists), or name/surname (if exist)
    // We'll try to be flexible with the schema since we saw some optional field handling in get.php
    
    // First, let's check what columns exist or just try a broad query that assumes standard columns
    // Based on get.php, 'username' is certain. 'full_name' might be there. 'name' and 'surname' are in the frontend types but get.php uses full_name.
    // Let's check register.php or similar to be sure about name/surname vs full_name, OR just try to select what we can.
    // Actually, looking at get.php, it tries to fetch 'full_name'.
    // But the frontend UserCard expects 'name' and 'surname'.
    // Let's look at the register.php or auth service in backendApi.ts to see what was sent.
    // backendApi.ts sends: name, surname, username.
    // So the DB likely has name and surname columns, or they are combined into full_name.
    // get.php selects 'full_name' but maybe that's a view or a computed column?
    // Wait, get.php line 20: SELECT full_name ... FROM users.
    // But backendApi.ts register sends name and surname.
    // Let's try to select id, username, name, surname, avatar_url.
    // If name/surname don't exist, we might need to adjust.
    // Let's assume name and surname exist based on backendApi.ts.
    
    $sql = "SELECT id, username, name, surname, avatar_url, is_private FROM users 
            WHERE username LIKE :query 
            OR name LIKE :query 
            OR surname LIKE :query 
            OR CONCAT(name, ' ', surname) LIKE :query
            LIMIT 20";
            
    $stmt = $conn->prepare($sql);
    $searchTerm = "%{$query}%";
    $stmt->bindParam(':query', $searchTerm);
    $stmt->execute();

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If the above fails due to missing columns (e.g. name/surname vs full_name), we might need a fallback.
    // But for now, let's trust the frontend's expectation of name/surname.
    
    echo json_encode($users);

} catch (Exception $e) {
    // If error (e.g. column not found), try falling back to full_name if that's what get.php uses
    try {
        $sql = "SELECT id, username, full_name as name, '' as surname, avatar_url FROM users 
                WHERE username LIKE :query 
                OR full_name LIKE :query 
                LIMIT 20";
        $stmt = $conn->prepare($sql);
        $searchTerm = "%{$query}%";
        $stmt->bindParam(':query', $searchTerm);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
    } catch (Exception $e2) {
        http_response_code(500);
        echo json_encode(array("message" => "Arama hatası: " . $e->getMessage()));
    }
}
?>
