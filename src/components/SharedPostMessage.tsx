import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Repeat } from 'lucide-react-native';

interface SharedPostMessageProps {
    post: any;
    comment?: string;
    isMyMessage: boolean;
}

export const SharedPostMessage: React.FC<SharedPostMessageProps> = ({ post, comment, isMyMessage }) => {
    const { theme } = useTheme();
    const navigation = useNavigation();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            width: '100%',
        },
        card: {
            backgroundColor: isMyMessage ? 'rgba(0,0,0,0.15)' : theme.colors.surface,
            borderRadius: 12,
            padding: 10,
            borderWidth: 1,
            borderColor: isMyMessage ? 'rgba(255,255,255,0.1)' : theme.colors.border,
            marginBottom: comment ? 8 : 0,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        avatar: {
            width: 18,
            height: 18,
            borderRadius: 9,
            marginRight: 6,
        },
        avatarPlaceholder: {
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: theme.colors.secondary,
            marginRight: 6,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarText: {
            fontSize: 9,
            color: '#fff',
            fontWeight: 'bold',
        },
        username: {
            fontSize: 12,
            fontWeight: '600',
            color: isMyMessage ? '#fff' : theme.colors.text,
            opacity: 0.9,
        },

        // Content Layout styles
        contentRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        coverImage: {
            width: 60,
            height: 90,
            borderRadius: 6,
            backgroundColor: theme.colors.background,
        },
        textContainer: {
            flex: 1,
            marginLeft: 10,
            justifyContent: 'center',
        },

        // Text styles
        content: {
            fontSize: 13,
            color: isMyMessage ? 'rgba(255,255,255,0.95)' : theme.colors.text,
            lineHeight: 18,
            marginBottom: 4,
        },
        quoteContainer: {
            marginBottom: 4,
        },
        quoteText: {
            fontSize: 13,
            fontStyle: 'italic',
            color: isMyMessage ? 'rgba(255,255,255,0.9)' : theme.colors.text,
            lineHeight: 18,
        },
        sourceText: {
            fontSize: 11,
            color: isMyMessage ? 'rgba(255,255,255,0.6)' : theme.colors.textSecondary,
            marginTop: 2,
        },

        commentText: {
            fontSize: 14,
            color: isMyMessage ? '#fff' : theme.colors.text,
            marginTop: 4,
        },
    }), [theme, isMyMessage]);

    // Logic adapted from PostCard.tsx to handle Reposts correctly
    const isRepost = !!post.original_post_id || post.is_reposted;
    const isQuoteRepost = isRepost && post.original_post &&
        post.content !== 'Yeniden paylaşım' &&
        post.content !== post.original_post.content;

    // Use original post for display if it's a pure repost
    const displayPost = (isRepost && !isQuoteRepost && post.original_post) ? post.original_post : post;

    // User to show in Avatar/Name section
    const displayUser = displayPost.user || displayPost.author || {};
    const username = displayUser.username || displayPost.author || 'Kullanıcı';
    const avatarUrl = displayUser.avatar_url;

    // Reposter info (if pure repost)
    const reposterName = post.user ? (post.user.full_name || post.user.username) : '';

    // Content extraction from the DISPLAY post extraction
    let postContent = displayPost.content || '';
    const quoteText = displayPost.quote_text;
    const quoteSource = displayPost.source;
    const imageUrl = displayPost.image_url;

    // If content is exactly the same as quote_text, hide content to avoid duplication
    if (postContent === quoteText) {
        postContent = null;
    }

    const handlePress = () => {
        (navigation as any).navigate('PostDetail', { postId: displayPost.id || displayPost.original_post_id });
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                <View style={styles.card}>
                    {/* Header: Repost Indicator */}
                    {isRepost && !isQuoteRepost && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, opacity: 0.8 }}>
                            <Repeat size={11} color={isMyMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: isMyMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }}>
                                {reposterName} yeniden gönderdi
                            </Text>
                        </View>
                    )}

                    {/* Main Header: User Info */}
                    <View style={styles.header}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <Text style={styles.username}>@{username}</Text>
                    </View>

                    {/* User Content - Moved above media/quote */}
                    {postContent && (
                        <Text style={[styles.content, { marginBottom: 8 }]} numberOfLines={6}>
                            {postContent}
                        </Text>
                    )}

                    {/* Main Content Row (Media + Quote) */}
                    {(imageUrl || quoteText) && (
                        <View style={styles.contentRow}>
                            {/* Left Side: Image (if exists) */}
                            {imageUrl && (
                                <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
                            )}

                            {/* Right Side: Quote/Source */}
                            <View style={[styles.textContainer, !imageUrl && { marginLeft: 0 }]}>
                                {/* Quote Section */}
                                {quoteText && (
                                    <View style={styles.quoteContainer}>
                                        <Text style={styles.quoteText} numberOfLines={4}>
                                            "{quoteText}"
                                        </Text>
                                        {(quoteSource || post.author_name) && (
                                            <Text style={styles.sourceText} numberOfLines={1}>
                                                - {post.author_name ? post.author_name : ''} {quoteSource ? `(${quoteSource})` : ''}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {comment ? (
                <Text style={styles.commentText}>{comment}</Text>
            ) : null}
        </View>
    );
};
