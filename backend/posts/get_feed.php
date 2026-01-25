<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';
include_once '../auth_middleware.php';
include_once 'feed_utils.php'; // Include helper functions

// Auth check
$authenticatedUserId = requireAuth();
$user_id = $authenticatedUserId;

try {
    // --- 1. Filter: 'replies' Special Handling ---
    $filter = isset($_GET['filter']) ? $_GET['filter'] : '';

    if ($filter == 'replies') {
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
                    u.is_premium,
                    
                    p.id as op_id,
                    p.content as op_content,
                    pu.id as op_user_id,
                    pu.username as op_username,
                    pu.full_name as op_full_name,
                    pu.avatar_url as op_avatar_url,
                    pu.is_premium as op_is_premium,
                    
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = i.id) as like_count,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = i.id AND user_id = :user_id) as is_liked

                  FROM interactions i
                  JOIN users u ON i.user_id = u.id
                  LEFT JOIN posts p ON i.post_id = p.id
                  LEFT JOIN users pu ON p.user_id = pu.id
                  WHERE i.user_id = :target_user_id AND i.type = 'comment'
                  ORDER BY i.created_at DESC";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':target_user_id', $target_user_id);
        $stmt->execute();

        $posts = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Manual simple formatting for replies (different structure than posts)
            $row['is_liked'] = $row['is_liked'] > 0;
            $row['user'] = array(
                'id' => $row['user_id'],
                'username' => $row['username'],
                'full_name' => $row['full_name'],
                'avatar_url' => $row['avatar_url'],
                'is_premium' => (bool) ($row['is_premium'] ?? false)
            );

            if ($row['op_id']) {
                $row['original_post'] = array(
                    'id' => $row['op_id'],
                    'content' => $row['op_content'],
                    'user' => array(
                        'id' => $row['op_user_id'],
                        'username' => $row['op_username'],
                        'full_name' => $row['op_full_name'],
                        'avatar_url' => $row['op_avatar_url'],
                        'is_premium' => (bool) ($row['op_is_premium'] ?? false)
                    )
                );
            }

            // Cleanup
            unset($row['username'], $row['full_name'], $row['avatar_url'], $row['is_premium']);
            unset($row['op_id'], $row['op_content'], $row['op_user_id'], $row['op_username'], $row['op_full_name'], $row['op_avatar_url'], $row['op_is_premium']);

            array_push($posts, $row);
        }

        echo json_encode($posts);
        exit;
    }


    // --- 2. Calculate User Affinity Scores (using helper) ---
    $scores = calculateAffinityScores($user_id, $conn);
    // ---------------------------------------------------------

    // Pre-fetch preferences (optimized: single query for both types)
    $showMoreTypes = [];
    $dislikedTypes = [];
    $prefQuery = "SELECT pf.type, p.content_type FROM post_feedback pf 
                  JOIN posts p ON pf.post_id = p.id 
                  WHERE pf.user_id = :user_id AND pf.type IN ('show_more', 'not_interested')";
    $prefStmt = $conn->prepare($prefQuery);
    $prefStmt->execute([':user_id' => $user_id]);
    while ($row = $prefStmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['content_type']) {
            if ($row['type'] === 'show_more') {
                $showMoreTypes[$row['content_type']] = true;
            } else {
                $dislikedTypes[$row['content_type']] = true;
            }
        }
    }

    // Fetch posts where user already gave feed feedback
    $givenFeedbackPosts = [];
    $ffQuery = "SELECT post_id FROM feed_feedback WHERE user_id = :user_id";
    $ffStmt = $conn->prepare($ffQuery);
    $ffStmt->execute([':user_id' => $user_id]);
    while ($row = $ffStmt->fetch(PDO::FETCH_ASSOC)) {
        $givenFeedbackPosts[$row['post_id']] = true;
    }

    $boostBook = isset($showMoreTypes['book']) ? 50 : 0;
    $boostMovie = isset($showMoreTypes['movie']) ? 50 : 0;
    $boostMusic = isset($showMoreTypes['music']) ? 50 : 0;



    // --- 3. Main Feed Query ---
    $query = "SELECT 
                p.*, 
                u.username, 
                u.full_name,
                u.avatar_url,
                u.is_premium, -- ADDED
                
                op.id as op_id,
                op.content as op_content,
                op.source as op_source,
                op.author as op_author,
                op.created_at as op_created_at,
                op.view_count as op_view_count,
                
                ou.id as op_user_id,
                ou.username as op_username,
                ou.full_name as op_full_name,
                ou.avatar_url as op_avatar_url,
                ou.is_premium as op_is_premium, -- ADDED

                p.like_count,
                p.comment_count,
                p.repost_count,
                
                -- OPTIMIZED: EXISTS stops at first match, faster than COUNT(*)
                EXISTS(SELECT 1 FROM interactions WHERE post_id = p.id AND type = 'like' AND user_id = :user_id) as is_liked,
                EXISTS(SELECT 1 FROM posts WHERE original_post_id = p.id AND user_id = :user_id) as is_reposted,
                EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = :user_id) as is_saved,
                p.is_pinned,
                
                op.like_count as op_like_count,
                op.comment_count as op_comment_count,
                op.repost_count as op_repost_count,
                
                EXISTS(SELECT 1 FROM interactions WHERE post_id = op.id AND type = 'like' AND user_id = :user_id) as op_is_liked,
                EXISTS(SELECT 1 FROM posts WHERE original_post_id = op.id AND user_id = :user_id) as op_is_reposted,
                EXISTS(SELECT 1 FROM bookmarks WHERE post_id = op.id AND user_id = :user_id) as op_is_saved,
                
                op.image_url as op_image_url,
                op.content_type as op_content_type,
                op.content_id as op_content_id,
                op.quote_text as op_quote_text,
                op.comment_text as op_comment_text,

                t.name as topic_name,
                t.icon as topic_icon,
                
                ot.id as op_topic_id,
                ot.name as op_topic_name

              FROM posts p
              JOIN users u ON p.user_id = u.id
              LEFT JOIN posts op ON p.original_post_id = op.id
              LEFT JOIN users ou ON op.user_id = ou.id
              LEFT JOIN topics t ON p.topic_id = t.id
              LEFT JOIN topics ot ON op.topic_id = ot.id
              
              LEFT JOIN post_views pv ON pv.post_id = p.id AND pv.user_id = :user_id
              LEFT JOIN post_views opv ON opv.post_id = op.id AND opv.user_id = :user_id
              
              LEFT JOIN post_feedback pf_exclude ON 
                    (pf_exclude.post_id = p.id OR (p.original_post_id IS NOT NULL AND pf_exclude.post_id = p.original_post_id))
                    AND pf_exclude.user_id = :user_id 
                    AND pf_exclude.type IN ('report', 'not_interested')
                    
              LEFT JOIN blocked_users bu_exclude ON
                    (bu_exclude.blocker_id = :user_id AND bu_exclude.blocked_id = p.user_id) OR
                    (bu_exclude.blocker_id = p.user_id AND bu_exclude.blocked_id = :user_id)
                    
              LEFT JOIN follows f_privacy ON f_privacy.follower_id = :user_id AND f_privacy.followed_id = p.user_id";

    $whereClause = " WHERE pf_exclude.id IS NULL AND bu_exclude.id IS NULL
                      AND (u.is_frozen = 0 OR u.is_frozen IS NULL)
                      AND (u.is_private = 0 OR u.is_private IS NULL OR p.user_id = :user_id OR f_privacy.id IS NOT NULL)";

    // Filters
    $filter = isset($_GET['filter']) ? $_GET['filter'] : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

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
        $query .= " AND (
            MATCH(p.content, p.quote_text, p.comment_text, p.author, p.source) AGAINST(:search IN BOOLEAN MODE)
            OR MATCH(u.username, u.full_name) AGAINST(:search IN BOOLEAN MODE)
            OR MATCH(op.content, op.quote_text, op.comment_text, op.author, op.source) AGAINST(:search IN BOOLEAN MODE)
        )";
    }

    // Sorting Logic with Gravity Formula
    $query .= " ORDER BY 
                (
                    (
                        (CASE 
                            WHEN p.content_type = 'book' OR op.content_type = 'book' THEN :score_book + :boost_book + 20
                            WHEN p.content_type = 'movie' OR op.content_type = 'movie' THEN :score_movie + :boost_movie + 20
                            WHEN p.content_type = 'music' OR op.content_type = 'music' THEN :score_music + :boost_music + 20
                            WHEN p.content_type = 'event' OR op.content_type = 'event' THEN 35
                            WHEN p.content_type = 'lyrics' OR op.content_type = 'lyrics' THEN 30
                            WHEN p.quote_text IS NOT NULL AND p.quote_text != '' THEN 30
                            ELSE 15
                        END) 
                        /
                        (POW(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 2, 1.5))
                    )
                    +
                    (
                        p.trending_score
                        *
                        (CASE WHEN pv.id IS NOT NULL OR opv.id IS NOT NULL THEN 0.2 ELSE 1 END)
                    )
                ) DESC,
                p.created_at DESC";

    // Pagination
    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    $query .= " LIMIT :limit OFFSET :offset";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':score_book', $scores['book']);
    $stmt->bindParam(':score_movie', $scores['movie']);
    $stmt->bindParam(':score_music', $scores['music']);
    $stmt->bindParam(':boost_book', $boostBook);
    $stmt->bindParam(':boost_movie', $boostMovie);
    $stmt->bindParam(':boost_music', $boostMusic);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

    if (!empty($search)) {
        $ftSearch = $search . '*';
        $stmt->bindParam(':search', $ftSearch);
    }

    $stmt->execute();

    $posts = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Use helper function to format row
        $formattedPost = formatPostRow($row, $scores, $dislikedTypes, $givenFeedbackPosts);
        array_push($posts, $formattedPost);
    }

    echo json_encode($posts);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Sunucu hatası: " . $e->getMessage()));
}
?>