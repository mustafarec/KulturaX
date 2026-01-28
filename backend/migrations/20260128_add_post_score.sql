-- Migration: Add denormalized score for performance
ALTER TABLE posts ADD COLUMN score FLOAT DEFAULT 0;
ALTER TABLE posts ADD COLUMN last_score_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_posts_score ON posts(score DESC);
