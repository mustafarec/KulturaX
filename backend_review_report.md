# KulturaX Backend Audit Report

**Date:** January 27, 2026
**Auditor:** Antigravity (Senior Backend Engineer, Distributed Systems)
**Target:** KulturaX Backend (PHP/MySQL Legacy Stack)

---

## 1. Executive Summary: "It Works, Until It Doesn't."

You asked for a ruthless review. Here it is.

The current codebase is a classic example of **"Agency Grade"** software. It is functional, logically organized, and has reasonable security defaults for a low-traffic MVP. However, from a **Distributed Systems** perspective, it is a ticking time bomb.

You have built a synchronous, database-bound monolith that will hit a hard wall at approximately **50-100 concurrent requests/sec**. The architecture assumes the database is infinite and zero-latency. In a high-scale scenario (Google-scale, or even Twitter-trending scale), this backend will self-destruct via cascading latency failures.

## 2. Security Audit (Score: B+)

Your security fundamentals are better than 80% of the startups I review. You aren't making rookie mistakes, but you aren't bulletproof.

### Good:
- **Token Handling**: Hashing tokens (`sha256`) before DB lookup is excellent. Storing `token_hash` prevents leak disasters.
- **Entropy**: Using `random_bytes(32)` provides cryptographic security.
- **Input Validation**: `Validator` class usage is consistent. `PDO` prepared statements are used correctly, mitigating SQL injection.
- **Rate Limiting**: Implementation is present at multiple layers (IP, User).

### The Bad (Vulnerabilities):
- **Race Condition in Rate Limiter**: The file-based fallback in `MemoryRateLimiter.php` has a massive race condition. You read without lock, then write with lock. High concurrency allow attackers to bypass limits by firing parallel requests.
  - *Fix*: Use `sem_acquire` or truly atomic file operations (or just mandatory Redis/APCu).
- **CORS Fallback**: `backend/config.php` allows `Access-Control-Allow-Origin: *` when the origin header is empty. While aimed at mobile apps, this is sloppy.
- **Timing Attacks**: `validateApiSignature` is mostly safe, but `hash_equals` usage protects signature comparison. Ensure `timestamp` checks don't leak server time offsets exploitable for replay attacks.

## 3. Performance Review (Score: C-)

This is where the architecture fails.

### The "Sync" Trap
You are doing **Too Much Work** in the critical path of the HTTP request.

**Evidence (`create.php`):**
```php
// 1. Insert Post
// 2. Update Post Counts (Write to Disk/DB)
// 3. Update Topic Counts (Write to Disk/DB)
// 4. Send Notification (Write to DB + potentially Mail/Push)
```
All of this happens while the user sees a loading spinner. If the notification service lags, the user can't post. If the Topic table is locked, the user can't post.

### Rate Limiter Performance
The `rate_limiter.php` DB fallback performs a `DELETE` (cleanup) before *every* check.
- **Reality**: On high load, your DB spends more time deleting expired rate limit rows than serving posts.
- **Fix**: Move cleanup to a cron job or use probabilistic cleanup (e.g., 1/1000 chance).

## 4. Scalability Assessment (Score: D)

**Your Scalability Bottleneck is the Database (MySQL).**

### 1. The Counters Problem
You are incrementing counters (`repost_count`, `topic_count`) directly in MySQL using `UPDATE table SET x = x + 1`.
- **Why it kills you**: Row-level locking. If a topic goes viral, 10,000 users trying to post in "Politics" will serialize on the **same database row lock** to update the counter. Your DB throughput drops to ~50 writes/sec for that topic.
- **Solution**: Use Redis `INCR` for hot counters and sync to DB asynchronously.

### 2. High-Frequency Writes
Likes and Views are treated as critical data. They are likely writing directly to MySQL (INSERT + UPDATE) which is expensive I/O.
- **Solution**: Buffer likes in Redis/Memcached. Flush to MySQL in batches every 10 seconds.

### 3. No Job Queue
There is no evidence of a background worker (`RabbitMQ`, `Redis/Horizon`, `SQS`). Verification emails and Notifications are sent synchronously.
- **Impact**: One slow SMTP server brings down your Registration endpoint.

## 5. Critical Recommendations (The 24-Hour Plan)

If you want to scale, you need to decouple.

1.  **Mandatory Redis**: Kill the file-based rate limiter. Store sessions, cache, and counters in Redis.
2.  **Async Processing**:
    -   **Immediate**: Install a queue drive (e.g., Redis List).
    -   **Action**: When a user posts, validte -> Insert to DB -> **Push "ProcessCountsAndNotify" Job to Queue** -> Return 201 to user.
    -   Let a worker script handle the notifications and counter updates.
3.  **Database Optimization**:
    -   Remove `DELETE FROM rate_limits` from the hot path.
    -   Ensure `original_post_id` and keys are indexed properly.

## 6. Code Quality & Maintenance

-   **God Objects**: `config.php` is becoming a God Object. It handles DB connection, CORS, Environment, and Constants.
-   **Hard Dependencies**: `include_once` everywhere. Use a Composer autoloader (`PSR-4`).
-   **Logging**: `debugLog` is empty in production. You are flying blind. Implement structured logging (Monolog) writing to a dedicated stream (or file) so you can debug production incidents.

---
**Verdict**: Solid MVP architecture. Distributed System disaster. Refactor for **Asynchrony** immediately.
