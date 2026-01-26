import React, { useState } from 'react';
import { formatRelativeTime } from '../utils/dateUtils';
import { DefaultImages, getDefaultAvatar } from '../utils/DefaultImages';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Repeat, MoreVertical, Heart, MessageCircle, Share2 as ShareIcon, Bookmark, Quote, BookOpen } from 'lucide-react-native';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { usePostInteractions, PostUpdateFn } from '../hooks/usePostInteractions';
import { RepostMenu } from './RepostMenu';
import { Post, ContentType } from '../types/models';
import { getStyles } from './styles/PostCard.styles';
import { ensureHttps } from '../utils/urlUtils';

interface PostCardProps {
    post: Post;
    onPress?: () => void;
    onLike?: () => void;
    onComment?: () => void;
    onOptions?: (position: { x: number, y: number, width: number, height: number }) => void;
    onRepost?: () => void;
    onUserPress?: (userId?: number) => void;
    onReposterPress?: () => void;
    currentUserId?: number;
    onContentPress?: (type: ContentType, id: string) => void;
    onSave?: () => void;
    isSaved?: boolean;
    onShare?: () => void;
    onTopicPress?: (topicId: number, topicName: string) => void;
    onUpdatePost?: PostUpdateFn; // New Prop for self-contained logic
}

