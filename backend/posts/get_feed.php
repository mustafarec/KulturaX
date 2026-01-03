<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';

// Auth kontrolü - feed görüntüleme için login gerekli
$authenticatedUserId = requireAuth();

// URL'deki user_id parametresi varsa ve auth user ile eşleşmiyorsa, sadece o kullanıcının public içeriğini göster
// Şimdilik basit: tüm feed'i döndür ama like durumunu auth user için hesapla
$user_id = $authenticatedUserId; // Kimlik doğrulanan kullanıcı

try {
    // --- Filter: 'replies' Special Handling ---
    // If filter is 'replies', we fetch from 'interactions' table instead of 'posts'.
    $filter = isset($_GET['filter']) ? $_GET['filter'] : '';
    
    if ($filter == 'replies') {
        // Determine Target User ID:
        // - If 'user_id' is passed in URL, that's the profile we are viewing.
        // - Otherwise, default to auth user (My Profile).
        $target_user_id = isset($_GET['user_id']) ? $_GET['user_id'] : $user_id;

        $query = "SELECT 
                    i.id, 
                    i.content, 
                    i.created_at, 
                    i.user_id, 
                    i.post_id as reply_to_post_id,
                    'comment' as type,
                    u.username, 
                    u.full_name, 
                    u.avatar_url,
                    
                    -- Parent Post Info (Mocking original_post structure)
                    p.id as op_id,
                    p.content as op_content,
                    pu.id as op_user_id,
                    pu.username as op_username,
                    pu.full_name as op_full_name,
                    pu.avatar_url as op_avatar_url,
                    
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = i.id) as like_count,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = i.id AND user_id = :user_id) as is_liked

                  FROM interactions i
                  JOIN users u ON i.user_id = u.id
                  LEFT JOIN posts p ON i.post_id = p.id
                  LEFT JOIN users pu ON p.user_id = pu.id
                  WHERE i.user_id = :target_user_id AND i.type = 'comment'
                  ORDER BY i.created_at DESC";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);         // Auth user for 'is_liked'
        $stmt->bindParam(':target_user_id', $target_user_id); // Profile user for 'WHERE'
        $stmt->execute();
        
        $posts = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
             $row['is_liked'] = $row['is_liked'] > 0;
             
             // User object
             $row['user'] = array(
                'id' => $row['user_id'],
                'username' => $row['username'],
                'full_name' => $row['full_name'],
                'avatar_url' => $row['avatar_url']
             );

             // Mimic original_post for the parent post being replied to
             if ($row['op_id']) {
                 $row['original_post'] = array(
                     'id' => $row['op_id'],
                     'content' => $row['op_content'],
                     'user' => array(
                         'id' => $row['op_user_id'],
                         'username' => $row['op_username'],
                         'full_name' => $row['op_full_name'],
                         'avatar_url' => $row['op_avatar_url']
                     )
                 );
             }
             
             // Cleanup
             unset($row['username']); unset($row['full_name']); unset($row['avatar_url']);
             unset($row['op_id']); unset($row['op_content']); 
             unset($row['op_user_id']); unset($row['op_username']); unset($row['op_full_name']); unset($row['op_avatar_url']);

             array_push($posts, $row);
        }
        
        echo json_encode($posts);
        exit; // Stop main execution
    }


    // --- Implicit Feedback: Calculate User Affinity Scores ---
    
    // Session bazlı önbellekleme (5 dakika)
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }

    $scores = array('book' => 0, 'movie' => 0, 'music' => 0);
    $cacheKey = 'affinity_scores_' . $user_id;

    if (isset($_SESSION[$cacheKey]) && isset($_SESSION[$cacheKey . '_time']) && (time() - $_SESSION[$cacheKey . '_time'] < 300)) {
        // Cache geçerli
        $scores = $_SESSION[$cacheKey];
    } else {
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
        while($row = $intStmt->fetch(PDO::FETCH_ASSOC)) {
            $multiplier = ($row['interaction_type'] == 'like') ? 2 : 3;
            if(isset($scores[$row['type']])) {
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
        while($row = $repStmt->fetch(PDO::FETCH_ASSOC)) {
            if(isset($scores[$row['type']])) {
                $scores[$row['type']] += $row['count'] * 5;
            }
        }
        
        // Save to cache
        $_SESSION[$cacheKey] = $scores;
        $_SESSION[$cacheKey . '_time'] = time();
    }
    // ---------------------------------------------------------

    // Pre-fetch 'show_more' preferences to avoid subquery in ORDER BY
    $showMoreTypes = [];
    $smQuery = "SELECT p.content_type FROM post_feedback pf 
                JOIN posts p ON pf.post_id = p.id 
                WHERE pf.user_id = :user_id AND pf.type = 'show_more'";
    $smStmt = $conn->prepare($smQuery);
    $smStmt->execute([':user_id' => $user_id]);
    while($row = $smStmt->fetch(PDO::FETCH_ASSOC)) {
        if($row['content_type']) $showMoreTypes[$row['content_type']] = true;
    }

    // Fetch 'not_interested' preferences
    $dislikedTypes = [];
    $niQuery = "SELECT p.content_type FROM post_feedback pf 
                JOIN posts p ON pf.post_id = p.id 
                WHERE pf.user_id = :user_id AND pf.type = 'not_interested'";
    $niStmt = $conn->prepare($niQuery);
    $niStmt->execute([':user_id' => $user_id]);
    while($row = $niStmt->fetch(PDO::FETCH_ASSOC)) {
        if($row['content_type']) $dislikedTypes[$row['content_type']] = true;
    }

    // Fetch posts where user already gave feed feedback
    $givenFeedbackPosts = [];
    $ffQuery = "SELECT post_id FROM feed_feedback WHERE user_id = :user_id";
    $ffStmt = $conn->prepare($ffQuery);
    $ffStmt->execute([':user_id' => $user_id]);
    while($row = $ffStmt->fetch(PDO::FETCH_ASSOC)) {
        $givenFeedbackPosts[$row['post_id']] = true;
    }

    $boostBook = isset($showMoreTypes['book']) ? 50 : 0;
    $boostMovie = isset($showMoreTypes['movie']) ? 50 : 0;
    $boostMusic = isset($showMoreTypes['music']) ? 50 : 0;


    // Main Feed Query with Optimized Exclusion using JOIN
    $query = "SELECT 
                p.*, 
                u.username, 
                u.full_name,
                u.avatar_url,
                op.id as op_id,
                op.content as op_content,
                op.source as op_source,
                op.author as op_author,
                op.created_at as op_created_at,
                ou.id as op_user_id,
                ou.username as op_username,
                ou.full_name as op_full_name,
                ou.avatar_url as op_avatar_url,
                -- OPTIMIZED: Direct column access instead of subqueries
                p.like_count,
                p.comment_count,
                p.repost_count,
                -- User-specific queries (cannot be denormalized)
                (SELECT COUNT(*) FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted,
                (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :user_id) as is_saved,
                p.is_pinned,
                
                -- OPTIMIZED: Original post counters
                op.like_count as op_like_count,
                op.comment_count as op_comment_count,
                op.repost_count as op_repost_count,
                -- User-specific for original post
                (SELECT COUNT(*) FROM interactions WHERE post_id = op.id AND type = 'like' AND user_id = :user_id) as op_is_liked,
                (SELECT COUNT(*) FROM posts WHERE original_post_id = op.id AND user_id = :user_id) as op_is_reposted,
                (SELECT COUNT(*) FROM bookmarks WHERE post_id = op.id AND user_id = :user_id) as op_is_saved,
                
                op.image_url as op_image_url,
                op.content_type as op_content_type,
                op.content_id as op_content_id,
                op.quote_text as op_quote_text,
                op.comment_text as op_comment_text,
                op.view_count as op_view_count,

                t.name as topic_name,
                t.icon as topic_icon,
                
                -- Original post topic
                ot.id as op_topic_id,
                ot.name as op_topic_name

              FROM posts p
              JOIN users u ON p.user_id = u.id
              LEFT JOIN posts op ON p.original_post_id = op.id
              LEFT JOIN users ou ON op.user_id = ou.id
              LEFT JOIN topics t ON p.topic_id = t.id
              LEFT JOIN topics ot ON op.topic_id = ot.id
              
              -- SMART FEED: Görüntülenme Kontrolü
              LEFT JOIN post_views pv ON pv.post_id = p.id AND pv.user_id = :user_id
              LEFT JOIN post_views opv ON opv.post_id = op.id AND opv.user_id = :user_id
              
              -- LEFT JOIN for Exclusion (Optimized NOT IN)
              LEFT JOIN post_feedback pf_exclude ON 
                    (pf_exclude.post_id = p.id OR (p.original_post_id IS NOT NULL AND pf_exclude.post_id = p.original_post_id))
                    AND pf_exclude.user_id = :user_id 
                    AND pf_exclude.type IN ('report', 'not_interested')
                    
              -- LEFT JOIN for Blocked Users (Both directions: I blocked them OR They blocked me)
              LEFT JOIN blocked_users bu_exclude ON
                    (bu_exclude.blocker_id = :user_id AND bu_exclude.blocked_id = p.user_id) OR
                    (bu_exclude.blocker_id = p.user_id AND bu_exclude.blocked_id = :user_id)
                    
              -- LEFT JOIN for Private Account Check (Check if viewer follows private account)
              LEFT JOIN follows f_privacy ON f_privacy.follower_id = :user_id AND f_privacy.followed_id = p.user_id";

    $hasWhere = false;
    $whereClause = "";

    // IMPORTANT: Exclude where join found a match
    // Also exclude private accounts that user doesn't follow (unless it's their own post)
    // Also exclude frozen accounts
    $whereClause .= " WHERE pf_exclude.id IS NULL AND bu_exclude.id IS NULL
                      AND (u.is_frozen = 0 OR u.is_frozen IS NULL)
                      AND (u.is_private = 0 OR u.is_private IS NULL OR p.user_id = :user_id OR f_privacy.id IS NOT NULL)"; 
    $hasWhere = true;

    // SMART FEED: Katı zaman filtresini kaldırıyoruz (Gravity halledecek).
    // Sadece arama yapılmıyorsa geçerli.
    
    // Filter logic
    // Filter logic
    $filter = isset($_GET['filter']) ? $_GET['filter'] : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    
    // Default: EXCLUDE replies is implicit because we only query 'posts' table here.
    // 'replies' case is handled above and exits early.
    
    if ($filter == 'book') {
        $whereClause .= " AND (p.content_type = 'book' OR op.content_type = 'book')";
    } elseif ($filter == 'movie') {
        $whereClause .= " AND (p.content_type = 'movie' OR op.content_type = 'movie')";
    } elseif ($filter == 'music') {
        $whereClause .= " AND (p.content_type = 'music' OR op.content_type = 'music')";
    }
    
    $query .= $whereClause;

    // Search logic
    if (!empty($search)) {
        // MySQL Full-Text Search with Boolean Mode
        $query .= " AND (
            MATCH(p.content, p.quote_text, p.comment_text, p.author, p.source) AGAINST(:search IN BOOLEAN MODE)
            OR MATCH(u.username, u.full_name) AGAINST(:search IN BOOLEAN MODE)
            OR MATCH(op.content, op.quote_text, op.comment_text, op.author, op.source) AGAINST(:search IN BOOLEAN MODE)
        )";
    }

    // SMART FEED ALGORİTMASI (Gravity + Seen Penalty)
    // Formül: (İlgi + Etkileşim) / ((Saat Farkı + 2)^1.5 * (Görüldü Cezası))
    $query .= " ORDER BY 
                (
                    (
                        -- 1. Kişisel İlgi Skoru (Hala dinamik, her kullanıcı için özel)
                        (CASE 
                            WHEN p.content_type = 'book' OR op.content_type = 'book' THEN :score_book + :boost_book
                            WHEN p.content_type = 'movie' OR op.content_type = 'movie' THEN :score_movie + :boost_movie
                            WHEN p.content_type = 'music' OR op.content_type = 'music' THEN :score_music + :boost_music
                            ELSE 0
                        END) 
                        /
                        (
                            -- Gravity (Kişisel Skor için tekrar hesaplanmalı)
                            POW(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 2, 1.5)
                        )
                    )
                    +
                    (
                        -- 2. Global Skor (Artık veritabanından geliyor - OPTIMIZED)
                        p.trending_score
                        *
                         -- 4. Seen Penalty (Görülme Cezası): Görüldüyse puanı direkt düşür
                        (CASE WHEN pv.id IS NOT NULL OR opv.id IS NOT NULL THEN 0.2 ELSE 1 END)
                    )
                ) DESC,
                p.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    
    // Bind Score Parameters
    $stmt->bindParam(':score_book', $scores['book']);
    $stmt->bindParam(':score_movie', $scores['movie']);
    $stmt->bindParam(':score_music', $scores['music']);

    // Bind Boost Parameters (static values from PHP logic)
    $stmt->bindParam(':boost_book', $boostBook);
    $stmt->bindParam(':boost_movie', $boostMovie);
    $stmt->bindParam(':boost_music', $boostMusic);

    if (!empty($search)) {
        // Append * to support prefix search in Boolean mode
        $ftSearch = $search . '*';
        $stmt->bindParam(':search', $ftSearch);
    }
    $stmt->execute();

    $posts = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        // Convert is_liked, is_reposted, is_saved to boolean
        $row['is_liked'] = $row['is_liked'] > 0;
        $row['is_reposted'] = $row['is_reposted'] > 0;
        $row['is_saved'] = $row['is_saved'] > 0;
        
        // Structure user object
        $row['user'] = array(
            'id' => $row['user_id'],
            'username' => $row['username'],
            'full_name' => $row['full_name'],
            'avatar_url' => $row['avatar_url']
        );

        // Structure original_post object if it exists
        if ($row['original_post_id']) {
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
                'is_liked' => $row['op_is_liked'] > 0,
                'is_reposted' => $row['op_is_reposted'] > 0,
                'is_saved' => $row['op_is_saved'] > 0,
                'topic_id' => $row['op_topic_id'],
                'topic_name' => $row['op_topic_name'],
                'user' => array(
                    'id' => $row['op_user_id'],
                    'username' => $row['op_username'],
                    'full_name' => $row['op_full_name'],
                    'avatar_url' => $row['op_avatar_url']
                )
            );
        }

        // Remove flat fields to keep clean
        unset($row['username']);
        unset($row['full_name']);
        unset($row['avatar_url']);
        unset($row['op_id']);
        unset($row['op_content']);
        unset($row['op_quote_text']);
        unset($row['op_comment_text']);
        unset($row['op_source']);
        unset($row['op_author']);
        unset($row['op_created_at']);
        unset($row['op_user_id']);
        unset($row['op_username']);
        unset($row['op_full_name']);
        unset($row['op_avatar_url']);
        unset($row['op_image_url']);
        unset($row['op_content_type']);
        unset($row['op_content_id']);
        unset($row['op_like_count']);
        unset($row['op_comment_count']);
        unset($row['op_is_liked']);
        unset($row['op_repost_count']);
        unset($row['op_is_reposted']);
        unset($row['op_is_saved']);
        
        // SMART FEEDBACK TRIGGER LOGIC
        $row['request_feedback'] = false;
        
        // Only consider if user hasn't given feedback on this specific post yet
        if (!isset($givenFeedbackPosts[$row['id']])) {
            $contentType = $row['content_type'];
            if (!$contentType && isset($row['original_post']) && isset($row['original_post']['content_type'])) {
                $contentType = $row['original_post']['content_type'];
            }

            if ($contentType) {
                // 1. Exploration: User has 0 score interaction with this type (New to them)
                $isNewType = isset($scores[$contentType]) ? ($scores[$contentType] == 0) : true;
                
                // 2. Re-verification: User disliked this type, but this post is popular (>50 likes)
                // (Looking for "Exceptional" content in a disliked category)
                $isDislikedType = isset($dislikedTypes[$contentType]);
                $isPopular = $row['like_count'] > 50;

                // Probability checks
                // If it's a new type, 10% chance to ask
                if ($isNewType && rand(1, 10) == 1) {
                    $row['request_feedback'] = true;
                }
                // If it's a disliked type but popular, 20% chance to ask (to double check)
                else if ($isDislikedType && $isPopular && rand(1, 5) == 1) {
                    $row['request_feedback'] = true;
                }
                // Random check for any post (very low probability, e.g. 2%) to keep training data fresh
                else if (rand(1, 50) == 1) {
                    $row['request_feedback'] = true;
                }
            }
        }

        array_push($posts, $row);
    }

    echo json_encode($posts);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>
