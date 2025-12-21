import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Share, Dimensions, LayoutAnimation, UIManager } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { postService, userService, libraryService, reviewService, interactionService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from '../../components/PostCard';
import { QuoteCard } from '../../components/QuoteCard';
import { ReviewCard } from '../../components/ReviewCard';
import { SkeletonPost } from '../../components/ui/SkeletonPost';
import Toast from 'react-native-toast-message';
import { ThemedDialog } from '../../components/ThemedDialog';
import { ArrowLeft, MessageCircle, Share2, MoreVertical, Users, UserPlus, MessageSquare, BookOpen, Film, Calendar, MapPin, Music, Package, Pencil } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export const OtherProfileScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params as { userId?: number } | undefined;
    const userId = params?.userId;

    if (!userId) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Kullanıcı ID bulunamadı.</Text>
            </View>
        );
    }
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
            height: 192,
            width: '100%',
            position: 'relative',
        },
        headerImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        headerGradient: {
            ...StyleSheet.absoluteFillObject,
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

        profileHeaderContent: {
            marginTop: -64,
            paddingHorizontal: 16,
            paddingBottom: 12,
        },
        avatarRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 16,
        },
        avatarContainer: {
            position: 'relative',
        },
        avatar: {
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 4,
            borderColor: theme.colors.background,
        },
        headerActions: {
            flexDirection: 'row',
            gap: 8,
            paddingBottom: 12,
        },
        iconBtn: {
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
        },
        userInfo: {
            marginBottom: 20,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
        },
        name: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.colors.text,
        },
        username: {
            fontSize: 15,
            fontWeight: '500',
            color: theme.colors.textSecondary,
            marginBottom: 12,
        },
        bio: {
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.text,
            marginBottom: 12,
        },
        metaRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        metaText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        statsGrid: {
            gap: 12,
            marginBottom: 12,
        },
        socialStatsRow: {
            flexDirection: 'row',
            gap: 12,
        },
        statCard: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            gap: 12,
        },
        statIconCircle: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
        },
        statValue: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
        },
        statLabel: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        activityStatsRow: {
            flexDirection: 'row',
            gap: 12,
        },
        activityCard: {
            flex: 1,
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
        },
        tabContainer: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            marginBottom: 16,
        },
        tabItem: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
        },
        contentArea: {
            minHeight: 200,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            padding: 16,
        },
        gridItem: {
            width: (Dimensions.get('window').width - 32 - 16) / 3, // 3 columns, minus padding and gap
            aspectRatio: 2 / 3,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: theme.colors.surface, // Fixed dark mode issue
            marginBottom: 8,
        },
        gridImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        readingBadge: {
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: theme.colors.primary,
            padding: 4,
            borderRadius: 4,
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
    const [userReplies, setUserReplies] = useState<any[]>([]);
    const [isRepliesLoading, setIsRepliesLoading] = useState(false);
    const [userReviews, setUserReviews] = useState<any[]>([]);
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [libraryFilter, setLibraryFilter] = useState<'all' | 'book' | 'movie' | 'music'>('all');
    const [subFilter, setSubFilter] = useState<'all' | 'read' | 'reading' | 'want_to_read' | 'dropped'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<any>(null);

    // Interaction State
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

    // Block Dialog State
    const [blockDialogVisible, setBlockDialogVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);



    // Mock Header Image (Random Library/Aesthetic)
    const headerImage = profile?.header_image_url || 'https://images.unsplash.com/photo-1507842217121-9e96e4430330?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

    const [isFollowing, setIsFollowing] = useState(false);



    const fetchUserProfile = async () => {
        if (!userId) return;
        if (!refreshing) setIsLoading(true);
        try {
            const profileData = await userService.getUserProfile(userId, currentUser?.id);
            setProfile(profileData);
        } catch (profileError) {
            console.error('Error fetching profile:', profileError);
        }
    };

    const checkFollowStatus = async () => {
        if (!currentUser || !profile) return;
        try {
            const status = await userService.checkFollowStatus(currentUser.id, profile.id);
            setIsFollowing(status.is_following);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const fetchUserPosts = async () => {
        if (!userId) return;
        if (!refreshing) setIsLoading(true);
        try {
            const data = await postService.getFeed(userId);
            // Filter posts for this user
            const myPosts = data
                .filter((post: any) => {
                    const postOwnerId = post.user.id;
                    // Check if it's the user's post or a repost by the user
                    // For reposts, the structure usually has a 'user' field indicating who posted/reposted
                    return postOwnerId === userId;
                })
                .sort((a: any, b: any) => {
                    const pinA = (a.is_pinned === 1 || a.is_pinned === '1' || a.is_pinned === true) ? 1 : 0;
                    const pinB = (b.is_pinned === 1 || b.is_pinned === '1' || b.is_pinned === true) ? 1 : 0;
                    return pinB - pinA;
                });

            setUserPosts(myPosts);
        } catch (error) {
            console.error('Posts fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUserReplies = async () => {
        if (!userId) return;
        setIsRepliesLoading(true);
        try {
            // NOTE: Assuming getFeed supports 'replies' filter to return comments/replies of the user
            const data = await postService.getFeed(userId, 'replies');
            setUserReplies(data);
        } catch (error) {
            console.error('Replies fetch error:', error);
        } finally {
            setIsRepliesLoading(false);
        }
    };

    const fetchLibraryItems = async () => {
        if (!userId) return;
        try {
            const libraryData = await libraryService.getUserLibrary(userId);
            setLibraryItems(libraryData);
        } catch (libraryError) {
            console.error('Error fetching library:', libraryError);
        }
    };

    const fetchUserReviews = async () => {
        if (!userId) return;
        try {
            const reviewsData = await reviewService.getUserReviews(userId);
            setUserReviews(reviewsData);
        } catch (reviewError) {
            console.error('Error fetching reviews:', reviewError);
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

    // Initial load: Fetch main data once when userId changes
    useEffect(() => {
        if (userId) {
            fetchUserProfile();
            fetchUserPosts();
            fetchLibraryItems();
            fetchUserReviews();
            if (currentUser) {
                checkFollowStatus();
            }
        }
    }, [userId, currentUser]);

    // Tab switch: Fetch data only if needed (Lazy Loading)
    useEffect(() => {
        if (userId) {
            if (activeTab === 'replies' && userReplies.length === 0) {
                fetchUserReplies();
            }
        }
    }, [activeTab, userId]);

    // Animation Value for Tab Slide
    const translateX = useSharedValue(0);
    const tabOrder = ['posts', 'replies', 'book', 'movie', 'music', 'reviews'];

    const getTabIndex = (tab: string) => {
        return tabOrder.indexOf(tab);
    };

    // Tab changed animation
    useEffect(() => {
        const index = getTabIndex(activeTab);
        if (index !== -1) {
            const config = { damping: 30, stiffness: 250, mass: 1 };
            translateX.value = withSpring(-index * width, config);
        }
    }, [activeTab]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

    useEffect(() => {
        fetchNowPlaying();
        const interval = setInterval(fetchNowPlaying, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchUserPosts();
        if (activeTab === 'replies') fetchUserReplies();
        fetchLibraryItems();
        fetchUserProfile();
        fetchUserReviews();
        if (currentUser) {
            checkFollowStatus();
        }
    }, [userId, currentUser, activeTab]);

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
                <SkeletonPost />
                <SkeletonPost />
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

    // Interaction logic moved to PostCard internal hook

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

    const EmptyState = ({ icon: IconComponent, text }: { icon: any, text: string }) => (
        <View style={styles.emptyContainer}>
            <IconComponent size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
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

    const renderTabContent = (currentTab: string) => {
        switch (currentTab) {
            case 'posts':
                if (isLoading && !refreshing) {
                    return (
                        <View>
                            <SkeletonPost />
                            <SkeletonPost />
                            <SkeletonPost />
                        </View>
                    );
                }
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
                            onComment={() => (navigation as any).navigate('PostDetail', { postId: post.id, autoFocusComment: true })}
                            onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                            onShare={async () => {
                                try {
                                    await Share.share({
                                        message: `KültüraX'ta bu gönderiye bak: ${post.content || 'İçerik'}`,
                                        url: `https://kulturax.app/p/${post.id}`
                                    });
                                } catch (e) { }
                            }}
                            onUpdatePost={(updater) => setUserPosts(prev => prev.map(updater))}
                        />
                    ))
                ) : (
                    <EmptyState icon={Package} text="Henüz gönderi yok." />
                );
            case 'replies':
                if (isRepliesLoading && !refreshing) {
                    return (
                        <View>
                            <SkeletonPost />
                            <SkeletonPost />
                            <SkeletonPost />
                        </View>
                    );
                }

                // Use userReplies state if available, otherwise fallback to filtering userPosts
                const sourceData = userReplies.length > 0 ? userReplies : userPosts;
                const repliesOnly = sourceData.filter(p => p.reply_to_post_id || p.type === 'comment');

                // Ensure we filter sourceData regardless of where it came from
                const dataToShow = repliesOnly;

                return dataToShow.length > 0 ? (
                    dataToShow.map((post) => (
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
                            onComment={() => {
                                const targetId = post.type === 'comment' && post.reply_to_post_id ? post.reply_to_post_id : post.id;
                                (navigation as any).navigate('PostDetail', { postId: targetId, autoFocusComment: true });
                            }}
                            onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                            onShare={async () => {
                                try {
                                    await Share.share({
                                        message: `KültüraX'ta bu gönderiye bak: ${post.content || 'İçerik'}`,
                                        url: `https://kulturax.app/p/${post.id}`
                                    });
                                } catch (e) { }
                            }}
                            onUpdatePost={(updater) => {
                                setUserPosts(prev => prev.map(updater));
                                setUserReplies(prev => prev.map(updater));
                            }}
                        />
                    ))
                ) : (
                    <EmptyState icon={MessageSquare} text="Henüz yanıt yok." />
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
                            onComment={() => (navigation as any).navigate('PostDetail', { postId: post.id, autoFocusComment: true })}
                            onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                            onUpdatePost={(updater) => setUserPosts(prev => prev.map(updater))}
                        />
                    ))
                ) : (
                    <EmptyState icon={MessageSquare} text="Henüz alıntı yok." />
                );

            case 'book':
            case 'movie':
            case 'music':
                // Filter items based on the active tab
                const filteredItems = libraryItems.filter(item => {
                    if (activeTab === 'book') return item.content_type === 'book';
                    if (activeTab === 'movie') return item.content_type === 'movie';
                    if (activeTab === 'music') return item.content_type === 'music';
                    return false;
                });

                if (filteredItems.length === 0) {
                    const emptyText = activeTab === 'book' ? 'Henüz kitap eklememiş.' : activeTab === 'movie' ? 'Henüz film eklememiş.' : 'Henüz müzik eklememiş.';
                    const EmptyIcon = activeTab === 'book' ? BookOpen : activeTab === 'movie' ? Film : Music;
                    return <EmptyState icon={EmptyIcon} text={emptyText} />;
                }

                return (
                    <View style={styles.gridContainer}>
                        {filteredItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.gridItem}
                                onPress={() => handleContentPress(item.content_type || 'book', item.content_id)}
                            >
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={styles.gridImage} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.gridImage, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                                        {item.content_type === 'movie' ? <Film size={24} color={theme.colors.textSecondary} /> : item.content_type === 'music' ? <Music size={24} color={theme.colors.textSecondary} /> : <BookOpen size={24} color={theme.colors.textSecondary} />}
                                    </View>
                                )}
                                {item.status === 'reading' && (
                                    <View style={styles.readingBadge}>
                                        <BookOpen size={10} color="#FFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 'reviews':
                return userReviews.length > 0 ? (
                    userReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))
                ) : (
                    <EmptyState icon={Pencil} text="Henüz inceleme yok." />
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
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
                    style={styles.headerGradient}
                />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFF" />
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

            {/* Profile Header Content (Overlapping) */}
            <View style={styles.profileHeaderContent}>
                {/* Avatar & Action Button Row */}
                <View style={styles.avatarRow}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                    </View>

                    <View style={styles.headerActions}>
                        {/* Mesaj Gönder Butonu */}
                        {currentUser && currentUser.id !== profile.id && (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.iconBtn,
                                        {
                                            backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary,
                                            borderColor: isFollowing ? theme.colors.border : 'transparent',
                                            paddingHorizontal: 20,
                                        }
                                    ]}
                                    onPress={handleFollow}
                                >
                                    <Text style={{
                                        color: isFollowing ? theme.colors.text : '#FFF',
                                        fontWeight: '600'
                                    }}>
                                        {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.iconBtn}
                                    onPress={handleMessagePress}
                                >
                                    <MessageCircle size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Paylaş Butonu */}
                        <TouchableOpacity style={styles.iconBtn} onPress={handleShareProfile}>
                            <Share2 size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => setMenuVisible(!menuVisible)}
                        >
                            <MoreVertical size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    {/* Dropdown Menu Overlay was here but moved to dialog or modal logic ideally. Keeping layout same as design */}
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{profile.full_name || profile.username}</Text>
                    </View>
                    <Text style={styles.username}>@{profile.username}</Text>

                    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <MapPin size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.metaText}>{profile.location || 'İstanbul'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.metaText}>Katılım: {profile.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) : 'Bilinmiyor'}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Followers/Following */}
                    <View style={styles.socialStatsRow}>
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                            onPress={() => (navigation as any).navigate('FollowList', { userId: userId, type: 'followers' })}
                        >
                            <View style={[styles.statIconCircle, { backgroundColor: theme.colors.background }]}>
                                <Users size={16} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.follower_count || 0}</Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Takipçi</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                            onPress={() => (navigation as any).navigate('FollowList', { userId: userId, type: 'following' })}
                        >
                            <View style={[styles.statIconCircle, { backgroundColor: theme.colors.background }]}>
                                <UserPlus size={16} color={theme.colors.secondary} />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.following_count || 0}</Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Takip</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <View style={[styles.statIconCircle, { backgroundColor: theme.colors.background }]}>
                                <MessageSquare size={16} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>{userPosts.length || 0}</Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Gönderi</Text>
                            </View>
                        </View>
                    </View>

                    {/* Activity Stats */}
                    <View style={styles.activityStatsRow}>
                        <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <BookOpen size={14} color={theme.colors.primary} />
                                <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Kitap</Text>
                            </View>
                            <Text
                                style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {libraryItems.filter(i => (i.content_type === 'book' || !i.content_type) && i.status === 'read').length}
                            </Text>
                        </View>
                        <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Film size={14} color={theme.colors.primary} />
                                <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Film</Text>
                            </View>
                            <Text
                                style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {libraryItems.filter(i => i.content_type === 'movie' && i.status === 'read').length}
                            </Text>
                        </View>
                        <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Calendar size={14} color={theme.colors.primary} />
                                <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Etkinlik</Text>
                            </View>
                            <Text
                                style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {libraryItems.filter(i => ['music', 'event', 'theater', 'concert'].includes(i.content_type) && i.status === 'read').length}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
                {['posts', 'replies', 'book', 'movie', 'music', 'reviews'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.colors.primary }]}
                        onPress={() => {
                            if (tab === 'replies' && userReplies.length === 0) {
                                setIsRepliesLoading(true);
                            }
                            setActiveTab(tab);
                        }}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary }]}>
                            {tab === 'posts' ? 'Gönderiler' : tab === 'replies' ? 'Yanıtlar' : tab === 'book' ? 'Kitaplar' : tab === 'movie' ? 'Filmler' : tab === 'music' ? 'Müzik' : 'İncelemeler'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Section */}
            <View style={[styles.contentArea, { overflow: 'hidden' }]}>
                <Animated.View style={[
                    { flexDirection: 'row', width: width * 6 },
                    animatedStyle
                ]}>
                    <View style={{ width, paddingHorizontal: 20, paddingBottom: 20 }}>{renderTabContent('posts')}</View>
                    <View style={{ width, paddingHorizontal: 20, paddingBottom: 20 }}>{renderTabContent('replies')}</View>
                    <View style={{ width }}>{renderTabContent('book')}</View>
                    <View style={{ width }}>{renderTabContent('movie')}</View>
                    <View style={{ width }}>{renderTabContent('music')}</View>
                    <View style={{ width }}>{renderTabContent('reviews')}</View>
                </Animated.View>
            </View>



            <View style={{ height: 100 }} />

            <View style={{ height: 100 }} />

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





