<?php
header("Content-Type: application/json; charset=UTF-8");
include_once 'config.php';

try {
    $table = isset($_GET['table']) ? $_GET['table'] : 'users';
    
    $query = "DESCRIBE " . $table;
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(array(
        "database" => $db_name,
        "table" => $table,
        "columns" => $columns
    ));
} catch (Exception $e) {
    echo json_encode(array("error" => $e->getMessage()));
}
?>
