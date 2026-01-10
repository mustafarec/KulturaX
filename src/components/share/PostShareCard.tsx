import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Share2, User, Film, BookOpen, Music, Calendar } from 'lucide-react-native';
import { getStyles } from '../styles/ShareCardModal.styles';
import { ContentType } from '../../types/models';

interface PostShareCardProps {
    postContent?: string;
    postAuthor?: string;
    postAuthorAvatar?: string;
    quoteText?: string;
    // Repost/Quote props
    isQuoteRepost?: boolean;
    repostedBy?: string;
    originalPostContent?: string;
    originalPostAuthor?: string;
    originalPostAuthorAvatar?: string;
    originalQuoteText?: string;
    // Content props (for embedded content)
    contentType?: ContentType;
    title?: string;
    coverUrl?: string;
}

export const PostShareCard: React.FC<PostShareCardProps> = ({
    postContent,
    postAuthor,
    postAuthorAvatar,
    quoteText,
    isQuoteRepost,
    repostedBy,
    originalPostContent,
    originalPostAuthor,
    originalPostAuthorAvatar,
    originalQuoteText,
    contentType,
    title,
    coverUrl,
}) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const cardTextSecondary = theme.colors.textSecondary;
    const accentColor = theme.colors.primary;
    const avatarPlaceholderBg = theme.dark ? '#333' : '#E5E5E5';

    const getContentIcon = () => {
        switch (contentType) {
            case 'movie': return Film;
            case 'music': return Music;
            case 'event': return Calendar;
            default: return BookOpen;
        }
    };

    const ContentIcon = getContentIcon();

    // Nested Repost (Quote Repost logic)
    if (isQuoteRepost) {
        return (
            <View style={styles.postCard}>
                {/* 1. Reposter Header */}
                <View style={styles.postAuthorRow}>
                    {postAuthorAvatar ? (
                        <Image source={{ uri: postAuthorAvatar }} style={styles.postAvatar} />
                    ) : (
                        <View style={[styles.postAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                            <User size={24} color={cardTextSecondary} />
                        </View>
                    )}
                    <View>
                        <Text style={styles.postAuthorName}>{postAuthor || 'Anonim'}</Text>
                        <Text style={styles.repostLabel}>yeniden paylaştı</Text>
                    </View>
                </View>

                {/* 2. Reposter's comment (if any) */}
                {postContent && postContent !== 'Yeniden paylaşım' && (
                    <Text style={styles.postText} numberOfLines={3}>{postContent}</Text>
                )}

                {/* 3. Original post nested card */}
                <View style={styles.originalPostCard}>
                    {/* Original post author */}
                    <View style={styles.originalPostAuthorRow}>
                        {originalPostAuthorAvatar ? (
                            <Image source={{ uri: originalPostAuthorAvatar }} style={styles.originalPostAvatar} />
                        ) : (
                            <View style={[styles.originalPostAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                                <User size={16} color={cardTextSecondary} />
                            </View>
                        )}
                        <Text style={styles.originalPostAuthorName}>{originalPostAuthor || 'Anonim'}</Text>
                    </View>

                    {/* Original post comment/content */}
                    {originalPostContent && (
                        <Text style={styles.originalPostText} numberOfLines={3}>{originalPostContent}</Text>
                    )}

                    {/* Content card with cover inside nested card */}
                    {coverUrl && title && (
                        <View style={styles.originalContentCard}>
                            <Image
                                source={{ uri: coverUrl }}
                                style={styles.originalContentCover}
                                resizeMode="cover"
                            />
                            <View style={styles.contentInfo}>
                                <View style={styles.typeLabel}>
                                    <ContentIcon size={10} color={accentColor} />
                                    <Text style={[styles.typeLabelText, { fontSize: 9 }]}>{contentType === 'movie' ? 'Film' : contentType === 'music' ? 'Müzik' : 'Kitap'}</Text>
                                </View>
                                <Text style={[styles.contentTitle, { fontSize: 12 }]} numberOfLines={2}>{title}</Text>
                            </View>
                        </View>
                    )}

                    {/* Quote box inside nested card */}
                    {originalQuoteText && (
                        <View style={styles.originalQuoteBox}>
                            <Text style={styles.originalPostQuote} numberOfLines={3}>"{originalQuoteText}"</Text>
                        </View>
                    )}
                </View>

                <View style={styles.branding}>
                    <Text style={styles.brandingText}>📱 KültüraX</Text>
                </View>
            </View>
        );
    }

    // Normal post card (or Simple Repost)
    return (
        <View style={styles.postCard}>
            {/* Reposted By Label */}
            {repostedBy && (
                <View style={styles.repostedByContainer}>
                    <Share2 size={12} color={cardTextSecondary} />
                    <Text style={styles.repostedByText}>{repostedBy} yeniden paylaştı</Text>
                </View>
            )}

            {/* 1. Author Header (Original Author if Repost) */}
            <View style={styles.postAuthorRow}>
                {postAuthorAvatar ? (
                    <Image source={{ uri: postAuthorAvatar }} style={styles.postAvatar} />
                ) : (
                    <View style={[styles.postAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                        <User size={24} color={cardTextSecondary} />
                    </View>
                )}
                <Text style={styles.postAuthorName}>{postAuthor || 'Anonim'}</Text>
            </View>

            {/* 2. Comment/Content Text (user's comment) */}
            {postContent && (
                <Text style={styles.postText} numberOfLines={4}>{postContent}</Text>
            )}

            {/* 3. Content Card (cover + title + author) */}
            {coverUrl && title && (
                <View style={styles.contentCard}>
                    <Image
                        source={{ uri: coverUrl }}
                        style={styles.contentCover}
                        resizeMode="cover"
                    />
                    <View style={styles.contentInfo}>
                        <View style={styles.typeLabel}>
                            <ContentIcon size={12} color={accentColor} />
                            <Text style={styles.typeLabelText}>{contentType === 'movie' ? 'Film' : contentType === 'music' ? 'Müzik' : 'Kitap'}</Text>
                        </View>
                        <Text style={styles.contentTitle} numberOfLines={2}>{title}</Text>
                    </View>
                </View>
            )}

            {/* 4. Quote Box (if quote exists) */}
            {quoteText && (
                <View style={styles.quoteBox}>
                    <Text style={styles.postQuote} numberOfLines={4}>"{quoteText}"</Text>
                </View>
            )}

            {/* Branding */}
            <View style={styles.branding}>
                <Text style={styles.brandingText}>📱 KültüraX</Text>
            </View>
        </View>
    );
};
