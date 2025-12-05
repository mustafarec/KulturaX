-- Update notifications table to support new types (repost, quote)
ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL;
