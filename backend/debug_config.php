<?php
header("Content-Type: application/json; charset=UTF-8");

$envFile = __DIR__ . '/.env';
$results = [
    "file_path" => $envFile,
    "exists" => file_exists($envFile),
    "is_readable" => is_readable($envFile),
    "parse_status" => "pending"
];

if ($results["exists"] && $results["is_readable"]) {
    $env = parse_ini_file($envFile);
    if ($env === false) {
        $results["parse_status"] = "failed";
        $results["error"] = error_get_last();
    } else {
        $results["parse_status"] = "success";
        $results["loaded_keys"] = array_keys($env);
        // Security: Do NOT print values, only check if keys exist
        $results["DEBUG_DB_USER_CHECK"] = isset($env['DB_USER']) ? "set" : "missing";
        $results["DEBUG_DB_PASS_CHECK"] = isset($env['DB_PASS']) ? "set" : "missing";
    }
} else {
    $results["parse_status"] = "skipped";
}

echo json_encode($results);
?>
