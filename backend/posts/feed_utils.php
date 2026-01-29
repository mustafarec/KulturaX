<?php

/**
 * Calculates user affinity scores for content types (book, movie, music)
 * based on interactions (likes, comments) and reposts.
 * Uses session caching to reduce DB load.
 */
function calculateAffinityScores($user_id, $conn)
{
    // APCu key
    $cacheKey = 'affinity_scores_' . $user_id;

    // 0. Try APCu Cache (5 minutes TTL)
    // apcu_fetch returns distinct false on failure so we can check strict false
    if (function_exists('apcu_fetch')) {
        $cachedScores = apcu_fetch($cacheKey);
        if ($cachedScores !== false) {
            return $cachedScores;
        }
    }

    $scores = array('book' => 0, 'movie' => 0, 'music' => 0);

    // 1. Calculate Score from Interactions (Likes=2, Comments=3)
    $intQuery = "SELECT 
                    COALESCE(p.content_type, op.content_type) as type, 
                    i.type as interaction_type,
                    COUNT(*) as count
                FROM interactions i
                JOIN posts p ON i.post_id = p.id
                LEFT JOIN posts op ON p.original_post_id = op.id
                WHERE i.user_id = :user_id 
                AND COALESCE(p.content_type, op.content_type) IN ('book', 'movie', 'music')
                GROUP BY COALESCE(p.content_type, op.content_type), i.type";

    $intStmt = $conn->prepare($intQuery);
    $intStmt->execute([':user_id' => $user_id]);
    while ($row = $intStmt->fetch(PDO::FETCH_ASSOC)) {
        $multiplier = ($row['interaction_type'] == 'like') ? 2 : 3;
        if (isset($scores[$row['type']])) {
            $scores[$row['type']] += $row['count'] * $multiplier;
        }
    }

    // 2. Calculate Score from Reposts (Repost=5)
    $repQuery = "SELECT
                    COALESCE(p.content_type, op.content_type) as type,
                    COUNT(*) as count
                 FROM posts p
                 LEFT JOIN posts op ON p.original_post_id = op.id
                 WHERE p.user_id = :user_id
                 AND p.original_post_id IS NOT NULL
                 AND COALESCE(p.content_type, op.content_type) IN ('book', 'movie', 'music')
                 GROUP BY COALESCE(p.content_type, op.content_type)";

    $repStmt = $conn->prepare($repQuery);
    $repStmt->execute([':user_id' => $user_id]);
    while ($row = $repStmt->fetch(PDO::FETCH_ASSOC)) {
        if (isset($scores[$row['type']])) {
            $scores[$row['type']] += $row['count'] * 5;
        }
    }

    // Save to APCu cache (900 seconds = 15 mins)
    if (function_exists('apcu_store')) {
        apcu_store($cacheKey, $scores, 900);
    }

    return $scores;
}

/**
 * Formats a raw database row into a structured Post object.
 * Handles boolean conversions, nested User objects, and Original Post structure.
 */
function formatPostRow($row, $scores = [], $dislikedTypes = [], $givenFeedbackPosts = [])
{
    // Convert boolean fields
    $row['is_liked'] = $row['is_liked'] > 0;
    $row['is_reposted'] = $row['is_reposted'] > 0;
    $row['is_saved'] = $row['is_saved'] > 0;
    $row['is_pinned'] = isset($row['is_pinned']) ? ($row['is_pinned'] > 0) : false;

    // Structure user object
    $row['user'] = array(
        'id' => $row['user_id'],
        'username' => $row['username'],
        'full_name' => $row['full_name'],
        'avatar_url' => $row['avatar_url'],
        'is_premium' => (bool) ($row['is_premium'] ?? false)
    );

    // Structure original_post object if it exists
    if (!empty($row['original_post_id'])) {
        $row['original_post'] = array(
            'id' => $row['op_id'],
            'content' => $row['op_content'],
            'quote_text' => $row['op_quote_text'],
            'comment_text' => $row['op_comment_text'],
            'source' => $row['op_source'],
            'author' => $row['op_author'],
            'created_at' => $row['op_created_at'],
            'image_url' => $row['op_image_url'],
            'content_type' => $row['op_content_type'],
            'content_id' => $row['op_content_id'],
            'like_count' => $row['op_like_count'],
            'comment_count' => $row['op_comment_count'],
            'repost_count' => $row['op_repost_count'],
            'view_count' => $row['op_view_count'] ?? 0,
            'is_liked' => $row['op_is_liked'] > 0,
            'is_reposted' => $row['op_is_reposted'] > 0,
            'is_saved' => $row['op_is_saved'] > 0,
            'topic_id' => $row['op_topic_id'],
            'topic_name' => $row['op_topic_name'],
            'user' => array(
                'id' => $row['op_user_id'],
                'username' => $row['op_username'],
                'full_name' => $row['op_full_name'],
                'avatar_url' => $row['op_avatar_url'],
                'is_premium' => (bool) ($row['op_is_premium'] ?? false)
            ),
            'rating' => isset($row['op_rating']) ? (float) $row['op_rating'] : null
        );
    }

    // Add rating to main post
    if (isset($row['rating'])) {
        $row['rating'] = (float) $row['rating'];
    }

    // Clean up flat fields
    $fieldsToRemove = [
        'username',
        'full_name',
        'avatar_url',
        'is_premium', // Main user flat fields
        'op_id',
        'op_content',
        'op_quote_text',
        'op_comment_text',
        'op_source',
        'op_author',
        'op_created_at',
        'op_user_id',
        'op_username',
        'op_full_name',
        'op_avatar_url',
        'op_is_premium',
        'op_image_url',
        'op_content_type',
        'op_content_id',
        'op_like_count',
        'op_comment_count',
        'op_repost_count',
        'op_is_liked',
        'op_is_reposted',
        'op_is_saved',
        'op_topic_id',
        'op_topic_name',
        'op_view_count'
    ];

    foreach ($fieldsToRemove as $field) {
        unset($row[$field]);
    }

    // FEEDBACK TRIGGER LOGIC (Optional, can be disabled)
    $row['request_feedback'] = false;
    if (!empty($scores) && !isset($givenFeedbackPosts[$row['id']])) {
        $contentType = $row['content_type'];
        if (!$contentType && isset($row['original_post']) && isset($row['original_post']['content_type'])) {
            $contentType = $row['original_post']['content_type'];
        }

        if ($contentType) {
            $isNewType = isset($scores[$contentType]) ? ($scores[$contentType] == 0) : true;
            $isDislikedType = isset($dislikedTypes[$contentType]);
            $isPopular = ($row['like_count'] > 50);

            if ($isNewType && rand(1, 10) == 1) {
                $row['request_feedback'] = true;
            } elseif ($isDislikedType && $isPopular && rand(1, 5) == 1) {
                $row['request_feedback'] = true;
            } elseif (rand(1, 50) == 1) {
                $row['request_feedback'] = true;
            }
        }
    }

    return $row;
}
