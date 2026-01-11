-- KültüraX Veritabanı Index Optimizasyonu
-- Bu SQL'i phpMyAdmin'de çalıştırın
-- Tarih: 2026-01-12
-- MySQL Uyumlu Versiyon

-- =====================================================
-- KULLANIM:
-- Her CREATE INDEX komutunu AYRI AYRI çalıştırın.
-- "Duplicate key name" hatası alırsanız, index zaten var demektir.
-- =====================================================


-- =====================================================
-- 1. interactions tablosu için index'ler
-- =====================================================

-- Mevcut index'leri kontrol et
-- SHOW INDEX FROM interactions;

-- post_id ve type için composite index
CREATE INDEX idx_interactions_post_type ON interactions(post_id, type);

-- user_id ve type için index
CREATE INDEX idx_interactions_user_type ON interactions(user_id, type);

-- post_id, type, user_id için covering index (EXISTS sorguları için)
CREATE INDEX idx_interactions_post_type_user ON interactions(post_id, type, user_id);


-- =====================================================
-- 2. follows tablosu için index'ler
-- =====================================================

-- follower_id için index (takip feed'inde JOIN için)
CREATE INDEX idx_follows_follower ON follows(follower_id);

-- followed_id için index (follower sayısı için)
CREATE INDEX idx_follows_followed ON follows(followed_id);


-- =====================================================
-- 3. bookmarks tablosu için index'ler
-- =====================================================

CREATE INDEX idx_bookmarks_user_post ON bookmarks(user_id, post_id);


-- =====================================================
-- 4. notifications tablosu için index'ler
-- =====================================================

CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);


-- =====================================================
-- 5. posts tablosu için index'ler
-- =====================================================

-- created_at için index (sıralama) - DESC MySQL 8+ gerektirir
-- MySQL 5.7 için sadece: CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_posts_created ON posts(created_at);

-- user_id için index
CREATE INDEX idx_posts_user ON posts(user_id);

-- original_post_id için index (repost sorguları)
CREATE INDEX idx_posts_original ON posts(original_post_id);


-- =====================================================
-- 6. messages tablosu için index'ler
-- =====================================================

CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);

CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read);


-- =====================================================
-- Index durumunu kontrol etmek için:
-- =====================================================
-- SHOW INDEX FROM interactions;
-- SHOW INDEX FROM follows;
-- SHOW INDEX FROM bookmarks;
-- SHOW INDEX FROM notifications;
-- SHOW INDEX FROM posts;
-- SHOW INDEX FROM messages;


-- =====================================================
-- HATA DURUMUNDA:
--
-- "Duplicate key name 'idx_xxx'" hatası alırsanız:
-- Index zaten mevcut, bir sonrakine geçin.
--
-- Index silmek isterseniz:
-- DROP INDEX idx_xxx ON table_name;
-- =====================================================