const PostCardComponent: React.FC<PostCardProps> = ({
    post,
    onPress,
    onLike,
    onComment,
    onOptions,
    onRepost,
    onUserPress,
    onReposterPress,
    currentUserId,
    onContentPress,
    onSave,
    isSaved,
    onShare,
    onTopicPress,
    onUpdatePost
}) => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const optionsButtonRef = React.useRef<View>(null);
    const [internalRepostMenuVisible, setInternalRepostMenuVisible] = useState(false);

    // --- LOGIC BLOCK MOVED UP ---
    const isRepost = !!post.original_post_id;
    const isQuoteRepost = isRepost && post.original_post &&
        post.content !== 'Yeniden paylaşım' &&
        post.content !== post.original_post.content;

    const displayPost = isQuoteRepost ? post : (isRepost && post.original_post ? post.original_post : post);

    // --- INSTANT FEEDBACK STATE ---
    // Performans için beğeni durumunu local state'te tutuyoruz
    const [localIsLiked, setLocalIsLiked] = useState(!!displayPost.is_liked);
    const [localLikeCount, setLocalLikeCount] = useState(parseInt(String(displayPost.like_count || '0'), 10));

    // Prop değişirse local state'i güncelle (örn: başka bir yerden beğenilirse)
    React.useEffect(() => {
        setLocalIsLiked(!!displayPost.is_liked);
        setLocalLikeCount(parseInt(String(displayPost.like_count || '0'), 10));
    }, [displayPost.is_liked, displayPost.like_count]);

    // Initialize Hook
    const interactions = usePostInteractions({ onUpdatePost });

    const handleOptionsPress = () => {
        if (onOptions && optionsButtonRef.current) {
            optionsButtonRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                onOptions({ x: px, y: py, width, height });
            });
        }
    };

    // Derived Handlers (Use Prop if exists, else Hook with Instant Feedback)
    const handleLike = () => {
        // 1. Anında UI güncellemesi (Instant Feedback)
        const newStatus = !localIsLiked;
        setLocalIsLiked(newStatus);
        setLocalLikeCount(prev => newStatus ? prev + 1 : Math.max(0, prev - 1));

        // 2. Asıl işlemi tetikle (API + Global State)
        if (onLike) {
            onLike();
        } else {
            interactions.handleLike(post);
        }
    };

    // ... Diğer handlerlar aynen kalır ...
    const handleSave = onSave || (() => interactions.handleToggleSave(post));
    const handleRepost = onRepost || (() => setInternalRepostMenuVisible(true));
    const handleContent = onContentPress || interactions.handleContentPress;
    const handleUser = onUserPress || interactions.handleUserPress;

    // OPTIMIZED: useMemo to cache JSON parsing result
    const { displayComment, displayQuote } = React.useMemo(() => {
        let comment = '';
        let quote = '';

        if (displayPost.quote_text != null || displayPost.comment_text != null) {
            quote = displayPost.quote_text || '';
            comment = displayPost.comment_text || '';
        }

        if (!quote && !comment && displayPost.content) {
            try {
                if (displayPost.content.startsWith('{')) {
                    const parsed = JSON.parse(displayPost.content);
                    if (parsed.quote !== undefined) {
                        comment = parsed.comment;
                        quote = parsed.quote;
                    } else {
                        comment = displayPost.content;
                    }
                } else {
                    const isContentType = displayPost.content_type === 'book' ||
                        displayPost.content_type === 'movie' ||
                        displayPost.content_type === 'music';
                    const hasSource = displayPost.source &&
                        displayPost.source !== 'Paylaşım' &&
                        displayPost.source !== 'App' &&
                        displayPost.source !== 'Düşünce';

                    if (isContentType || hasSource) {
                        quote = displayPost.content;
                    } else {
                        comment = displayPost.content;
                    }
                }
            } catch (e) {
                // Fallback logic
                const isContentType = displayPost.content_type === 'book' ||
                    displayPost.content_type === 'movie' ||
                    displayPost.content_type === 'music';
                const hasSource = displayPost.source &&
                    displayPost.source !== 'Paylaşım' &&
                    displayPost.source !== 'App' &&
                    displayPost.source !== 'Düşünce';

                if (isContentType || hasSource) {
                    quote = displayPost.content;
                } else {
                    comment = displayPost.content;
                }
            }
        }

        return { displayComment: comment, displayQuote: quote };
    }, [displayPost.content, displayPost.quote_text, displayPost.comment_text, displayPost.content_type, displayPost.source]);

    let displayUser = post.user;
    if (isRepost && !isQuoteRepost) {
        if (post.original_post) {
            displayUser = post.original_post.user;
        } else if (post.author) {
            displayUser = { id: 0, username: post.author, full_name: post.author, avatar_url: undefined };
        }
    }

    // Optimize styles with useMemo
    const styles = React.useMemo(() => getStyles(theme), [theme]);

    const isBlackTheme = theme.id === 'black';
    const interactionColors = {
        inactive: isBlackTheme ? '#9ca3af' : theme.colors.textSecondary,
        like: '#f91880',
        repost: '#22c55e',
        comment: theme.colors.textSecondary,
    };

    // Check internal logic for Repost Status (if passed prop is missing, we use post item)
    const isAlreadyReposted = onRepost ? undefined : (post.is_reposted || (post.original_post && post.original_post.is_reposted));

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
            <Card style={styles.container} variant="default" padding="md">
                {onOptions && (
                    <TouchableOpacity onPress={handleOptionsPress} style={styles.optionsButton}>
                        <View ref={optionsButtonRef} collapsable={false}>
                            <MoreVertical size={20} color={theme.colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Repost Indicator */}
                {isRepost && !isQuoteRepost && (
                    <TouchableOpacity onPress={onReposterPress} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Repeat size={12} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' }}>
                            {post.user.full_name || post.user.username} yeniden gönderdi
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => handleUser(displayUser.id)}>
                        <Avatar
                            src={displayUser.avatar_url}
                            alt={displayUser.username}
                            size="md"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.userInfo} onPress={() => handleUser(displayUser.id)}>
                        <Text style={styles.name}>{displayUser.full_name || displayUser.username}</Text>
                        <View style={styles.meta}>
                            <Text style={styles.username}>@{displayUser.username}</Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.time}>{formatRelativeTime(post.created_at || Date.now())}</Text>
                            {/* Topic badge - show from post or original post */}
                            {(post.topic_name || (post.original_post && post.original_post.topic_name)) && (
                                <>
                                    <Text style={styles.dot}>•</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const topicId = post.topic_id || (post.original_post && post.original_post.topic_id);
                                            const topicName = post.topic_name || (post.original_post && post.original_post.topic_name);
                                            if (onTopicPress && topicId && topicName) {
                                                onTopicPress(topicId, topicName);
                                            }
                                        }}
                                        disabled={!onTopicPress || !(post.topic_id || (post.original_post && post.original_post.topic_id))}
                                    >
                                        <Badge variant="secondary">
                                            {(post.topic_name || (post.original_post && post.original_post.topic_name) || '').replace(/^#/, '')}
                                        </Badge>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                </View>

                {/* Reply Context */}
                {post.reply_to_post_id && (
                    <View style={{ marginBottom: 4, marginTop: -4 }}>
                        {post.original_post?.user ? (
                            <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                                Yanıtlanan: <Text
                                    style={{ color: theme.colors.primary, fontWeight: '600' }}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        if (post.original_post?.user?.id) handleUser(post.original_post.user.id);
                                    }}
                                >
                                    @{post.original_post.user.username}
                                </Text>
                            </Text>
                        ) : (
                            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                                Silinmiş bir gönderiye yanıt olarak
                            </Text>
                        )}
                    </View>
                )}

                {/* Post Title */}
                {displayPost.title ? (
                    <Text style={[styles.content, { fontWeight: 'bold', marginBottom: 4, fontSize: 17 }]}>
                        {displayPost.title}
                    </Text>
                ) : null}

                {/* Content Text */}
                {displayComment ? (
                    <Text style={styles.content}>{displayComment}</Text>
                ) : null}

                {/* Book Info Card (Always shown if it's a book/movie post) */}
                {(displayPost.content_type === 'book' || displayPost.content_type === 'movie') && (
                    <View style={{ marginBottom: theme.spacing.m }}>
                        {/* Book Details */}
                        <TouchableOpacity
                            style={styles.bookCard}
                            onPress={() => handleContent(displayPost.content_type!, displayPost.content_id!)}
                        >
                            <Image
                                source={{ uri: ensureHttps(displayPost.image_url) || DefaultImages.placeholder }}
                                style={styles.bookCover}
                                resizeMode="cover"
                            />
                            <View style={styles.bookInfo}>
                                <Text style={styles.bookTitle}>{displayPost.source || 'Başlık Yok'}</Text>
                                <Text style={styles.bookAuthor}>{displayPost.author || 'Bilinmeyen'}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <BookOpen size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Şu an okuyor</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Separated Quote Card (If quote exists) */}
                        {displayQuote ? (
                            <View style={[styles.quoteBox, { marginTop: 0 }]}>
                                <Quote size={32} color={theme.colors.primary} style={{ opacity: 0.2, position: 'absolute', top: 12, right: 12 }} />
                                <Text style={styles.quoteText}>"{displayQuote}"</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {/* Fallback for other content types (Music, etc.) or just image posts */}
                {!(displayPost.content_type === 'book' || displayPost.content_type === 'movie') && displayPost.image_url && (
                    <TouchableOpacity
                        style={styles.bookCard}
                        onPress={() => handleContent(displayPost.content_type!, displayPost.content_id!)}
                    >
                        <Image
                            source={{ uri: ensureHttps(displayPost.image_url) || DefaultImages.placeholder }}
                            style={styles.bookCover}
                            resizeMode="cover"
                        />
                        <View style={styles.bookInfo}>
                            <Text style={styles.bookTitle}>{displayPost.source || 'Başlık Yok'}</Text>
                            <Text style={styles.bookAuthor}>{displayPost.author || 'Bilinmeyen'}</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Quote Only (if not book/movie specific but has quote logic e.g. from JSON) */}
                {!(displayPost.content_type === 'book' || displayPost.content_type === 'movie') && displayQuote ? (
                    <View style={styles.quoteBox}>
                        <Text style={styles.quoteText}>"{displayQuote}"</Text>
                    </View>
                ) : null}

                {/* Embedded Post for Quote Reposts */}
                {isQuoteRepost && post.original_post && (
                    <TouchableOpacity
                        style={[styles.embeddedPostContainer, { borderColor: theme.colors.border }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            if (post.original_post) {
                                (navigation as any).navigate('PostDetail', { postId: post.original_post.id });
                            }
                        }}
                        activeOpacity={0.9}
                    >
                        <TouchableOpacity
                            style={styles.embeddedHeader}
                            onPress={(e) => {
                                e.stopPropagation();
                                if (post.original_post?.user?.id) {
                                    handleUser(post.original_post.user.id);
                                }
                            }}
                        >
                            <Image
                                source={{ uri: post.original_post.user.avatar_url || getDefaultAvatar(post.original_post.user.username || 'User', 50) }}
                                style={styles.embeddedAvatar}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.embeddedName} numberOfLines={1}>
                                    {post.original_post.user.full_name || post.original_post.user.username}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                    <Text style={styles.embeddedUsername} numberOfLines={1}>
                                        @{post.original_post.user.username}
                                    </Text>
                                    <Text style={[styles.dot, { marginHorizontal: 4 }]}>•</Text>
                                    <Text style={styles.embeddedUsername}>
                                        {formatRelativeTime(post.original_post.created_at)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Show comment text if exists */}
                        {post.original_post.comment_text ? (
                            <Text style={styles.embeddedContent} numberOfLines={2}>
                                {post.original_post.comment_text}
                            </Text>
                        ) : post.original_post.content && !post.original_post.quote_text ? (
                            <Text style={styles.embeddedContent} numberOfLines={2}>
                                {post.original_post.content}
                            </Text>
                        ) : null}

                        {/* Show content card if it's a book/movie/music post */}
                        {(post.original_post.content_type === 'book' ||
                            post.original_post.content_type === 'movie' ||
                            post.original_post.content_type === 'music') && post.original_post.image_url && (
                                <View style={[styles.bookCard, { marginBottom: 8, marginTop: 8 }]}>
                                    <Image
                                        source={{ uri: ensureHttps(post.original_post.image_url) }}
                                        style={[styles.bookCover, { width: 50, height: 75 }]}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.bookInfo}>
                                        <Text style={[styles.bookTitle, { fontSize: 14 }]} numberOfLines={1}>
                                            {post.original_post.source || 'Başlık Yok'}
                                        </Text>
                                        <Text style={[styles.bookAuthor, { fontSize: 12 }]} numberOfLines={1}>
                                            {post.original_post.author || 'Bilinmeyen'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                        {/* Show quote if exists */}
                        {post.original_post.quote_text && (
                            <View style={[styles.quoteBox, { padding: 10, marginTop: 4 }]}>
                                <Text style={[styles.quoteText, { fontSize: 13 }]} numberOfLines={3}>
                                    "{post.original_post.quote_text}"
                                </Text>
                            </View>
                        )}

                        {/* Fallback: Show image only if no content_type but has image */}
                        {!post.original_post.content_type && post.original_post.image_url && (
                            <Image
                                source={{ uri: ensureHttps(post.original_post.image_url) }}
                                style={styles.embeddedImage}
                                resizeMode="cover"
                            />
                        )}
                    </TouchableOpacity>
                )}



                {/* Interactions Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                        <Heart
                            size={18}
                            color={localIsLiked ? interactionColors.like : interactionColors.inactive}
                            fill={localIsLiked ? interactionColors.like : 'transparent'}
                        />
                        <Text style={[styles.actionText, { color: localIsLiked ? interactionColors.like : interactionColors.inactive }]}>
                            {localLikeCount || 0}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
                        <MessageCircle size={18} color={interactionColors.comment} />
                        <Text style={[styles.actionText, { color: interactionColors.inactive }]}>
                            {displayPost.comment_count || 0}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={handleRepost}>
                        <Repeat size={18} color={displayPost.is_reposted ? interactionColors.repost : interactionColors.inactive} />
                        <Text style={[styles.actionText, { color: displayPost.is_reposted ? interactionColors.repost : interactionColors.inactive }]}>
                            {displayPost.repost_count || 0}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                        <Bookmark
                            size={18}
                            color={(isSaved !== undefined ? isSaved : post.is_saved) ? theme.colors.primary : interactionColors.inactive}
                            fill={(isSaved !== undefined ? isSaved : post.is_saved) ? theme.colors.primary : 'transparent'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onShare && onShare()}>
                        <ShareIcon size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Internal Repost Menu */}
                {!onRepost && (
                    <RepostMenu
                        visible={internalRepostMenuVisible}
                        onClose={() => setInternalRepostMenuVisible(false)}
                        onDirectRepost={() => interactions.handleDirectRepost(post, () => setInternalRepostMenuVisible(false))}
                        onQuoteRepost={() => interactions.handleQuoteRepost(post, () => setInternalRepostMenuVisible(false))}
                        isReposted={!!isAlreadyReposted}
                    />
                )}
            </Card>
        </TouchableOpacity>
    );
};

// React.memo ile sarmalayarak gereksiz re-render'ları önlüyoruz
export const PostCard = React.memo(PostCardComponent, (prevProps, nextProps) => {
    // Shallow comparison for critical props
    // true döndürürse: re-render YAPILMAZ (props aynı)
    // false döndürürse: re-render YAPILIR (props farklı)
    const prevPost = prevProps.post;
    const nextPost = nextProps.post;

    // Temel post kontrolü
    if (prevPost.id !== nextPost.id) return false;

    // Etkileşim durumları
    if (prevPost.is_liked !== nextPost.is_liked) return false;
    if (prevPost.like_count !== nextPost.like_count) return false;
    if (prevPost.is_saved !== nextPost.is_saved) return false;
    if (prevPost.is_reposted !== nextPost.is_reposted) return false;
    if (prevPost.repost_count !== nextPost.repost_count) return false;
    if (prevPost.comment_count !== nextPost.comment_count) return false;

    // isSaved prop kontrolü
    if (prevProps.isSaved !== nextProps.isSaved) return false;

    // original_post kontrolü (repost durumları için)
    if (prevPost.original_post?.is_liked !== nextPost.original_post?.is_liked) return false;
    if (prevPost.original_post?.like_count !== nextPost.original_post?.like_count) return false;

    return true;
});
