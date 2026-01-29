<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

try {
    // Array of slug => new_icon (Ionicons compatible)
    $updates = [
        'alinti' => 'chatbubbles-outline', // Safer alternative for quote (dialogue)
        'siir' => 'pencil-outline', // Working confirmed
        'kisisel-gelisim' => 'trending-up-outline',
        'mizah' => 'happy-outline',
        'bilim' => 'hardware-chip-outline',
        'felsefe' => 'bulb-outline',
        'sanat' => 'color-palette-outline',
        'edebiyat' => 'book-outline',
        'sinema' => 'film-outline',
        'muzik' => 'musical-notes-outline'
    ];

    $stmt = $conn->prepare("UPDATE topics SET icon = :icon WHERE slug = :slug");

    $count = 0;
    foreach ($updates as $slug => $icon) {
        $stmt->execute([':icon' => $icon, ':slug' => $slug]);
        $count += $stmt->rowCount();
    }

    echo json_encode(["message" => "Icons updated successfully.", "updated_count" => $count]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
