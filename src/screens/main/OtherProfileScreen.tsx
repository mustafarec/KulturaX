import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Share, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { postService, userService, libraryService, reviewService, interactionService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from '../../components/PostCard';
import { QuoteCard } from '../../components/QuoteCard';
import { ReviewCard } from '../../components/ReviewCard';
import { RepostMenu } from '../../components/RepostMenu';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export const OtherProfileScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { userId } = route.params as { userId: number };
    const { user: currentUser } = useAuth();
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
        },
        headerImageContainer: {
            height: 180,
            width: '100%',
            position: 'relative',
        },
        headerImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        headerGradient: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
        },
        backButton: {
            position: 'absolute',
            top: 50,
            left: 20,
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: 8,
            borderRadius: 20,
        },
        profileInfoContainer: {
            marginTop: -50, // Overlap header image
            paddingBottom: 10,
        },
        avatarRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingHorizontal: 20,
            marginBottom: 12,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 4,
            borderColor: theme.colors.background,
            ...theme.shadows.soft,
        },
        actionButtons: {
            flexDirection: 'row',
            marginBottom: 10,
        },
        messageButton: {
            backgroundColor: theme.colors.primary,
            padding: 8,
            borderRadius: 20,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            ...theme.shadows.soft,
        },
        messageButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#FFFFFF',
        },
        followButton: {
            backgroundColor: theme.colors.text,
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 20,
            marginRight: 8,
            ...theme.shadows.soft,
        },
        followingButton: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        followButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#FFFFFF',
        },
        followingButtonText: {
            color: theme.colors.text,
        },
        shareButton: {
            backgroundColor: theme.colors.surface,
            padding: 8,
            borderRadius: 20,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        shareButtonText: {
            color: theme.colors.text,
            fontWeight: 'bold',
            fontSize: 16,
        },
        userInfo: {
            paddingHorizontal: 20,
            marginBottom: 20,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
        },
        name: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.colors.text,
            marginRight: 8,
        },
        badge: {
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '700',
            color: theme.colors.textSecondary,
        },
        username: {
            fontSize: 15,
            color: theme.colors.textSecondary,
            fontWeight: '500',
            marginBottom: 12,
        },
        bio: {
            fontSize: 15,
            color: theme.colors.text,
            lineHeight: 22,
            marginBottom: 12,
        },
        metaInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        metaText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginLeft: 4,
        },
        listeningContainer: {
            marginHorizontal: 20,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(29, 185, 84, 0.1)', // Spotify green tint
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(29, 185, 84, 0.2)',
        },
        listeningLabel: {
            fontSize: 10,
            color: '#1DB954',
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        listeningTrack: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
        },
        listeningArtist: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        albumArt: {
            width: 48,
            height: 48,
            borderRadius: 8,
        },
        statsScroll: {
            marginBottom: 20,
        },
        statsContent: {
            paddingHorizontal: 20,
        },
        statItem: {
            marginRight: 24,
            alignItems: 'center',
        },
        statNumber: {
            fontSize: 18,
            fontWeight: '800',
            color: theme.colors.text,
        },
        statLabel: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        tabsContainer: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            paddingHorizontal: 20,
        },
        tab: {
            marginRight: 24,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        activeTab: {
            borderBottomColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeTabText: {
            color: theme.colors.primary,
            fontWeight: '700',
        },
        contentContainer: {
            padding: 20,
        },
        libraryItemCard: {
            backgroundColor: theme.colors.glass,
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
        },
        libraryItemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        libraryItemTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            flex: 1,
            marginRight: 12,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        statusText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
        },
        libraryItemDate: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        emptyContainer: {
            alignItems: 'center',
            padding: 40,
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontSize: 16,
        },
    }), [theme]);

    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [userReviews, setUserReviews] = useState<any[]>([]);
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<any>(null);

    // Interaction State
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedRepostPost, setSelectedRepostPost] = useState<any>(null);

    // Mock Header Image (Random Library/Aesthetic)
    const headerImage = profile?.header_image_url || 'https://images.unsplash.com/photo-1507842217121-9e96e4430330?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

    const [isFollowing, setIsFollowing] = useState(false);
    const fetchProfileData = async () => {
        if (!refreshing) setIsLoading(true);

        console.log('Fetching profile for userId:', userId);

        try {
            try {
                // Fetch profile and check follow status
                const profileData = await userService.getUserProfile(userId, currentUser?.id);
                setProfile(profileData);

                if (profileData.is_following !== undefined) {
                    setIsFollowing(profileData.is_following);
                }
            } catch (profileError) {
                console.error('Error fetching profile:', profileError);
            }

            try {
                const postsData = await postService.getFeed(userId);
                if (Array.isArray(postsData)) {
                    const filteredPosts = postsData.filter((post: any) => post.user.id == userId);
                    setUserPosts(filteredPosts);
                }
            } catch (postError) {
                console.error('Error fetching user posts:', postError);
            }

            try {
                const libraryData = await libraryService.getUserLibrary(userId);
                setLibraryItems(libraryData);
            } catch (libraryError) {
                console.error('Error fetching library:', libraryError);
            }

        } catch (error) {
            console.error('General error in fetchProfileData:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchNowPlaying = async () => {
        try {
            const response = await fetch(`https://mmreeo.online/api/integrations/spotify_proxy.php?user_id=${userId}`);
            const text = await response.text();

            if (!text) {
                setNowPlaying(null);
                return;
            }

            try {
                const data = JSON.parse(text);
                if (data && data.is_playing) {
                    setNowPlaying(data);
                } else {
                    setNowPlaying(null);
                }
            } catch (e) {
                setNowPlaying(null);
            }
        } catch (error) {
            console.error('Spotify error:', error);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) return;
        try {
            const response = await userService.followUser(currentUser.id, userId);
            setIsFollowing(response.is_following);

            // Update follower count locally
            if (profile) {
                setProfile((prev: any) => ({
                    ...prev,
                    follower_count: response.is_following
                        ? (prev.follower_count || 0) + 1
                        : Math.max((prev.follower_count || 0) - 1, 0)
                }));
            }

            Toast.show({
                type: 'success',
                text1: response.is_following ? 'Takip Ediliyor' : 'Takip Bırakıldı',
            });
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'İşlem gerçekleştirilemedi.',
            });
        }
    };

    useEffect(() => {
        fetchProfileData();
        fetchNowPlaying();
        const interval = setInterval(fetchNowPlaying, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchProfileData();
        fetchNowPlaying();
    }, []);

    const handleMessagePress = () => {
        if (!profile) return;
        (navigation as any).navigate('Chat', {
            otherUserId: profile.id,
            otherUserName: profile.username,
            avatarUrl: profile.avatar_url
        });
    };

    if (isLoading && !profile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text>Kullanıcı bulunamadı. (ID: {userId})</Text>
            </View>
        );
    };

    const handleShareProfile = async () => {
        if (!profile) return;
        try {
            await Share.share({
                message: `Check out ${profile.username}'s profile on KültüraX!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleContentPress = (type: 'book' | 'movie', id: string) => {
        if (type === 'book') {
            (navigation as any).navigate('BookDetail', { bookId: id });
        } else if (type === 'movie') {
            (navigation as any).navigate('MovieDetail', { movieId: parseInt(id, 10) });
        }
    };

    const handleLike = async (post: any) => {
        if (!currentUser) return;
        try {
            const isLiked = post.is_liked;
            const currentLikeCount = typeof post.like_count === 'string' ? parseInt(post.like_count, 10) : post.like_count;
            const newLikeCount = isLiked ? currentLikeCount - 1 : currentLikeCount + 1;

            const updatedPosts = userPosts.map(p => {
                if (p.id === post.id) {
                    return { ...p, is_liked: !isLiked, like_count: newLikeCount };
                }
                return p;
            });
            setUserPosts(updatedPosts);

            const response = await interactionService.toggleLike(currentUser.id, post.id);

            if (response && typeof response.count === 'number') {
                const updatedPosts = userPosts.map(p => {
                    if (p.id === post.id) {
                        return { ...p, is_liked: response.liked, like_count: response.count };
                    }
                    return p;
                });
                setUserPosts(updatedPosts);
            }
        } catch (error) {
            console.error(error);
            fetchProfileData();
        }
    };

    const handleRepost = (post: any) => {
        setSelectedRepostPost(post);
        setRepostMenuVisible(true);
    };

    const handleDirectRepost = async () => {
        if (!currentUser || !selectedRepostPost) return;
        try {
            await postService.create(
                currentUser.id,
                'Yeniden paylaşım',
                'App',
                currentUser.username,
                selectedRepostPost.id
            );
            setRepostMenuVisible(false);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Yeniden gönderildi!' });
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız.' });
        }
    };

    const handleQuoteRepost = () => {
        if (!selectedRepostPost) return;
        setRepostMenuVisible(false);
        (navigation as any).navigate('CreateQuote', { originalPost: selectedRepostPost });
    };

    // Helper Components (Moved inside to access styles and theme)
    const StatItem = ({ number, label }: { number: number, label: string }) => (
        <View style={styles.statItem}>
            <Text style={styles.statNumber}>{number}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const TabButton = ({ title, active, onPress }: { title: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
            <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
        </TouchableOpacity>
    );

    const EmptyState = ({ icon, text }: { icon: string, text: string }) => (
        <View style={styles.emptyContainer}>
            <Icon name={icon} size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return userPosts.filter(p => p.type !== 'quote').length > 0 ? (
                    userPosts.filter(p => p.type !== 'quote').map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onPress={() => { }}
                            onUserPress={(userId) => {
                                const targetUserId = post.original_post ? post.original_post.user.id : post.user.id;
                                const finalUserId = userId || targetUserId;
                                if (finalUserId !== userId) {
                                    (navigation as any).navigate('OtherProfile', { userId: finalUserId });
                                }
                            }}
                            onContentPress={handleContentPress}
                            onLike={() => handleLike(post)}
                            onComment={() => (navigation as any).navigate('PostDetail', { postId: post.id, autoFocusComment: true })}
                            onRepost={() => handleRepost(post)}
                        />
                    ))
                ) : (
                    <EmptyState icon="social-dropbox" text="Henüz gönderi yok." />
                );
            case 'quotes':
                return userPosts.filter(p => p.type === 'quote').length > 0 ? (
                    userPosts.filter(p => p.type === 'quote').map((post) => (
                        <QuoteCard
                            key={post.id}
                            text={post.content}
                            source={post.content_title || 'Bilinmeyen Kaynak'}
                            variant="compact"
                            onPress={() => post.content_id && post.content_type && handleContentPress(post.content_type, post.content_id)}
                        />
                    ))
                ) : (
                    <EmptyState icon="speech" text="Henüz alıntı yok." />
                );
            case 'library':
                return libraryItems.length > 0 ? (
                    libraryItems.map((item) => (
                        <View key={item.id} style={styles.libraryItemCard}>
                            <View style={styles.libraryItemHeader}>
                                <Text style={styles.libraryItemTitle}>{item.content_title}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'read' ? '#4CAF50' : item.status === 'reading' ? '#2196F3' : '#FFC107' }]}>
                                    <Text style={styles.statusText}>
                                        {item.status === 'read' ? 'Okundu' : item.status === 'reading' ? 'Okunuyor' : 'Okunacak'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.libraryItemDate}>
                                {new Date(item.updated_at).toLocaleDateString()} tarihinde güncellendi
                            </Text>
                        </View>
                    ))
                ) : (
                    <EmptyState icon="book-open" text="Kütüphaneniz boş." />
                );
            case 'reviews':
                return userReviews.length > 0 ? (
                    userReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))
                ) : (
                    <EmptyState icon="pencil" text="Henüz inceleme yok." />
                );
            default:
                return null;
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Header Image Area */}
            <View style={styles.headerImageContainer}>
                <Image
                    key={headerImage}
                    source={{ uri: headerImage }}
                    style={styles.headerImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', theme.colors.background]}
                    style={styles.headerGradient}
                />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Profile Info Area */}
            <View style={styles.profileInfoContainer}>
                <View style={styles.avatarRow}>
                    <Image
                        key={profile.avatar_url}
                        source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <View style={styles.actionButtons}>
                        {/* Mesaj Gönder Butonu */}
                        {currentUser && currentUser.id !== profile.id && (
                            <>
                                <TouchableOpacity
                                    style={[styles.followButton, isFollowing ? styles.followingButton : {}]}
                                    onPress={handleFollow}
                                >
                                    <Text style={[styles.followButtonText, isFollowing ? styles.followingButtonText : {}]}>
                                        {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.messageButton} onPress={handleMessagePress}>
                                    <Icon name="bubble" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Paylaş Butonu */}
                        <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
                            <Icon name="share" size={18} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{profile.full_name || profile.username}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Okur</Text>
                        </View>
                    </View>
                    <Text style={styles.username}>@{profile.username}</Text>

                    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

                    <View style={styles.metaInfo}>
                        <Icon name="location-pin" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.metaText}>{profile.location || 'İstanbul'}</Text>
                        <Icon name="calendar" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 12 }} />
                        <Text style={styles.metaText}>Katılım: Kasım 2025</Text>
                    </View>
                </View>

                {/* Spotify Status */}
                {nowPlaying && (
                    <View style={styles.listeningContainer}>
                        <Image source={{ uri: nowPlaying.image }} style={styles.albumArt} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="music-tone-alt" size={12} color="#1DB954" style={{ marginRight: 4 }} />
                                <Text style={styles.listeningLabel}>Dinliyor</Text>
                            </View>
                            <Text style={styles.listeningTrack} numberOfLines={1}>{nowPlaying.track}</Text>
                            <Text style={styles.listeningArtist} numberOfLines={1}>{nowPlaying.artist}</Text>
                        </View>
                    </View>
                )}

                {/* Stats Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
                    <StatItem number={userPosts.length} label="Gönderi" />
                    <StatItem number={libraryItems.filter(i => i.status === 'read').length} label="Kitap" />
                    <StatItem number={profile?.follower_count || 0} label="Takipçi" />
                    <StatItem number={profile?.following_count || 0} label="Takip" />
                    <StatItem number={0} label="İnceleme" />
                </ScrollView>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TabButton title="Gönderiler" active={activeTab === 'posts'} onPress={() => setActiveTab('posts')} />
                    <TabButton title="Alıntılar" active={activeTab === 'quotes'} onPress={() => setActiveTab('quotes')} />
                    <TabButton title="Kütüphane" active={activeTab === 'library'} onPress={() => setActiveTab('library')} />
                    <TabButton title="İncelemeler" active={activeTab === 'reviews'} onPress={() => setActiveTab('reviews')} />
                </View>
            </View>

            <View style={styles.contentContainer}>
                {renderTabContent()}
            </View>

            <View style={{ height: 100 }} />

            <View style={{ height: 100 }} />

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onRepost={handleDirectRepost}
                onQuote={handleQuoteRepost}
            />
        </ScrollView >
    );
};




