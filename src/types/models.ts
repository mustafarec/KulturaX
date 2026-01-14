/**
 * Common TypeScript type definitions
 * Replaces 'any' types throughout the codebase
 */

// ==================== USER ====================

export interface User {
    id: number;
    username: string;
    email?: string;
    full_name?: string;
    name?: string;
    surname?: string;
    bio?: string;
    location?: string;
    website?: string;
    avatar_url?: string;
    header_image_url?: string;
    is_email_verified?: boolean;
    is_frozen?: boolean;
    frozen_at?: string;
    is_private?: boolean;
    is_premium?: boolean;
    created_at?: string;
    updated_at?: string;
    // New profile fields
    birth_date?: string;
    school?: string;
    department?: string;
    interests?: string[];
}

export interface UserProfile extends User {
    follower_count?: number;
    following_count?: number;
    post_count?: number;
    is_following?: boolean;
    is_followed_by?: boolean;
}

// ==================== POST ====================

export type ContentType = 'book' | 'movie' | 'music' | 'event' | 'thought';

export interface Post {
    id: number;
    user_id: number;
    user: User;
    content: string;
    content_type?: ContentType;
    content_id?: string;
    quote_text?: string;
    comment_text?: string;
    source?: string;
    author?: string;
    image_url?: string;

    // Interactions
    like_count?: number | string;
    comment_count?: number | string;
    repost_count?: number | string;
    view_count?: number | string;

    // User-specific status
    is_liked?: boolean;
    is_reposted?: boolean;
    is_saved?: boolean;
    is_pinned?: boolean;

    // Repost
    original_post_id?: number;
    original_post?: Post;

    // Topic
    topic_id?: number;
    topic_name?: string;
    topic_icon?: string;

    // Metadata
    created_at: string;
    updated_at?: string;

    // Feed-specific
    request_feedback?: boolean;
    trending_score?: number;
}

export interface Comment {
    id: number;
    user_id: number;
    user: User;
    post_id: number;
    content: string;
    like_count?: number;
    is_liked?: boolean;
    created_at: string;
}

// ==================== MESSAGE ====================

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    is_read?: boolean;
    read_at?: string;
    created_at: string;
    updated_at?: string;

    // Reply
    reply_to_id?: number;
    reply_to?: Message;

    // Client-side tracking
    client_id?: string;
    _internalId?: string;
    _status?: 'pending' | 'sent' | 'failed';

    // Reactions
    reactions?: MessageReaction[];
}

export interface MessageReaction {
    id: number;
    message_id: number;
    user_id: number;
    emoji: string;
    created_at: string;
}

export interface MessageThread {
    id: number;
    partner: User;
    last_message?: Message;
    unread_count?: number;
    created_at: string;
    updated_at?: string;
}

// ==================== NOTIFICATION ====================

export type NotificationType = 'like' | 'comment' | 'follow' | 'repost' | 'mention' | 'message' | 'system';

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    is_read?: boolean;
    created_at: string;

    // Related entities
    sender?: User;
    post?: Post;
}

// ==================== LIBRARY ====================

export type LibraryStatus = 'reading' | 'want_to_read' | 'completed' | 'dropped' | 'watching' | 'want_to_watch' | 'listened' | 'want_to_listen';

export interface LibraryItem {
    id: number;
    user_id: number;
    content_type: ContentType;
    content_id: string;
    status: LibraryStatus;
    rating?: number;
    progress?: number;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

// ==================== FEED ====================

export interface FeedItem {
    id: string | number;
    type: 'post' | 'user' | 'suggested_users' | 'feedback';

    // Optional properties based on type
    // Post properties
    user?: User;
    content?: string;

    // User search result
    originalId?: number;
    username?: string;
    avatar_url?: string;

    // Feedback
    targetPostId?: number;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

// ==================== TOPICS ====================

export interface Topic {
    id: number;
    name: string;
    icon?: string;
    description?: string;
    post_count?: number;
}


// ==================== COMMENT ====================

export interface CommentReply {
    id: number;
    username: string;
}

// Extends base comment for UI usage
export interface UIComment extends Comment {
    like_count: number;
    is_liked?: boolean;
    parent_id?: number | null;
    avatar_url?: string;
    username: string;
}

