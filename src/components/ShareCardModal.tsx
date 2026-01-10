import React, { useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, Share2, Film, BookOpen, Music, Calendar } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { ContentType } from '../types/models';
import { getStyles } from './styles/ShareCardModal.styles';
import { ContentShareCard } from './share/ContentShareCard';
import { ProfileShareCard } from './share/ProfileShareCard';
import { PostShareCard } from './share/PostShareCard';

type ShareType = 'content' | 'post' | 'profile';

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

    // Optimize styles with useMemo
    const styles = useMemo(() => getStyles(theme), [theme]);

    const getShareMessage = () => {
        switch (shareType) {
            case 'post': return `${postAuthor || username}'in gönderisini KültüraX'ta gör!`;
            case 'profile': return `${username} profilini KültüraX'ta keşfet!`;
            default: return `${title} - KültüraX uygulamasında keşfettim! 📚🎬🎵`;
        }
    };

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
                            {shareType === 'post' && (
                                <PostShareCard
                                    postContent={postContent}
                                    postAuthor={postAuthor}
                                    postAuthorAvatar={postAuthorAvatar}
                                    quoteText={quoteText}
                                    isQuoteRepost={isQuoteRepost}
                                    repostedBy={repostedBy}
                                    originalPostContent={originalPostContent}
                                    originalPostAuthor={originalPostAuthor}
                                    originalPostAuthorAvatar={originalPostAuthorAvatar}
                                    originalQuoteText={originalQuoteText}
                                    contentType={contentType}
                                    title={title}
                                    coverUrl={coverUrl}
                                />
                            )}
                            {shareType === 'profile' && (
                                <ProfileShareCard
                                    coverUrl={coverUrl}
                                    username={username}
                                    bio={bio}
                                    followerCount={followerCount}
                                    postCount={postCount}
                                />
                            )}
                            {shareType === 'content' && (
                                <ContentShareCard
                                    contentType={contentType}
                                    title={title}
                                    subtitle={subtitle}
                                    coverUrl={coverUrl}
                                    rating={rating}
                                    year={year}
                                    duration={duration}
                                />
                            )}
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
