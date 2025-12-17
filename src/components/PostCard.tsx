import React from 'react';
import { formatRelativeTime } from '../utils/dateUtils';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { QuoteCard } from './QuoteCard';

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
}

export const PostCard: React.FC<PostCardProps> = ({
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
    onShare
}) => {
    const { theme } = useTheme();



    const optionsButtonRef = React.useRef<any>(null);

    const handleOptionsPress = () => {
        if (onOptions && optionsButtonRef.current) {
            optionsButtonRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                onOptions({ x: px, y: py, width, height });
            });
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        repostHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
            marginLeft: 42,
        },
        pinnedHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
            marginLeft: 42,
        },
        repostText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        cardContent: {
            flexDirection: 'row',
        },
        avatarContainer: {
            marginRight: 12,
            alignSelf: 'flex-start',
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        avatarPlaceholder: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarText: {
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 18,
        },
        mainContent: {
            flex: 1,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
        },
        userInfo: {
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            marginLeft: 0,
        },
        userInfoRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        name: {
            fontWeight: '700',
            fontSize: 15,
            color: theme.colors.text,
            marginBottom: 2,
        },
        username: {
            color: (theme as any).id === 'dim' ? '#D6D3D1' : theme.colors.textSecondary,
            fontSize: 13,
            marginRight: 4,
            fontWeight: '400',
        },
        dot: {
            color: theme.colors.textSecondary,
            fontSize: 13,
            marginRight: 4,
        },
        time: {
            color: theme.colors.textSecondary,
            fontSize: 13,
        },
        content: {
            fontSize: 15,
            color: theme.colors.text,
            lineHeight: 20,
            marginTop: 6, // Added space from header
            marginBottom: 4, // Reduced space to card
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingRight: 16,
            marginTop: 4,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 4,
        },
        actionIcon: {
            marginRight: 6,
        },
        actionCount: {
            fontSize: 12,
            color: theme.colors.primary,
            fontWeight: '500',
        },
        likedText: {
            color: theme.colors.primary,
        },
        repostedText: {
            color: theme.colors.primary,
        },
        socialQuoteContainer: {
            borderWidth: 2,
            borderColor: theme.colors.primary,
            borderRadius: 12,
            padding: 12,
            marginTop: 4,
        },
        socialQuoteHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        socialQuoteAvatar: {
            width: 20,
            height: 20,
            borderRadius: 10,
            marginRight: 8,
        },
        socialQuoteAvatarPlaceholder: {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: theme.colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
        },
        socialQuoteAvatarText: {
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 10,
        },
        socialQuoteUserInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            flexWrap: 'wrap',
        },
        socialQuoteName: {
            fontWeight: '700',
            fontSize: 14,
            color: theme.colors.text,
            marginRight: 4,
        },
        socialQuoteUsername: {
            color: theme.colors.textSecondary,
            fontSize: 13,
            marginRight: 4,
        },
        socialQuoteDot: {
            color: theme.colors.textSecondary,
            fontSize: 13,
            marginRight: 4,
        },
        socialQuoteTime: {
            color: theme.colors.textSecondary,
            fontSize: 12,
        },
        socialQuoteContent: {
            fontSize: 14,
            color: theme.colors.text,
            lineHeight: 20,
        },
    }), [theme]);
    const isRepost = !!post.original_post_id;

    const isQuoteRepost = isRepost && post.original_post &&
        post.content !== 'Yeniden paylaşım' &&
        post.content !== post.original_post.content;

    const displayPost = isQuoteRepost ? post : (isRepost && post.original_post ? post.original_post : post);

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
            if (displayPost.content_type === 'book' || displayPost.content_type === 'movie' || displayPost.content_type === 'music' || (displayPost.source && displayPost.source !== 'Paylaşım' && displayPost.source !== 'App' && displayPost.source !== 'Düşünce')) {
                displayQuote = displayPost.content;
            } else {
                displayComment = displayPost.content;
            }
        }
    }

    let originalQuote = '';
    if (isRepost && post.original_post) {
        if (post.original_post.quote_text != null) {
            originalQuote = post.original_post.quote_text;
        } else {
            try {
                if (post.original_post.content && post.original_post.content.startsWith('{')) {
                    const parsed = JSON.parse(post.original_post.content);
                    originalQuote = parsed.quote || post.original_post.content;
                } else {
                    originalQuote = post.original_post.content;
                }
            } catch (e) {
                originalQuote = post.original_post.content;
            }
        }
    }

    let displayUser = post.user;
    if (isRepost && !isQuoteRepost) {
        if (post.original_post) {
            displayUser = post.original_post.user;
        } else if (post.author) {
            displayUser = {
                username: post.author,
                full_name: post.author,
                avatar_url: null
            };
        }
    }

    const showQuoteCard = isQuoteRepost || (displayPost.source && displayPost.source !== 'Paylaşım' && displayPost.source !== 'App' && displayPost.source !== 'Düşünce');

    // Custom Interaction Colors
    // Lights Out (Black) mode gets the special Cool Gray inactive color.
    // Light/Dim modes keep their textSecondary color to match the warm theme.
    // Active colors (Like/Repost) remain the new global defaults.
    const isBlackTheme = (theme as any).id === 'black';
    const interactionColors = {
        inactive: isBlackTheme ? '#9ca3af' : theme.colors.textSecondary,
        like: '#f91880',
        repost: '#22c55e',
        comment: '#EA9A65',
    };

    const likeColor = displayPost.is_liked ? interactionColors.like : interactionColors.inactive;
    const repostColor = displayPost.is_reposted ? interactionColors.repost : interactionColors.inactive;
    const commentColor = interactionColors.inactive; // Keeping inactive color (theme dependent)

    return (
        <View style={styles.container}>
            {isRepost && !isQuoteRepost && (
                <TouchableOpacity onPress={onReposterPress} style={styles.repostHeader}>
                    <Icon name="loop" size={12} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.repostText}>
                        {post.user.full_name || post.user.username} yeniden gönderdi
                    </Text>
                </TouchableOpacity>
            )}

            {(post.is_pinned === 1 || post.is_pinned === true || post.is_pinned === '1') && (
                <View style={styles.pinnedHeader}>
                    <Ionicons name="pricetag" size={12} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.repostText}>
                        Sabitlenmiş Gönderi
                    </Text>
                </View>
            )}

            <View style={styles.cardContent}>
                <TouchableOpacity onPress={() => onUserPress && onUserPress(displayUser.id)} style={styles.avatarContainer}>
                    {displayUser.avatar_url ? (
                        <Image source={{ uri: displayUser.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {displayUser.username ? displayUser.username.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.mainContent}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => onUserPress && onUserPress(displayUser.id)} style={styles.userInfo}>
                            <Text style={styles.name} numberOfLines={1}>
                                {displayUser.full_name || displayUser.username}
                            </Text>
                            <View style={styles.userInfoRow}>
                                <Text style={styles.username} numberOfLines={1}>
                                    @{displayUser.username}
                                </Text>
                                <Text style={styles.dot}>·</Text>
                                <Text style={styles.time}>
                                    {formatRelativeTime(post.created_at || Date.now())}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {onOptions && (
                            <TouchableOpacity
                                ref={optionsButtonRef}
                                onPress={handleOptionsPress}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {displayComment ? (
                        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                            <Text style={styles.content}>{displayComment}</Text>
                        </TouchableOpacity>
                    ) : null}

                    {showQuoteCard && (
                        <View style={{ marginTop: 0, marginBottom: 8 }}>
                            {isQuoteRepost ? (
                                <View style={styles.socialQuoteContainer}>
                                    <TouchableOpacity onPress={() => onContentPress && post.original_post.content_id ? null : (onPress && onPress())} activeOpacity={0.9}>
                                        <View style={styles.socialQuoteHeader}>
                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                                                onPress={() => onUserPress && onUserPress(post.original_post.user.id)}
                                            >
                                                {post.original_post.user.avatar_url ? (
                                                    <Image source={{ uri: post.original_post.user.avatar_url }} style={styles.socialQuoteAvatar} />
                                                ) : (
                                                    <View style={styles.socialQuoteAvatarPlaceholder}>
                                                        <Text style={styles.socialQuoteAvatarText}>
                                                            {post.original_post.user.username ? post.original_post.user.username.charAt(0).toUpperCase() : '?'}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={styles.socialQuoteUserInfo}>
                                                    <Text style={styles.socialQuoteName} numberOfLines={1}>
                                                        {post.original_post.user.full_name || post.original_post.user.username}
                                                    </Text>
                                                    <Text style={styles.socialQuoteUsername} numberOfLines={1}>
                                                        @{post.original_post.user.username}
                                                    </Text>
                                                    <Text style={styles.socialQuoteDot}>·</Text>
                                                    <Text style={styles.socialQuoteTime}>
                                                        {formatRelativeTime(post.original_post.created_at || Date.now())}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>

                                        {post.original_post.content ? (
                                            <Text style={styles.socialQuoteContent}>{post.original_post.content.startsWith('{') ? (JSON.parse(post.original_post.content).comment || '') : post.original_post.content}</Text>
                                        ) : null}
                                    </TouchableOpacity>

                                    {(post.original_post.content_type === 'book' || post.original_post.content_type === 'movie' || post.original_post.content_type === 'music') && (
                                        <QuoteCard
                                            text={originalQuote}
                                            source={post.original_post.source}
                                            author={post.original_post.author}
                                            variant="compact"
                                            imageUrl={post.original_post.image_url}
                                            status={post.original_post.content_type === 'book' ? 'Kitabı okuyor' : undefined}
                                            onPress={() => {
                                                if (onContentPress && post.original_post.content_id) {
                                                    onContentPress(post.original_post.content_type, post.original_post.content_id);
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            ) : (
                                <QuoteCard
                                    // Normal post (Direct share)
                                    text={displayQuote}
                                    source={displayPost.source === 'Paylaşım' ? 'Gönderi' : displayPost.source}
                                    author={displayPost.author}
                                    variant="compact"
                                    imageUrl={displayPost.image_url}
                                    status={displayPost.content_type === 'book' ? 'Kitabı okuyor' : undefined}
                                    onPress={() => {
                                        if (onContentPress && displayPost.content_id) {
                                            onContentPress(displayPost.content_type, displayPost.content_id);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    )}



                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                            <Icon name="bubble" size={16} color={commentColor} style={styles.actionIcon} />
                            <Text style={[styles.actionCount, { color: interactionColors.inactive }]}>{displayPost.comment_count || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onRepost}>
                            <Icon
                                name="loop"
                                size={16}
                                color={repostColor}
                                style={styles.actionIcon}
                            />
                            <Text style={[styles.actionCount, { color: displayPost.is_reposted ? repostColor : interactionColors.inactive }]}>
                                {displayPost.repost_count || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                            <Icon
                                name={displayPost.is_liked ? "heart" : "heart"}
                                size={16}
                                color={likeColor}
                                style={styles.actionIcon}
                            />
                            <Text style={[styles.actionCount, { color: displayPost.is_liked ? likeColor : interactionColors.inactive }]}>
                                {displayPost.like_count || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                            {/* Share button placeholder, keeping it generic or maybe user wants save here. Let's add Save next to it. */}
                            <Icon name="share" size={16} color={interactionColors.inactive} style={styles.actionIcon} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
                            <Ionicons
                                name={isSaved ? "bookmark" : "bookmark-outline"}
                                size={16}
                                color={isSaved ? theme.colors.primary : interactionColors.inactive}
                                style={styles.actionIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};
