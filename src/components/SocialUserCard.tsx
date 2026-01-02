import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/backendApi';
import { Eye, UserPlus, UserCheck, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

interface SocialUserCardProps {
    user: {
        id: number;
        username: string;
        name: string;
        surname: string;
        avatar_url?: string;
        follower_count?: number;
        total_views?: number;
        is_following?: boolean;
        is_private?: boolean;
        request_status?: 'pending' | 'accepted' | 'rejected' | null;
        bio?: string;
        fav_category?: string;
        header_image_url?: string;
    };
    onPress: (isFollowing: boolean) => void;
    onFollowUpdate?: () => void;
}

const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const generateSmartBio = (user: SocialUserCardProps['user']) => {
    if (user.bio) return user.bio;

    const views = user.total_views || 0;
    const followers = user.follower_count || 0;

    if (views > 1000000) return "Milyonların takip ettiği, kültür sanat dünyasının gerçek bir fenomeni. 🌟";
    if (views > 500000) return "İçerikleriyle yüz binlerce kişiye ilham veren popüler bir kaşif. ✨";
    if (views > 100000) return "Kültür sanat topluluğunun parlayan yıldızlarından biri. 🚀";

    if (followers > 10000) return "Topluluğun en güvenilen eleştirmenlerinden ve içerik üreticilerinden. ✍️";
    if (followers > 5000) return "Paylaşımlarıyla dikkat çeken, takip edilmesi gereken bir isim. 👀";

    // Category based custom bio
    if (user.fav_category) {
        switch (user.fav_category) {
            case 'book': return "Satır aralarında kaybolan bir okur. 📚";
            case 'movie': return "Hayatı bir film şeridi gibi izleyen sinema tutkunu. 🎬";
            case 'music': return "Hayatın ritmini yakalayan bir müziksever. 🎵";
            case 'event': return "Şehrin kültür sanat etkinliklerini kaçırmayan bir gezgin. 🎫";
            // case 'general' removed to use random defaults below for variety
            default: break;
        }
    }

    // Random defaults for variety (Updated)
    const defaults = [
        "Keşfedilmeyi bekleyen bir hikaye anlatıcısı. 🖋️",
        "Henüz yolun başında ama paylaşacak çok şeyi var. 🌱",
        "Kendi dünyasında, sanatla iç içe bir yaşam. 🎨",
        "İlham veren paylaşımların adresi olmaya aday. ✨"
    ];

    // Use user ID to keep the "random" selection consistent for the same user
    const index = user.id % defaults.length;
    return defaults[index];
};

const getCategoryBanner = (category?: string) => {
    switch (category) {
        case 'book': return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80'; // Library
        case 'movie': return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80'; // Cinema
        case 'music': return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'; // Music Studio
        case 'event': return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'; // Concert crowd
        default: return 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80'; // Abstract gradient
    }
};

export const SocialUserCard: React.FC<SocialUserCardProps> = ({ user, onPress, onFollowUpdate }) => {
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
    const [isFollowing, setIsFollowing] = useState(user.is_following || false);
    const [requestStatus, setRequestStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(user.request_status || null);
    const [loading, setLoading] = useState(false);

    // Sync local state with prop if data is refreshed from parent
    React.useEffect(() => {
        setIsFollowing(user.is_following || false);
        setRequestStatus(user.request_status || null);
    }, [user.is_following, user.request_status]);

    const bioText = React.useMemo(() => generateSmartBio(user), [user]);

    // Banner Logic: User's header image > Category Banner > Default
    const bannerUrl = React.useMemo(() => {
        if (user.header_image_url && user.header_image_url.trim() !== '') {
            return user.header_image_url;
        }
        return getCategoryBanner(user.fav_category);
    }, [user.header_image_url, user.fav_category]);

    // ... (Banner Logic)

    const handleFollow = async () => {
        if (loading || !currentUser) return;

        setLoading(true);

        try {
            const response = await userService.followUser(user.id);

            if (response) {
                setIsFollowing(response.is_following || false);
                setRequestStatus(response.request_status || null);

                if (onFollowUpdate) {
                    onFollowUpdate();
                }

                // Show appropriate toast
                if (response.request_status === 'pending') {
                    Toast.show({
                        type: 'success',
                        text1: 'İstek Gönderildi',
                        text2: `@${user.username} takip isteği gönderildi.`,
                        visibilityTime: 2000,
                    });
                } else if (response.is_following) {
                    Toast.show({
                        type: 'success',
                        text1: 'Takip Ediliyor',
                        text2: `@${user.username} takip ediliyor.`,
                        visibilityTime: 2000,
                    });
                } else {
                    Toast.show({
                        type: 'info',
                        text1: requestStatus === 'pending' ? 'İstek İptal Edildi' : 'Takip Bırakıldı',
                        text2: `@${user.username} takipten çıkarıldı.`,
                        visibilityTime: 2000,
                    });
                }
            }
        } catch (error) {
            console.error('Follow error', error);
            Toast.show({
                type: 'error',
                text1: 'Bir hata oluştu',
                text2: 'İşlem gerçekleştirilemedi.'
            });
        } finally {
            setLoading(false);
        }
    };


    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            marginBottom: 20,
            ...theme.shadows.soft,
            overflow: 'hidden',
            // Dark mode visibility fix
            borderWidth: theme.dark ? 1 : 0,
            borderColor: theme.colors.border,
        },
        bannerImage: {
            width: '100%',
            height: 100,
        },
        contentContainer: {
            paddingHorizontal: 16,
            paddingBottom: 16,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 12,
            marginTop: -30, // Negative margin to overlap avatar
        },
        avatarContainer: {
            padding: 4,
            backgroundColor: theme.colors.surface, // Border effect
            borderRadius: 40,
        },
        avatar: {
            width: 72,
            height: 72,
            borderRadius: 36,
        },
        avatarPlaceholder: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarText: {
            color: '#FFFFFF',
            fontSize: 28,
            fontWeight: 'bold',
        },
        // Action Button styled like the design (Pill shape)
        followButton: {
            backgroundColor: isFollowing ? theme.colors.background : theme.colors.text,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 0, // Aligned with the bottom of the avatar area
            borderWidth: 1,
            borderColor: isFollowing ? theme.colors.border : theme.colors.text,
        },
        followButtonText: {
            color: isFollowing ? theme.colors.text : theme.colors.surface,
            fontWeight: '600',
            fontSize: 13,
            marginLeft: 6,
        },

        infoSection: {
            marginTop: 4,
        },
        name: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 2,
        },
        username: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 8,
        },
        bioText: {
            fontSize: 14,
            color: theme.colors.text,
            lineHeight: 20,
            marginBottom: 12,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        statItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
        },
        statValue: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginLeft: 4,
        },
        statLabel: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginLeft: 4,
        },
        categoryBadge: {
            backgroundColor: theme.colors.background,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            marginBottom: 8
        },
        categoryText: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginLeft: 4
        }

    }), [theme, isFollowing]);

    const getCategoryIcon = () => {
        // Optional: return icon based on category for the badge
        return null;
    };

    return (
        <TouchableOpacity style={styles.container} onPress={() => onPress(isFollowing)} activeOpacity={0.95}>
            {/* Banner Section */}
            <Image
                source={{ uri: bannerUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
            />

            <View style={styles.contentContainer}>
                {/* Header: Avatar overlapping Banner + Follow Button */}
                <View style={styles.headerRow}>
                    <View style={styles.avatarContainer}>
                        {user.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {(user.username || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Follow Button - Only show if not current user */}
                    {(currentUser && currentUser.id !== user.id) && (
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                {
                                    backgroundColor: isFollowing
                                        ? theme.colors.background
                                        : requestStatus === 'pending'
                                            ? theme.colors.secondary
                                            : theme.colors.text,
                                    borderColor: isFollowing
                                        ? theme.colors.border
                                        : requestStatus === 'pending'
                                            ? theme.colors.secondary
                                            : theme.colors.text,
                                }
                            ]}
                            onPress={handleFollow}
                            activeOpacity={0.8}
                        >
                            {isFollowing ? (
                                <UserCheck size={16} color={theme.colors.text} />
                            ) : requestStatus === 'pending' ? (
                                <Clock size={16} color="#FFF" />
                            ) : (
                                <UserPlus size={16} color={theme.colors.surface} />
                            )}
                            <Text style={[
                                styles.followButtonText,
                                { color: isFollowing ? theme.colors.text : '#FFF' }
                            ]}>
                                {isFollowing
                                    ? 'Takip Ediliyor'
                                    : requestStatus === 'pending'
                                        ? 'İstek Gönderildi'
                                        : user.is_private
                                            ? 'İstek Gönder'
                                            : 'Takip Et'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.name}>{user.name} {user.surname}</Text>
                    <Text style={styles.username}>@{user.username}</Text>

                    {user.fav_category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {user.fav_category === 'book' ? '📚 Kitap Kurdu' :
                                    user.fav_category === 'movie' ? '🎬 Sinefil' :
                                        user.fav_category === 'music' ? '🎵 Müzik Tutkunu' :
                                            user.fav_category === 'event' ? '🎫 Etkinlikçi' :
                                                '🗣️ Paylaşımcı'}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.bioText} numberOfLines={3}>
                        {bioText}
                    </Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        {user.follower_count !== undefined && (
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formatNumber(user.follower_count)}</Text>
                                <Text style={styles.statLabel}>takipçi</Text>
                            </View>
                        )}
                        {user.total_views !== undefined && (
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{formatNumber(user.total_views)}</Text>
                                <Text style={styles.statLabel}>görüntülenme</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
