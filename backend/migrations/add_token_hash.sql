-- Token Hashing Migration
-- Run this on the production database BEFORE deploying the new auth_middleware.php

-- 1. Add token_hash column to users table
ALTER TABLE users ADD COLUMN token_hash VARCHAR(64) NULL AFTER token;

-- 2. Create index for fast lookups
CREATE INDEX idx_users_token_hash ON users(token_hash);

-- 3. Optional: Populate existing tokens' hashes (one-time migration)
-- This allows existing sessions to continue working
UPDATE users 
SET token_hash = SHA2(token, 256) 
WHERE token IS NOT NULL AND token_hash IS NULL;

-- Verification: Check how many tokens were migrated
SELECT 
    COUNT(*) AS total_users,
    SUM(CASE WHEN token IS NOT NULL THEN 1 ELSE 0 END) AS with_token,
    SUM(CASE WHEN token_hash IS NOT NULL THEN 1 ELSE 0 END) AS with_hash
FROM users;
