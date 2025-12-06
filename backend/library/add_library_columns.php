<?php
include '../config.php';

try {
    // Sütunların var olup olmadığını kontrol etmeden eklemeye çalışmak hata verebilir.
    // Ancak basitlik adına doğrudan ALTER komutlarını deniyoruz, varsa hata verir ve catch bloğuna düşer (veya zaten var der).
    // Daha güvenli olması için tek tek try-catch içine alabiliriz veya varlık kontrolü yapabiliriz.
    
    $queries = [
        "ALTER TABLE user_library ADD COLUMN content_title VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE user_library ADD COLUMN image_url VARCHAR(500) DEFAULT NULL",
        "ALTER TABLE user_library ADD COLUMN author VARCHAR(255) DEFAULT NULL"
    ];

    foreach ($queries as $query) {
        try {
            $conn->exec($query);
            echo "Executed: $query <br>";
        } catch (PDOException $e) {
            // Sütun zaten varsa hata verebilir, bunu yutup devam edelim.
            echo "Error (might already exist): " . $e->getMessage() . "<br>";
        }
    }
    
    echo "Migration completed.";

} catch(PDOException $e) {
    echo "Fatal Error: " . $e->getMessage();
}
?>
