import React, { useState } from 'react';
import { formatRelativeTime } from '../utils/dateUtils';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Repeat, MoreVertical, Heart, MessageCircle, Share, Bookmark, Quote, BookOpen } from 'lucide-react-native';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { usePostInteractions, PostUpdateFn } from '../hooks/usePostInteractions';
import { RepostMenu } from './RepostMenu';

interface PostCardProps {
    post: any;
    onPress?: () => void;
    onLike?: () => void;
    onComment?: () => void;
    onOptions?: (position: { x: number, y: number, width: number, height: number }) => void;
    onRepost?: () => void;
    onUserPress?: (userId?: number) => void;
    onReposterPress?: () => void;
    currentUserId?: number;
    onContentPress?: (type: 'book' | 'movie', id: string) => void;
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
    const optionsButtonRef = React.useRef<any>(null);
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
    const [localLikeCount, setLocalLikeCount] = useState(parseInt(displayPost.like_count || '0', 10));

    // Prop değişirse local state'i güncelle (örn: başka bir yerden beğenilirse)
    React.useEffect(() => {
        setLocalIsLiked(!!displayPost.is_liked);
        setLocalLikeCount(parseInt(displayPost.like_count || '0', 10));
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

    let displayComment = '';
    let displayQuote = '';

    if (displayPost.quote_text != null || displayPost.comment_text != null) {
        displayQuote = displayPost.quote_text || '';
        displayComment = displayPost.comment_text || '';
    }

    if (!displayQuote && !displayComment && displayPost.content) {
        try {
            if (displayPost.content.startsWith('{')) {
                const parsed = JSON.parse(displayPost.content);
                if (parsed.quote !== undefined) {
                    displayComment = parsed.comment;
                    displayQuote = parsed.quote;
                } else {
                    displayQuote = displayPost.content;
                }
            } else {
                if (displayPost.content_type === 'book' || displayPost.content_type === 'movie' || displayPost.content_type === 'music' || (displayPost.source && displayPost.source !== 'Paylaşım' && displayPost.source !== 'App' && displayPost.source !== 'Düşünce')) {
                    displayQuote = displayPost.content;
                } else {
                    displayComment = displayPost.content;
                }
            }
        } catch (e) {
            // Fallback logic
            if (displayPost.content_type === 'book' || displayPost.content_type === 'movie' || displayPost.content_type === 'music' || (displayPost.source && displayPost.source !== 'Paylaşım' && displayPost.source !== 'App' && displayPost.source !== 'Düşünce')) {
                displayQuote = displayPost.content;
            } else {
                displayComment = displayPost.content;
            }
        }
    }

    let displayUser = post.user;
    if (isRepost && !isQuoteRepost) {
        if (post.original_post) {
            displayUser = post.original_post.user;
        } else if (post.author) {
            displayUser = { username: post.author, full_name: post.author, avatar_url: null };
        }
    }

    const styles = StyleSheet.create({
        container: {
            marginBottom: theme.spacing.m,
            borderBottomWidth: 0,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.s,
            paddingRight: 20,
        },
        optionsButton: {
            position: 'absolute',
            top: 12, // Aligned with typical padding
            right: 12,
            zIndex: 10,
            padding: 4,
        },
        userInfo: {
            flex: 1,
            marginLeft: theme.spacing.s,
        },
        name: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            fontFamily: 'Roboto-Regular',
        },
        meta: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 2,
            flexWrap: 'wrap',
        },
        username: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        dot: {
            marginHorizontal: 4,
            color: theme.colors.textSecondary,
            fontSize: 10,
        },
        time: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        content: {
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
            fontFamily: theme.fonts.main,
        },
        bookCard: {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            flexDirection: 'row',
            marginBottom: theme.spacing.m,
        },
        bookCover: {
            width: 60,
            height: 90,
            borderRadius: theme.borderRadius.s,
            backgroundColor: theme.colors.secondary,
        },
        bookInfo: {
            flex: 1,
            marginLeft: theme.spacing.m,
            justifyContent: 'center',
        },
        bookTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.primary,
            fontFamily: theme.fonts.headings || theme.fonts.main,
            marginBottom: 4,
        },
        bookAuthor: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        quoteBox: {
            backgroundColor: theme.colors.background,
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.primary,
            padding: theme.spacing.m,
            borderRadius: theme.borderRadius.s,
            marginBottom: theme.spacing.m,
        },
        quoteText: {
            fontSize: 16,
            fontStyle: 'italic',
            color: theme.colors.text,
            fontFamily: theme.fonts.quote || theme.fonts.main,
            lineHeight: 24,
        },
        embeddedPostContainer: {
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            marginTop: 12,
            marginBottom: 12,
            backgroundColor: theme.colors.surface,
        },
        embeddedHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        embeddedAvatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.border,
            marginRight: 8,
        },
        embeddedName: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        embeddedUsername: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        embeddedContent: {
            fontSize: 14,
            color: theme.colors.text,
            marginBottom: 8,
        },
        embeddedImage: {
            width: '100%',
            height: 150,
            borderRadius: 8,
            marginTop: 8,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: theme.spacing.s,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        actionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
        },
        actionText: {
            fontSize: 13,
            marginLeft: 6,
            fontWeight: '500',
        }
    });

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
                                        {post.topic_name || (post.original_post && post.original_post.topic_name)}
                                    </Badge>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>

            </View>

            {/* Content Text */}
            {displayComment ? (
                <TouchableOpacity onPress={onPress}>
                    <Text style={styles.content}>{displayComment}</Text>
                </TouchableOpacity>
            ) : null}

            {/* Book Info Card (Always shown if it's a book/movie post) */}
            {(displayPost.content_type === 'book' || displayPost.content_type === 'movie') && (
                <View style={{ marginBottom: theme.spacing.m }}>
                    {/* Book Details */}
                    <TouchableOpacity
                        style={styles.bookCard}
                        onPress={() => handleContent(displayPost.content_type, displayPost.content_id)}
                    >
                        <Image
                            source={{ uri: displayPost.image_url || 'https://via.placeholder.com/150' }}
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
                            <TouchableOpacity onPress={onPress}>
                                <Text style={styles.quoteText}>"{displayQuote}"</Text>
                            </TouchableOpacity>

                        </View>
                    ) : null}
                </View>
            )}

            {/* Fallback for other content types (Music, etc.) or just image posts */}
            {!(displayPost.content_type === 'book' || displayPost.content_type === 'movie') && displayPost.image_url && (
                <TouchableOpacity
                    style={styles.bookCard}
                    onPress={() => handleContent(displayPost.content_type, displayPost.content_id)}
                >
                    <Image
                        source={{ uri: displayPost.image_url || 'https://via.placeholder.com/150' }}
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
                    <TouchableOpacity onPress={onPress}>
                        <Text style={styles.quoteText}>"{displayQuote}"</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Embedded Post for Quote Reposts */}
            {isQuoteRepost && post.original_post && (
                <TouchableOpacity
                    style={[styles.embeddedPostContainer, { borderColor: theme.colors.border }]}
                    onPress={() => {
                        if (post.original_post && handleContent && post.original_post.content_type && post.original_post.content_id) {
                            handleContent(post.original_post.content_type, post.original_post.content_id);
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
                            source={{ uri: post.original_post.user.avatar_url || 'https://via.placeholder.com/50' }}
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
                                    source={{ uri: post.original_post.image_url }}
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
                            source={{ uri: post.original_post.image_url }}
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

                <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
                    <Share size={18} color={interactionColors.inactive} />
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
