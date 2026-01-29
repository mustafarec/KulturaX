-- KültüraX Performans İndeks Optimizasyonu
-- Bu indeksler sık çalışan JOIN ve subquery işlemlerini hızlandırır.
-- Tarih: 2026-01-29

-- 1. Posts Tablosu Optimizasyonu
-- Topic bazlı filtreleme için
CREATE INDEX idx_posts_topic ON posts(topic_id);
-- İçerik tipine göre arama için
CREATE INDEX idx_posts_content_lookup ON posts(content_type, content_id);

-- 2. Reviews Tablosu Optimizasyonu
-- Feed'deki rating subquery'sini hızlandırmak için (KRİTİK)
CREATE INDEX idx_reviews_user_content ON reviews(user_id, content_type, content_id);

-- 3. User Library Optimizasyonu
-- Kütüphane kontrollerini hızlandırmak için
CREATE INDEX idx_user_library_lookup ON user_library(user_id, content_type, content_id);

-- 4. Interactions Optimizasyonu
-- Tip bazlı hızlı sayım için
CREATE INDEX idx_interactions_type_user ON interactions(type, user_id);
