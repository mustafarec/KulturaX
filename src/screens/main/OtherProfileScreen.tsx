import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Share, Dimensions, LayoutAnimation, UIManager } from 'react-native';
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
import { ThemedDialog } from '../../components/ThemedDialog';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

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
        optionsButton: {
            position: 'absolute',
            top: 50,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: 8,
            borderRadius: 20,
            zIndex: 10,
        },
        menuOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            height: '200%', // Cover enough scroll area if needed, though usually window height is better. Here relative to container.
        },
        dropdownMenu: {
            position: 'absolute',
            top: 90, // optionsButton top + height + margin
            right: 20,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 8,
            minWidth: 150,
            zIndex: 30,
            ...theme.shadows.default,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        menuItem: {
            paddingVertical: 12,
            paddingHorizontal: 16,
        },
        menuItemTextDestructive: {
            color: theme.colors.error || '#FF3B30',
            fontSize: 16,
            fontWeight: '600',
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
            color: theme.colors.background,
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
        filterContainer: {
            flexDirection: 'row',
            marginBottom: 16,
        },
        filterChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: theme.colors.glass,
            marginRight: 8,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
        },
        activeFilterChip: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        filterText: {
            fontSize: 13,
            color: theme.colors.text,
            fontWeight: '600',
        },
        activeFilterText: {
            color: '#FFFFFF',
        },
        contentContainer: {
            padding: 20,
        },
        libraryItemCard: {
            backgroundColor: theme.colors.glass,
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            flexDirection: 'row',
        },
        libraryBookCover: {
            width: 60,
            height: 90,
            borderRadius: 8,
            backgroundColor: theme.colors.secondary,
            marginRight: 12,
        },
        libraryItemContent: {
            flex: 1,
            justifyContent: 'space-between',
        },
        libraryItemHeader: {
            flexDirection: 'column',
            alignItems: 'flex-start',
        },
        libraryItemTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 2,
        },
        libraryItemAuthor: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 8,
        },
        libraryMetaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            alignSelf: 'flex-start',
        },
        statusText: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 'bold',
        },
        libraryItemDate: {
            fontSize: 11,
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
    const [libraryFilter, setLibraryFilter] = useState<'all' | 'book' | 'movie' | 'music'>('all');
    const [subFilter, setSubFilter] = useState<'all' | 'read' | 'reading' | 'want_to_read' | 'dropped'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<any>(null);

    // Interaction State
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedRepostPost, setSelectedRepostPost] = useState<any>(null);

    // Block Dialog State
    const [blockDialogVisible, setBlockDialogVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);



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

            try {
                const reviewsData = await reviewService.getUserReviews(userId);
                setUserReviews(reviewsData);
            } catch (reviewError) {
                console.error('Error fetching reviews:', reviewError);
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

    const handleContentPress = (type: 'book' | 'movie' | 'music', id: string) => {
        if (type === 'book') {
            (navigation as any).navigate('BookDetail', { bookId: id });
        } else if (type === 'movie') {
            (navigation as any).navigate('MovieDetail', { movieId: parseInt(id, 10) });
        } else if (type === 'music') {
            (navigation as any).navigate('ContentDetail', { id: id, type: 'music' });
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
                '', // quote
                'Yeniden paylaşım', // comment
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

    const handleBlockUser = async () => {
        if (!currentUser) return;
        try {
            await userService.blockUser(userId);
            setBlockDialogVisible(false);
            Toast.show({
                type: 'success',
                text1: 'Kullanıcı Engellendi',
                text2: 'Artık birbirinizin içeriklerini göremeyeceksiniz.'
            });
            // Engelledikten sonra geriye at
            setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Engelleme işlemi başarısız.'
            });
            setBlockDialogVisible(false);
        }
    };

    // Helper Components (Moved inside to access styles and theme)
    const StatItem = ({ number, label, onPress }: { number: number, label: string, onPress?: () => void }) => (
        <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
            <Text style={styles.statNumber}>{number}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </TouchableOpacity>
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

    const getStatusText = (status: string, type: string) => {
        switch (status) {
            case 'read':
                return type === 'movie' ? 'İzlendi' : type === 'music' ? 'Dinlendi' : 'Okundu';
            case 'reading':
                return type === 'movie' ? 'İzleniyor' : type === 'music' ? 'Dinleniyor' : 'Okunuyor';
            case 'want_to_read':
                return type === 'movie' ? 'İzlenecek' : type === 'music' ? 'Dinlenecek' : 'Okunacak';
            case 'dropped':
                return 'Yarım Bırakıldı';
            default:
                return status;
        }
    };

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
                const quotePosts = userPosts.filter(p =>
                    p.type === 'quote' ||
                    (p.quote_text && p.quote_text.length > 0) ||
                    (p.content_type && ['book', 'movie', 'music'].includes(p.content_type) && p.content)
                );

                return quotePosts.length > 0 ? (
                    quotePosts.map((post) => (
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
                    <EmptyState icon="speech" text="Henüz alıntı yok." />
                );
            case 'library':
                const filteredLibrary = libraryItems.filter(item => {
                    const matchesType = libraryFilter === 'all' ? true : item.content_type === libraryFilter;
                    const matchesSub = subFilter === 'all' ? true : item.status === subFilter;
                    return matchesType && matchesSub;
                });

                const handleFilterChange = (filter: 'all' | 'book' | 'movie' | 'music') => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setLibraryFilter(filter);
                    setSubFilter('all');
                };

                const getSubFilters = () => {
                    if (libraryFilter === 'book') {
                        return [
                            { label: 'Tümü', value: 'all' },
                            { label: 'Okudum', value: 'read' },
                            { label: 'Okuyorum', value: 'reading' },
                            { label: 'Okuyacağım', value: 'want_to_read' },
                            { label: 'Yarım Bıraktım', value: 'dropped' },
                        ];
                    } else if (libraryFilter === 'movie') {
                        return [
                            { label: 'Tümü', value: 'all' },
                            { label: 'İzledim', value: 'read' },
                            { label: 'İzliyorum', value: 'reading' },
                            { label: 'İzleyeceğim', value: 'want_to_read' },
                            { label: 'Yarım Bıraktım', value: 'dropped' },
                        ];
                    } else if (libraryFilter === 'music') {
                        return [
                            { label: 'Tümü', value: 'all' },
                            { label: 'Dinledim', value: 'read' },
                            { label: 'Dinliyorum', value: 'reading' },
                            { label: 'Dinleyeceğim', value: 'want_to_read' },
                            { label: 'Yarım Bıraktım', value: 'dropped' },
                        ];
                    }
                    return [];
                };

                return (
                    <View>
                        {/* Ana Filtreler */}
                        <View style={[styles.filterContainer, { marginBottom: 8 }]}>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'all' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('all')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'all' && styles.activeFilterText]}>Tümü</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'book' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('book')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'book' && styles.activeFilterText]}>Kitaplar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'movie' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('movie')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'movie' && styles.activeFilterText]}>Filmler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'music' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('music')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'music' && styles.activeFilterText]}>Müzikler</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Alt Filtreler (Animasyonlu) */}
                        {libraryFilter !== 'all' && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, paddingHorizontal: 4 }}>
                                {getSubFilters().map((sub) => (
                                    <TouchableOpacity
                                        key={sub.value}
                                        style={[
                                            styles.filterChip,
                                            { backgroundColor: subFilter === sub.value ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, marginRight: 6, paddingVertical: 4, paddingHorizontal: 12 }
                                        ]}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setSubFilter(sub.value as any);
                                        }}
                                    >
                                        <Text style={[styles.filterText, { fontSize: 11, color: subFilter === sub.value ? '#fff' : theme.colors.text }]}>{sub.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {filteredLibrary.length > 0 ? (
                            filteredLibrary.map((item) => (
                                <TouchableOpacity key={item.id} style={styles.libraryItemCard} onPress={() => handleContentPress(item.content_type || 'book', item.content_id)}>
                                    {item.image_url ? (
                                        <Image source={{ uri: item.image_url }} style={styles.libraryBookCover} />
                                    ) : (
                                        <View style={[styles.libraryBookCover, { justifyContent: 'center', alignItems: 'center', backgroundColor: item.content_type === 'movie' ? '#E50914' : theme.colors.secondary }]}>
                                            <Icon name={item.content_type === 'movie' ? 'film' : 'book-open'} size={24} color="#FFF" />
                                        </View>
                                    )}
                                    <View style={styles.libraryItemContent}>
                                        <View>
                                            <Text style={styles.libraryItemTitle} numberOfLines={2}>{item.content_title || 'İsimsiz Eser'}</Text>
                                            {item.author && <Text style={styles.libraryItemAuthor} numberOfLines={1}>{item.author}</Text>}
                                        </View>
                                        <View style={styles.libraryMetaRow}>
                                            <View style={[styles.statusBadge, { backgroundColor: item.status === 'read' ? '#4CAF50' : item.status === 'reading' ? '#2196F3' : '#FFC107' }]}>
                                                <Text style={styles.statusText}>
                                                    {getStatusText(item.status, item.content_type)}
                                                </Text>
                                            </View>
                                            <Text style={styles.libraryItemDate}>{new Date(item.updated_at).toLocaleDateString()} güncellendi</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <EmptyState icon="book-open" text={libraryFilter === 'all' ? "Kütüphaneniz boş." : "Bu kategoride içerik yok."} />
                        )}
                    </View>
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
                <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => setMenuVisible(!menuVisible)}
                >
                    <Icon name="options-vertical" size={20} color="#FFF" />
                </TouchableOpacity>

                {/* Dropdown Menu */}
                {menuVisible && (
                    <TouchableOpacity
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setMenuVisible(false)}
                    >
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    setBlockDialogVisible(true);
                                }}
                            >
                                <Text style={styles.menuItemTextDestructive}>Engelle</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
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
                    <StatItem number={libraryItems.filter(i => (i.content_type === 'book' || !i.content_type) && i.status === 'read').length} label="Kitap" />
                    <StatItem number={libraryItems.filter(i => i.content_type === 'movie' && i.status === 'read').length} label="Film" />
                    <StatItem
                        number={profile?.follower_count || 0}
                        label="Takipçi"
                        onPress={() => (navigation as any).navigate('FollowList', { userId: userId, type: 'followers' })}
                    />
                    <StatItem
                        number={profile?.following_count || 0}
                        label="Takip"
                        onPress={() => (navigation as any).navigate('FollowList', { userId: userId, type: 'following' })}
                    />
                    <StatItem number={userReviews.length} label="İnceleme" onPress={() => setActiveTab('reviews')} />
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
                onDirectRepost={handleDirectRepost}
                onQuoteRepost={handleQuoteRepost}
            />

            <ThemedDialog
                visible={blockDialogVisible}
                title="Kullanıcıyı Engelle"
                message={`@${profile.username} adlı kullanıcıyı engellemek istediğinize emin misiniz? Birbirinizin gönderilerini göremeyecek ve mesajlaşamayacaksınız.`}
                actions={[
                    {
                        text: 'Vazgeç',
                        style: 'cancel',
                        onPress: () => setBlockDialogVisible(false)
                    },
                    {
                        text: 'Engelle',
                        style: 'destructive',
                        onPress: handleBlockUser
                    }
                ]}
                onClose={() => setBlockDialogVisible(false)}
            />
        </ScrollView >
    );
};




