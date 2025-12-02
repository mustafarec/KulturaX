<?php
include_once 'config.php';

try {
    echo "Veritabanı güncelleniyor...\n";
    
    // image_url sütununu ekle (TEXT olarak)
    $sql = "ALTER TABLE posts ADD COLUMN image_url TEXT NULL DEFAULT NULL";
    $conn->exec($sql);
    echo "image_url sütunu eklendi.\n";
    
} catch(PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Sütun zaten mevcut, tipi güncelleniyor...\n";
        try {
            $sql = "ALTER TABLE posts MODIFY COLUMN image_url TEXT NULL DEFAULT NULL";
            $conn->exec($sql);
            echo "image_url sütunu TEXT olarak güncellendi.\n";
        } catch(PDOException $e2) {
            echo "Güncelleme hatası: " . $e2->getMessage() . "\n";
        }
    } else {
        echo "Hata: " . $e->getMessage() . "\n";
    }
}
?>
