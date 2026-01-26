import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { QuoteCard } from './QuoteCard';

interface RepostPreviewProps {
    post: any;
}

export const RepostPreview: React.FC<RepostPreviewProps> = ({ post }) => {
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        quotePreview: {
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 12,
        },
        originalPostContainer: {
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            overflow: 'hidden',
        },
        paddingContainer: {
            padding: 12
        },
        userInfoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8
        },
        avatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            marginRight: 8
        },
        avatarPlaceholder: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
        },
        avatarLetter: {
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold'
        },
        userName: {
            fontWeight: 'bold',
            color: theme.colors.text,
            fontSize: 14
        },
        userHandle: {
            color: theme.colors.textSecondary,
            fontSize: 12
        },
        commentText: {
            color: theme.colors.text,
            fontSize: 14,
            marginBottom: 8,
            lineHeight: 20
        }
    }), [theme]);

    // Content Parsing Logic
    // FIX: İnceleme ve Alıntı ayrımı iyileştirildi
    let displayComment = '';
    let displayQuote = '';

    // 1. Yeni veri yapısı
    if (post.quote_text != null || post.comment_text != null) {
        displayQuote = post.quote_text || '';
        displayComment = post.comment_text || '';
    } else if (post.content) {
        // 2. Eski veri yapısı veya fallback
        try {
            if (post.content.startsWith('{')) {
                const parsed = JSON.parse(post.content);
                if (parsed.quote !== undefined) {
                    displayComment = parsed.comment || '';
                    displayQuote = parsed.quote || '';
                } else {
                    displayComment = post.content;
                }
            } else {
                // Düz metin
                const isMediaPost = post.content_type === 'book' ||
                    post.content_type === 'movie' ||
                    post.content_type === 'music';

                if (isMediaPost && !post.title) {
                    displayQuote = post.content;
                } else {
                    displayComment = post.content;
                }
            }
        } catch (e) {
            displayComment = post.content;
        }
    }

    return (
        <View style={styles.quotePreview}>
            <View style={styles.originalPostContainer}>
                <View style={styles.paddingContainer}>
                    <View style={styles.userInfoContainer}>
                        {post.user.avatar_url ? (
                            <Image source={{ uri: post.user.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarLetter}>
                                    {post.user.username ? post.user.username.charAt(0).toUpperCase() : '?'}
                                </Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.userName}>
                                {post.user.full_name || post.user.username}
                            </Text>
                            <Text style={styles.userHandle}>
                                @{post.user.username}
                            </Text>
                        </View>
                    </View>

                    {displayComment ? (
                        <Text style={styles.commentText}>
                            {displayComment}
                        </Text>
                    ) : null}

                    {(displayQuote || (post.content_type === 'book' || post.content_type === 'movie' || post.content_type === 'music')) && (
                        <QuoteCard
                            text={displayQuote}
                            source={post.source === 'Paylaşım' ? 'Gönderi' : post.source}
                            author={post.author !== post.user.username ? post.author : undefined}
                            variant="compact"
                            imageUrl={post.image_url}
                            status={post.content_type === 'book' ? 'Kitabı okuyor' : undefined}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};
