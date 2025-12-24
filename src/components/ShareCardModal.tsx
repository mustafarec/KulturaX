import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, Share2, Film, BookOpen, Music, Calendar, Star, MessageSquare, User, Quote } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

type ShareType = 'content' | 'post' | 'profile';
type ContentType = 'book' | 'movie' | 'music' | 'event';

interface ShareCardModalProps {
    visible: boolean;
    onClose: () => void;
    shareType: ShareType;
    // Content props
    contentType?: ContentType;
    title: string;
    subtitle?: string;
    coverUrl?: string;
    rating?: number;
    year?: string;
    duration?: string;
    // Post props
    postContent?: string;
    postAuthor?: string;
    postAuthorAvatar?: string;
    quoteText?: string;
    // Repost/Quote props
    isRepost?: boolean;
    isQuoteRepost?: boolean;
    repostedBy?: string;
    originalPostContent?: string;
    originalPostAuthor?: string;
    originalPostAuthorAvatar?: string;
    originalQuoteText?: string;
    // Profile props
    username?: string;
    bio?: string;
    followerCount?: number;
    postCount?: number;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
    visible,
    onClose,
    shareType,
    contentType,
    title,
    subtitle,
    coverUrl,
    rating,
    year,
    duration,
    postContent,
    postAuthor,
    postAuthorAvatar,
    quoteText,
    isRepost,
    isQuoteRepost,
    repostedBy,
    originalPostContent,
    originalPostAuthor,
    originalPostAuthorAvatar,
    originalQuoteText,
    username,
    bio,
    followerCount,
    postCount,
}) => {
    const { theme } = useTheme();
    const viewShotRef = useRef<ViewShot>(null);
    const [isSharing, setIsSharing] = useState(false);

    const getContentIcon = () => {
        switch (contentType) {
            case 'movie': return Film;
            case 'music': return Music;
            case 'event': return Calendar;
            default: return BookOpen;
        }
    };

    const getContentLabel = () => {
        switch (contentType) {
            case 'movie': return 'Film';
            case 'music': return 'Müzik';
            case 'event': return 'Etkinlik';
            default: return 'Kitap';
        }
    };

    const getShareMessage = () => {
        switch (shareType) {
            case 'post': return `${postAuthor || username}'in gönderisini KültüraX'ta gör!`;
            case 'profile': return `${username} profilini KültüraX'ta keşfet!`;
            default: return `${title} - KültüraX uygulamasında keşfettim! 📚🎬🎵`;
        }
    };

    const ContentIcon = getContentIcon();

    const handleShare = async () => {
        if (!viewShotRef.current) return;

        setIsSharing(true);
        try {
            const uri = await viewShotRef.current.capture?.();
            if (uri) {
                await Share.open({
                    url: Platform.OS === 'android' ? `file://${uri}` : uri,
                    type: 'image/png',
                    title: shareType === 'profile' ? `${username} - KültüraX` : `${title} - KültüraX`,
                    message: getShareMessage(),
                });
            }
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.log('Share error:', error);
            }
        } finally {
            setIsSharing(false);
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContainer: {
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            overflow: 'hidden',
            ...theme.shadows.soft,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
        },
        closeButton: {
            padding: 4,
        },
        cardContainer: {
            padding: 16,
        },
        shareCard: {
            backgroundColor: '#1a1a1a',
            borderRadius: 20,
            overflow: 'hidden',
        },
        coverImage: {
            width: '100%',
            height: 280,
        },
        cardContent: {
            padding: 20,
        },
        typeLabel: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
        },
        typeLabelText: {
            fontSize: 12,
            fontWeight: '600',
            color: '#EA9A65',
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        cardTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: 8,
        },
        cardSubtitle: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 12,
        },
        cardMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
        },
        metaText: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
        },
        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        ratingText: {
            fontSize: 14,
            fontWeight: '700',
            color: '#F59E0B',
        },
        branding: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
        },
        brandingText: {
            fontSize: 14,
            fontWeight: '700',
            color: '#EA9A65',
        },
        shareButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 12,
        },
        shareButtonText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        // Post specific styles
        postCard: {
            backgroundColor: '#1a1a1a',
            borderRadius: 20,
            padding: 24,
        },
        postAuthorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        postAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginRight: 12,
            backgroundColor: '#333',
        },
        postAuthorName: {
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        postQuote: {
            fontSize: 18,
            fontStyle: 'italic',
            color: '#FFFFFF',
            lineHeight: 26,
            marginBottom: 16,
            paddingLeft: 16,
            borderLeftWidth: 3,
            borderLeftColor: '#EA9A65',
        },
        postText: {
            fontSize: 16,
            color: '#FFFFFF',
            lineHeight: 24,
            marginBottom: 16,
        },
        postCoverImage: {
            width: '100%',
            height: 160,
            borderRadius: 12,
            marginBottom: 16,
        },
        // Content card (like PostCard's bookCard)
        contentCard: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
        },
        contentCover: {
            width: 50,
            height: 75,
            borderRadius: 8,
            backgroundColor: '#333',
        },
        contentInfo: {
            flex: 1,
            marginLeft: 12,
            justifyContent: 'center',
        },
        contentTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: '#FFFFFF',
            marginTop: 4,
        },
        // Quote box (like PostCard's quoteBox)
        quoteBox: {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderLeftWidth: 3,
            borderLeftColor: '#EA9A65',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
        },
        // Profile specific styles
        profileCard: {
            backgroundColor: '#1a1a1a',
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
        },
        profileAvatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            marginBottom: 16,
            borderWidth: 3,
            borderColor: '#EA9A65',
        },
        profileUsername: {
            fontSize: 24,
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: 8,
        },
        profileBio: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            marginBottom: 20,
            paddingHorizontal: 16,
        },
        profileStats: {
            flexDirection: 'row',
            gap: 32,
            marginBottom: 16,
        },
        profileStat: {
            alignItems: 'center',
        },
        profileStatNumber: {
            fontSize: 20,
            fontWeight: '800',
            color: '#FFFFFF',
        },
        profileStatLabel: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
        },
        // Repost specific styles
        repostLabel: {
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 2,
        },
        repostedByContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            gap: 6,
        },
        repostedByText: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
        },
        originalPostCard: {
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 14,
            marginTop: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        },
        originalPostAuthorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        originalPostAvatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            marginRight: 8,
            backgroundColor: '#333',
        },
        originalPostAuthorName: {
            fontSize: 13,
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
        },
        originalPostQuote: {
            fontSize: 14,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 20,
            marginBottom: 10,
            paddingLeft: 12,
            borderLeftWidth: 2,
            borderLeftColor: '#EA9A65',
        },
        originalPostText: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 20,
            marginBottom: 10,
        },
        // Original post content card (for cover + title inside repost)
        originalContentCard: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: 10,
            marginBottom: 10,
        },
        originalContentCover: {
            width: 40,
            height: 60,
            borderRadius: 6,
            backgroundColor: '#333',
        },
        originalQuoteBox: {
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderLeftWidth: 2,
            borderLeftColor: '#EA9A65',
            padding: 10,
            borderRadius: 6,
        },
    });

    // Render content card
    const renderContentCard = () => (
        <View style={styles.shareCard}>
            {coverUrl && (
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.cardContent}>
                {contentType && (
                    <View style={styles.typeLabel}>
                        <ContentIcon size={14} color="#EA9A65" />
                        <Text style={styles.typeLabelText}>{getContentLabel()}</Text>
                    </View>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                {subtitle && <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>}
                <View style={styles.cardMeta}>
                    {year && <Text style={styles.metaText}>{year}</Text>}
                    {duration && <Text style={styles.metaText}>{duration}</Text>}
                    {rating && rating > 0 && (
                        <View style={styles.ratingContainer}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.branding}>
                    <Text style={styles.brandingText}>📱 KültüraX</Text>
                </View>
            </View>
        </View>
    );

    // Render post card
    const renderPostCard = () => {
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
                                <User size={24} color="#888" />
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

                    {/* 3. Original post nested card (like PostCard's embeddedPostContainer) */}
                    <View style={styles.originalPostCard}>
                        {/* Original post author */}
                        <View style={styles.originalPostAuthorRow}>
                            {originalPostAuthorAvatar ? (
                                <Image source={{ uri: originalPostAuthorAvatar }} style={styles.originalPostAvatar} />
                            ) : (
                                <View style={[styles.originalPostAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <User size={16} color="#888" />
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
                                        <ContentIcon size={10} color="#EA9A65" />
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
                        <Share2 size={12} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.repostedByText}>{repostedBy} yeniden paylaştı</Text>
                    </View>
                )}

                {/* 1. Author Header (Original Author if Repost) */}
                <View style={styles.postAuthorRow}>
                    {postAuthorAvatar ? (
                        <Image source={{ uri: postAuthorAvatar }} style={styles.postAvatar} />
                    ) : (
                        <View style={[styles.postAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                            <User size={24} color="#888" />
                        </View>
                    )}
                    <Text style={styles.postAuthorName}>{postAuthor || 'Anonim'}</Text>
                </View>

                {/* 2. Comment/Content Text (user's comment) */}
                {postContent && (
                    <Text style={styles.postText} numberOfLines={4}>{postContent}</Text>
                )}

                {/* 3. Content Card (cover + title + author) - like PostCard's bookCard */}
                {coverUrl && title && (
                    <View style={styles.contentCard}>
                        <Image
                            source={{ uri: coverUrl }}
                            style={styles.contentCover}
                            resizeMode="cover"
                        />
                        <View style={styles.contentInfo}>
                            <View style={styles.typeLabel}>
                                <ContentIcon size={12} color="#EA9A65" />
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

    // Render profile card
    const renderProfileCard = () => (
        <View style={styles.profileCard}>
            {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.profileAvatar} />
            ) : (
                <View style={[styles.profileAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}>
                    <User size={48} color="#888" />
                </View>
            )}
            <Text style={styles.profileUsername}>@{username}</Text>
            {bio && <Text style={styles.profileBio} numberOfLines={3}>{bio}</Text>}
            <View style={styles.profileStats}>
                {followerCount !== undefined && (
                    <View style={styles.profileStat}>
                        <Text style={styles.profileStatNumber}>{followerCount}</Text>
                        <Text style={styles.profileStatLabel}>Takipçi</Text>
                    </View>
                )}
                {postCount !== undefined && (
                    <View style={styles.profileStat}>
                        <Text style={styles.profileStatNumber}>{postCount}</Text>
                        <Text style={styles.profileStatLabel}>Gönderi</Text>
                    </View>
                )}
            </View>
            <View style={styles.branding}>
                <Text style={styles.brandingText}>📱 KültüraX</Text>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContainer} onPress={e => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Paylaş</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardContainer}>
                        <ViewShot
                            ref={viewShotRef}
                            options={{ format: 'png', quality: 1 }}
                        >
                            {shareType === 'post' && renderPostCard()}
                            {shareType === 'profile' && renderProfileCard()}
                            {shareType === 'content' && renderContentCard()}
                        </ViewShot>
                    </View>

                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                        disabled={isSharing}
                    >
                        {isSharing ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Share2 size={20} color="#FFF" />
                                <Text style={styles.shareButtonText}>Hikayede Paylaş</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};
