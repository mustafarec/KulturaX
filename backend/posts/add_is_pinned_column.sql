ALTER TABLE posts ADD COLUMN is_pinned TINYINT(1) DEFAULT 0;
CREATE INDEX idx_posts_user_pinned ON posts (user_id, is_pinned);
