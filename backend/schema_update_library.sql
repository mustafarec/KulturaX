-- Kullanıcı kütüphanesi için eksik sütunları ekleme
-- Bu komutları veritabanı yönetim panelinizden (phpMyAdmin, Workbench vb.) çalıştırabilirsiniz.

ALTER TABLE user_library ADD COLUMN content_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE user_library ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE user_library ADD COLUMN author VARCHAR(255) DEFAULT NULL;
