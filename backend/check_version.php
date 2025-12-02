<?php
header("Content-Type: application/json; charset=UTF-8");

$files = [
    'auth_middleware.php' => [
        'path' => 'auth_middleware.php',
        'search' => 'SELECT id FROM users WHERE token'
    ],
    'login.php' => [
        'path' => 'auth/login.php',
        'search' => 'UPDATE users SET token'
    ]
];

$results = [];

foreach ($files as $name => $info) {
    if (file_exists($info['path'])) {
        $content = file_get_contents($info['path']);
        if (strpos($content, $info['search']) !== false) {
            $results[$name] = "GÜNCEL (Updated)";
        } else {
            $results[$name] = "ESKİ (Old Version) - İçinde '" . $info['search'] . "' bulunamadı.";
        }
    } else {
        $results[$name] = "DOSYA BULUNAMADI (File Not Found)";
    }
}

echo json_encode($results);
?>
