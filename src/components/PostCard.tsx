import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import { QuoteCard } from './QuoteCard';

interface PostCardProps {
    post: any;
    onPress?: () => void;
    onLike?: () => void;
    onComment?: () => void;
    onDelete?: () => void;
    onRepost?: () => void;
    onUserPress?: (userId?: number) => void;
    onReposterPress?: () => void;
    currentUserId?: number;
    onContentPress?: (type: 'book' | 'movie', id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    onPress,
    onLike,
    onComment,
    onDelete,
    onRepost,
    onUserPress,
    onReposterPress,
    currentUserId,
    onContentPress
}) => {
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface, // Changed from transparent to surface for better layering
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
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            flexWrap: 'wrap',
        },
        name: {
            fontWeight: '700',
            fontSize: 15,
            color: theme.colors.text,
            marginRight: 4,
        },
        username: {
            color: theme.colors.textSecondary,
            fontSize: 14,
            marginRight: 4,
        },
        dot: {
            color: theme.colors.textSecondary,
            fontSize: 14,
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
            marginBottom: 8,
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
            borderWidth: 2, // Thicker border
            borderColor: theme.colors.primary, // Button color
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

    // Alıntı kontrolü:
    // 1. Repost olmalı
    // 2. Orijinal post verisi olmalı
    // 3. İçerik 'Yeniden paylaşım' (varsayılan) olmamalı VE orijinal içerikle aynı olmamalı
    // (Eğer içerik orijinalle aynıysa, eski mantıkla oluşturulmuş bir 'Direct Repost' kabul ediyoruz)
    const isQuoteRepost = isRepost && post.original_post &&
        post.content !== 'Yeniden paylaşım' &&
        post.content !== post.original_post.content;

    // İçerik Ayrıştırma (JSON vs Plain Text vs New Columns)
    let displayComment = '';
    let displayQuote = '';

    // 1. Yeni Sütunlar (Varsa öncelikli)
    if (post.quote_text != null || post.comment_text != null) {
        displayQuote = post.quote_text || '';
        displayComment = post.comment_text || '';
    }

    // 2. Fallback: Content Parsing (Eğer yeni sütunlar boşsa veya null ise)
    if (!displayQuote && !displayComment && post.content) {
        try {
            // Try to parse content as JSON (new format)
            if (post.content.startsWith('{')) {
                const parsed = JSON.parse(post.content);
                if (parsed.quote !== undefined) {
                    displayComment = parsed.comment;
                    displayQuote = parsed.quote;
                } else {
                    // Fallback for non-standard JSON
                    displayQuote = post.content;
                }
            } else {
                // Legacy format (Plain text)
                // If it's a content post (book/movie/music) OR has a specific source, the content was the quote
                if (post.content_type === 'book' || post.content_type === 'movie' || post.content_type === 'music' || (post.source && post.source !== 'Paylaşım' && post.source !== 'App' && post.source !== 'Düşünce')) {
                    displayQuote = post.content;
                } else {
                    // For thoughts or other types, it's the main content
                    displayComment = post.content;
                }
            }
        } catch (e) {
            // Not JSON, treat as plain text
            if (post.content_type === 'book' || post.content_type === 'movie' || post.content_type === 'music' || (post.source && post.source !== 'Paylaşım' && post.source !== 'App' && post.source !== 'Düşünce')) {
                displayQuote = post.content;
            } else {
                displayComment = post.content;
            }
        }
    }

    // Görüntülenecek Post (İçerik için)
    // Quote Repost ise: Post'un kendisi (çünkü yorumu var)
    // Direct Repost ise: Orijinal post (çünkü sadece onu gösteriyoruz)
    const displayPost = isQuoteRepost ? post : (isRepost && post.original_post ? post.original_post : post);

    // Repost durumunda orijinal içeriği de ayrıştır
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

    // Görüntülenecek Yazar
    // Quote Repost ise: Post sahibi (Reposter)
    // Direct Repost ise: Orijinal post sahibi
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

    // Alıntı Kartı Gösterimi (İçerik içindeki kutu)
    // Quote Repost ise: Orijinal postu kutu içinde göster
    // Normal Post ise ve source varsa: Kaynağı kutu içinde göster
    const showQuoteCard = isQuoteRepost || (displayPost.source && displayPost.source !== 'Paylaşım' && displayPost.source !== 'App' && displayPost.source !== 'Düşünce');

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
                            <Text style={styles.username} numberOfLines={1}>
                                @{displayUser.username}
                            </Text>
                            <Text style={styles.dot}>·</Text>
                            <Text style={styles.time}>
                                {new Date(post.created_at || Date.now()).toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        {currentUserId && post.user && currentUserId === post.user.id && onDelete && (
                            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Icon name="trash" size={14} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {displayComment ? (
                        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                            <Text style={[styles.content, (displayPost.content_type === 'book' || displayPost.content_type === 'movie' || displayPost.content_type === 'music') && { marginBottom: 8 }]}>{displayComment}</Text>
                        </TouchableOpacity>
                    ) : null}

                    {showQuoteCard && (
                        <View style={{ marginTop: 0, marginBottom: 8 }}>
                            {isQuoteRepost ? (
                                <View style={styles.socialQuoteContainer}>
                                    <TouchableOpacity onPress={() => onContentPress && post.original_post.content_id ? null : (onPress && onPress())} activeOpacity={0.9}>
                                        <View style={styles.socialQuoteHeader}>
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
                                                    {new Date(post.original_post.created_at || Date.now()).toLocaleDateString()}
                                                </Text>
                                            </View>
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
                            <Icon name="bubble" size={16} color={theme.colors.primary} style={styles.actionIcon} />
                            <Text style={styles.actionCount}>{displayPost.comment_count || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onRepost}>
                            <Icon
                                name="loop"
                                size={16}
                                color={theme.colors.primary}
                                style={styles.actionIcon}
                            />
                            <Text style={[styles.actionCount, displayPost.is_reposted && styles.repostedText]}>
                                {displayPost.repost_count || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                            <Icon
                                name={displayPost.is_liked ? "heart" : "heart"}
                                size={16}
                                color={theme.colors.primary}
                                style={styles.actionIcon}
                            />
                            <Text style={[styles.actionCount, displayPost.is_liked && styles.likedText]}>
                                {displayPost.like_count || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Icon name="share" size={16} color={theme.colors.primary} style={styles.actionIcon} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};


