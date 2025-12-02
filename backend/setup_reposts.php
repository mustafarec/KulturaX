<?php
include_once 'config.php';

try {
    echo "Veritabanı güncelleniyor...\n";
    
    // original_post_id sütununu ekle
    $sql = "ALTER TABLE posts ADD COLUMN original_post_id INT NULL DEFAULT NULL";
    $conn->exec($sql);
    echo "original_post_id sütunu eklendi.\n";
    
    // Foreign key ekle (Opsiyonel ama veri bütünlüğü için iyi)
    // Eğer post silinirse repostları da silinsin mi? Genelde hayır, ama null yapılabilir.
    // Şimdilik basit tutalım, foreign key constraint eklemiyorum ki hata riski azalsın.
    
} catch(PDOException $e) {
    // Hata kodunu kontrol et, eğer "Duplicate column name" ise (1060) sorun yok.
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Sütun zaten mevcut, işlem atlandı.\n";
    } else {
        echo "Hata: " . $e->getMessage() . "\n";
    }
}
?>
