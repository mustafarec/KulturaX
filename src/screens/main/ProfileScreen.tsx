import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Platform, UIManager, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PostCard } from '../../components/PostCard';
import { Avatar } from '../../components/ui/Avatar';
import { SkeletonPost } from '../../components/ui/SkeletonPost';
import { Skeleton, SkeletonCircle } from '../../components/Skeleton';
import LinearGradient from 'react-native-linear-gradient';
import { Share2, MoreVertical, Film, BookOpen, Heart, MessageCircle, Bookmark, Settings, Repeat, Music, Ghost, Crown, MapPin, Link, Calendar, Users, UserPlus, MessageSquare, Package, Star } from 'lucide-react-native';
import { postService, userService, libraryService, reviewService, interactionService } from '../../services/backendApi';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import { usePostInteractions } from '../../hooks/usePostInteractions';
import { LibraryBottomSheet } from '../../components/LibraryBottomSheet';

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ShareOptionsSheet } from '../../components/ShareOptionsSheet';
import { ShareCardModal } from '../../components/ShareCardModal';
import { ContentType } from '../../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export const ProfileScreen = () => {
    const { user, updateUser } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();

    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [userReplies, setUserReplies] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [userReviews, setUserReviews] = useState<any[]>([]);
    const [libraryItems, setLibraryItems] = useState<any[]>([]);

    // Derived stats from library items
    const [stats, setStats] = useState({
        booksRead: 0,
        moviesWatched: 0,
        eventsCount: 0,
        follower_count: 0,
        following_count: 0
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentlyReading, setCurrentlyReading] = useState<any>(null);

    // Options Modal State
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    const [profileMenuVisible, setProfileMenuVisible] = useState(false);
    const [shareOptionsVisible, setShareOptionsVisible] = useState(false);
    const [shareCardVisible, setShareCardVisible] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);

    // Library status sheet state
    const [librarySheetVisible, setLibrarySheetVisible] = useState(false);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

    // Mock Banner if not present, and Profile Image
    const headerImage = React.useMemo(() =>
        user?.header_image_url
            ? `${user.header_image_url}?t = ${new Date().getTime()} `
            : null,
        [user?.header_image_url, user?.avatar_url, user?.updated_at, user]); // Depend on user object changes

    const profileImage = React.useMemo(() =>
        user?.avatar_url
            ? `${user.avatar_url}?t = ${new Date().getTime()} `
            : null,
        [user?.avatar_url, user?.updated_at, user]);

    const fetchUserPosts = async () => {
        if (!refreshing) setIsLoading(true);
        try {
            const data = await postService.getFeed(user?.id);
            const myPosts = data
                .filter((post: any) => post.user.username === user?.username)
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

    const [isRepliesLoading, setIsRepliesLoading] = useState(false);

    const fetchUserReplies = async () => {
        // Assuming there is a way to filter replies via getFeed or similar
        // If not, we might need a specific endpoint. 
        // Trying with filter='replies' if backend supports it, otherwise relying on what we have.
        if (!user) return;
        setIsRepliesLoading(true);
        try {
            // NOTE: Assuming getFeed supports 'replies' filter to return comments/replies of the user
            const data = await postService.getFeed(user.id, 'replies');
            setUserReplies(data);
        } catch (error) {
            console.error('Replies fetch error:', error);
        } finally {
            setIsRepliesLoading(false);
        }
    };

    const fetchUserReviews = async () => {
        if (!user) return;
        try {
            const reviews = await reviewService.getUserReviews(user.id);
            setUserReviews(reviews);
        } catch (error) {
            console.error('Review fetch error:', error);
        }
    };

    const fetchLibraryItems = async () => {
        if (!user) return;
        try {
            const items = await libraryService.getUserLibrary(user.id);
            setLibraryItems(items);

            // Calculate Stats
            // Calculate Stats
            const booksRead = items.filter((i: any) => i.content_type === 'book' && i.status === 'read').length;
            const moviesWatched = items.filter((i: any) => i.content_type === 'movie' && i.status === 'read').length;
            const eventsCount = items.filter((i: any) => ['music', 'event', 'theater', 'concert'].includes(i.content_type) && i.status === 'read').length;

            setStats(prev => ({ ...prev, booksRead, moviesWatched, eventsCount }));
        } catch (error) {
            console.error('Library fetch error:', error);
        }
    };

    const fetchProfileStats = async () => {
        if (!user) return;
        if (!refreshing) setIsStatsLoading(true);
        try {
            const data = await userService.getUserProfile(user.id);
            setStats(prev => ({
                ...prev,
                follower_count: data.follower_count || 0,
                following_count: data.following_count || 0
            }));
        } catch (error) {
            console.error('Stats fetch error:', error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchUserPosts();
        if (activeTab === 'replies') fetchUserReplies();
        fetchLibraryItems();
        fetchProfileStats();
        fetchUserReviews();
    }, [activeTab]);

    // Animation Value for Tab Slide
    const translateX = useSharedValue(0);
    const tabOrder = ['posts', 'replies', 'book', 'movie', 'music'];

    const getTabIndex = (tab: string) => {
        return tabOrder.indexOf(tab);
    };

    // Tab changed animation
    useEffect(() => {
        const index = getTabIndex(activeTab);
        if (index !== -1) {
            const config = { damping: 30, stiffness: 250, mass: 1 };
            translateX.value = withSpring(-index * SCREEN_WIDTH, config);
        }
    }, [activeTab]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

    // Initial load: Fetch main data once when user is available
    useEffect(() => {
        if (user) {
            fetchUserPosts();
            fetchLibraryItems();
            fetchProfileStats();
            fetchUserReviews();
        }
    }, [user]);

    // Tab switch: Fetch data only if needed
    useEffect(() => {
        if (user) {
            if (activeTab === 'replies' && userReplies.length === 0) {
                fetchUserReplies();
            }
        }
    }, [activeTab, user]);

    useEffect(() => {
        if (libraryItems.length > 0) {
            const reading = libraryItems.find(item => item.status === 'reading' && item.content_type === 'book');
            setCurrentlyReading(reading || null);
        }
    }, [libraryItems]);

    const handleContentPress = (type: ContentType, id: string) => {
        (navigation as any).navigate('ContentDetail', { id: id, type: type });
    };

    const handleOptionsPress = React.useCallback((item: any, position: { x: number; y: number; width: number; height: number }) => {
        setSelectedPostForOptions(item);
        setMenuPosition(position);
        setOptionsModalVisible(true);
    }, []);

    const handleDelete = () => {
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        const item = selectedPostForOptions;
        if (!item || !user) return;
        try {
            await postService.delete(item.id);
            setUserPosts(prev => prev.filter(p => p.id !== item.id));
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Gönderi silindi.' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Silinemedi.' });
        } finally {
            setDeleteDialogVisible(false);
            setOptionsModalVisible(false);
            setSelectedPostForOptions(null);
        }
    };

    const handleTogglePin = async () => {
        const item = selectedPostForOptions;
        if (!item) return;

        // Optimistic Update
        const newPinnedStatus = !item.is_pinned;

        if (newPinnedStatus) {
            const pinnedCount = userPosts.filter(p => p.is_pinned).length;
            if (pinnedCount >= 3) {
                Toast.show({ type: 'error', text1: 'Limit', text2: 'En fazla 3 gönderi sabitleyebilirsiniz.' });
                return;
            }
        }

        const updatedPosts = userPosts.map(p => {
            if (p.id === item.id) return { ...p, is_pinned: newPinnedStatus };
            return p;
        }).sort((a: any, b: any) => {
            const pinA = (a.is_pinned === 1 || a.is_pinned === '1' || a.is_pinned === true) ? 1 : 0;
            const pinB = (b.is_pinned === 1 || b.is_pinned === '1' || b.is_pinned === true) ? 1 : 0;
            return pinB - pinA;
        });

        setUserPosts(updatedPosts);

        try {
            const response = await postService.togglePin(item.id);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: response.message });
        } catch (error: any) {
            console.error("Pin failed", error);
            // Revert
            const revertPosts = userPosts.map(p => {
                if (p.id === item.id) return { ...p, is_pinned: !newPinnedStatus };
                return p;
            }).sort((a: any, b: any) => {
                const pinA = (a.is_pinned === 1 || a.is_pinned === '1' || a.is_pinned === true) ? 1 : 0;
                const pinB = (b.is_pinned === 1 || b.is_pinned === '1' || b.is_pinned === true) ? 1 : 0;
                return pinB - pinA;
            });
            setUserPosts(revertPosts);
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'İşlem başarısız.' });
        }
    };

    // Repost logic handled by PostCard internal hook


    const handleShareProfile = () => {
        setSelectedPostForShare(null); // Clear any selected post
        setShareCardVisible(true); // Directly open share card
    };

    const handleShareDM = () => {
        setShareOptionsVisible(false);
        if (selectedPostForShare) {
            // Navigate to DM with post share
            (navigation as any).navigate('NewMessage', { sharedPost: selectedPostForShare });
        } else {
            // Navigate to DM with profile share
            (navigation as any).navigate('NewMessage', { sharedProfile: user });
        }
    };

    const handleShareStory = () => {
        setShareOptionsVisible(false);
        setShareCardVisible(true);
    };

    const renderPosts = (currentTab: string) => {
        if (isLoading && !refreshing) {
            return (
                <View style={{ padding: 16 }}>
                    <SkeletonPost />
                    <SkeletonPost />
                    <SkeletonPost />
                </View>
            );
        }

        if (currentTab === 'replies') {
            if (isRepliesLoading && !refreshing) {
                return (
                    <View style={{ padding: 16 }}>
                        <SkeletonPost />
                        <SkeletonPost />
                        <SkeletonPost />
                    </View>
                );
            }

            // Use userReplies state if available, otherwise fallback to filtering userPosts
            const sourceData = userReplies.length > 0 ? userReplies : userPosts;
            const repliesOnly = sourceData.filter(p => p.reply_to_post_id || p.type === 'comment');

            // If we fetched specifically replies, maybe we don't need to filter, but let's be safe
            // Ensure we filter sourceData regardless of where it came from
            const dataToShow = repliesOnly;

            return dataToShow.length > 0 ? (
                dataToShow.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onPress={() => {
                            const targetId = post.reply_to_post_id;
                            if (targetId) {
                                (navigation as any).navigate('PostDetail', { postId: targetId });
                            }
                        }}
                        currentUserId={user?.id}
                        onUserPress={() => { }}
                        onContentPress={handleContentPress}
                        onOptions={(pos) => handleOptionsPress(post, pos)}
                        onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                        onComment={() => {
                            const targetId = post.type === 'comment' && post.reply_to_post_id ? post.reply_to_post_id : post.id;
                            (navigation as any).navigate('PostDetail', { postId: targetId, autoFocusComment: true });
                        }}
                        onShare={() => {
                            setSelectedPostForShare(post);
                            setShareOptionsVisible(true);
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
        }

        const postsOnly = userPosts.filter(p => p.type !== 'quote' && !p.reply_to_post_id && p.type !== 'comment');
        return postsOnly.length > 0 ? (
            postsOnly.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    onPress={() => (navigation as any).navigate('PostDetail', { postId: post.id })}
                    currentUserId={user?.id}
                    onUserPress={() => { }}
                    onContentPress={handleContentPress}
                    onOptions={(pos) => handleOptionsPress(post, pos)}
                    onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                    onComment={() => (navigation as any).navigate('PostDetail', { postId: post.id, autoFocusComment: true })}
                    onShare={() => {
                        setSelectedPostForShare(post);
                        setShareOptionsVisible(true);
                    }}
                    onUpdatePost={(updater) => setUserPosts(prev => prev.map(updater))}
                />
            ))
        ) : (
            <EmptyState icon={Package} text="Henüz gönderi yok." />
        );
    };

    const getStatusLabel = (status: string, type: string) => {
        switch (status) {
            case 'read': return type === 'movie' ? 'İzledim' : type === 'music' ? 'Dinledim' : 'Okudum';
            case 'reading': return type === 'movie' ? 'İzliyorum' : type === 'music' ? 'Dinliyorum' : 'Okuyorum';
            case 'want_to_read': return type === 'movie' ? 'İzleyeceğim' : type === 'music' ? 'Dinleyeceğim' : 'Okuyacağım';
            case 'want_to_watch': return 'İzleyeceğim';
            case 'want_to_listen': return 'Dinleyeceğim';
            case 'dropped': return 'Bıraktım';
            default: return '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'read': return '#10B981'; // green
            case 'reading': return '#3B82F6'; // blue
            case 'want_to_read':
            case 'want_to_watch':
            case 'want_to_listen': return '#F59E0B'; // amber
            case 'dropped': return '#EF4444'; // red
            default: return '#6B7280'; // gray
        }
    };

    const renderGridContent = (type: 'book' | 'movie' | 'music') => {
        const filtered = libraryItems.filter(item => item.content_type === type);

        if (filtered.length === 0) return <EmptyState icon={Ghost} text="Henüz içerik yok." />;

        const handleOpenStatusSheet = (item: any) => {
            setSelectedLibraryItem(item);
            setLibrarySheetVisible(true);
        };

        return (
            <View style={styles.listContainer}>
                {filtered.map((item) => (
                    <View key={item.id} style={[styles.listItem, { justifyContent: 'space-between' }]}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', flex: 1 }}
                            onPress={() => handleContentPress(item.content_type, item.content_id)}
                            activeOpacity={0.7}
                        >
                            {/* Start: Content Poster */}
                            <View style={styles.listPosterContainer}>
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={styles.listPoster} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.listPoster, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                                        {type === 'movie' ? <Film size={20} color={theme.colors.textSecondary} /> : type === 'music' ? <Music size={20} color={theme.colors.textSecondary} /> : <BookOpen size={20} color={theme.colors.textSecondary} />}
                                    </View>
                                )}
                            </View>
                            {/* End: Content Poster */}

                            {/* Start: Info Column */}
                            <View style={styles.listInfo}>
                                <View>
                                    <Text style={[styles.listTitle, { color: theme.colors.text }]} numberOfLines={1}>
                                        {item.content_title || 'Başlık Yok'}
                                    </Text>
                                    {/* Subtitle: Author/Artist/Director - ONLY if available */}
                                    {(item.content_subtitle || item.creator) && (
                                        <Text style={[styles.listSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                            {item.content_subtitle || item.creator}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.listMetaRow}>
                                    {item.status && (
                                        <View style={[styles.listStatusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                            <Text style={[styles.listStatusText, { color: getStatusColor(item.status) }]}>
                                                {getStatusLabel(item.status, type)}
                                            </Text>
                                        </View>
                                    )}
                                    {/* Rating if available */}
                                    {item.rating > 0 && (
                                        <View style={styles.listRating}>
                                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                            <Text style={styles.listRatingText}>{item.rating}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            {/* End: Info Column */}
                        </TouchableOpacity>

                        {/* 3-dot menu for status update */}
                        <TouchableOpacity
                            style={{ padding: 8, justifyContent: 'center' }}
                            onPress={() => handleOpenStatusSheet(item)}
                        >
                            <MoreVertical size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };

    // Profile Header Skeleton - OtherProfileScreen'deki gibi
    const ProfileHeaderSkeleton = () => (
        <View style={styles.profileHeaderContent}>
            {/* Avatar Row Skeleton */}
            <View style={styles.avatarRow}>
                <View style={styles.avatarContainer}>
                    <SkeletonCircle size={100} />
                </View>
                <View style={styles.headerActions}>
                    <Skeleton width={44} height={44} borderRadius={12} />
                    <Skeleton width={44} height={44} borderRadius={12} />
                </View>
            </View>

            {/* User Info Skeleton */}
            <View style={styles.userInfo}>
                <Skeleton width={150} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
                <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 16 }} />
                <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />

                {/* Meta Row Skeleton */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Skeleton width={80} height={14} borderRadius={4} />
                    <Skeleton width={100} height={14} borderRadius={4} />
                </View>
            </View>

            {/* Stats Grid Skeleton */}
            <View style={styles.statsGrid}>
                <View style={styles.socialStatsRow}>
                    <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={30} height={20} borderRadius={4} />
                    </View>
                    <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={30} height={20} borderRadius={4} />
                    </View>
                    <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={30} height={20} borderRadius={4} />
                    </View>
                </View>
                <View style={styles.activityStatsRow}>
                    <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Skeleton width={50} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={30} height={20} borderRadius={4} />
                    </View>
                    <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Skeleton width={50} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={30} height={20} borderRadius={4} />
                    </View>
                    <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Skeleton width={50} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width={30} height={20} borderRadius={4} />
                    </View>
                </View>
            </View>
        </View>
    );

    const EmptyState = ({ icon: IconComponent, text }: { icon: any, text: string }) => (
        <View style={styles.emptyContainer}>
            <IconComponent size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );

    if (!user) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Banner Section */}
                <View style={styles.bannerContainer}>
                    {headerImage ? (
                        <Image source={{ uri: headerImage }} style={styles.bannerImage} />
                    ) : (
                        <View style={[styles.bannerImage, { backgroundColor: theme.colors.border }]} />
                    )}
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
                        style={styles.bannerGradient}
                    />
                </View>



                {/* Profile Header Content (Overlapping) */}
                <View style={styles.profileHeaderContent}>
                    {/* Avatar & Action Button Row */}
                    <View style={styles.avatarRow}>
                        <View style={styles.avatarContainer}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={[styles.avatar, { borderColor: theme.colors.background }]} />
                            ) : (
                                <View style={[styles.avatar, { borderColor: theme.colors.background, backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 32, fontWeight: '600' }}>
                                        {(user?.full_name || user?.username || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            {/* Premium badge removed */}
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                onPress={handleShareProfile}
                            >
                                <Share2 size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                onPress={() => setProfileMenuVisible(true)}
                            >
                                <MoreVertical size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.name, { color: theme.colors.text }]}>{user.name || user.username}</Text>
                            {/* Premium tag removed */}
                        </View>
                        <Text style={[styles.username, { color: theme.colors.textSecondary }]}>@{user.username}</Text>

                        <Text style={[styles.bio, { color: theme.colors.text }]}>
                            {user.bio || 'Henüz bir biyografi eklenmemiş.'}
                        </Text>

                        {/* Meta Info */}
                        <View style={styles.metaRow}>
                            {user.location && (
                                <View style={styles.metaItem}>
                                    <MapPin size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{user.location}</Text>
                                </View>
                            )}
                            {user.website && (
                                <View style={styles.metaItem}>
                                    <Link size={14} color={theme.colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.colors.primary }]}>{user.website}</Text>
                                </View>
                            )}
                            <View style={styles.metaItem}>
                                <Calendar size={14} color={theme.colors.textSecondary} />
                                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                                    Katılım: {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) : 'Bilinmiyor'}
                                </Text>
                            </View>
                            {user.birth_date && (
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                                        🎂 {new Date(user.birth_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                </View>
                            )}
                            {(user.school || user.department) && (
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                                        🎓 {[user.school, user.department].filter(Boolean).join(' - ')}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {/* Interests */}
                        {(() => {
                            // Parse interests if it's a string
                            let interestsArray: string[] = [];
                            if (user.interests) {
                                if (typeof user.interests === 'string') {
                                    try {
                                        interestsArray = JSON.parse(user.interests);
                                    } catch (e) {
                                        interestsArray = [];
                                    }
                                } else if (Array.isArray(user.interests)) {
                                    interestsArray = user.interests;
                                }
                            }
                            return interestsArray.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                    {interestsArray.map((interest: string, index: number) => (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: theme.colors.primary + '15',
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 16
                                            }}
                                        >
                                            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '500' }}>
                                                {interest}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null;
                        })()}
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        {/* Followers/Following */}
                        <View style={styles.socialStatsRow}>
                            <TouchableOpacity
                                style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                onPress={() => (navigation as any).navigate('FollowList', { userId: user.id, type: 'followers' })}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Users size={14} color={theme.colors.primary} />
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Takipçi</Text>
                                </View>
                                {isStatsLoading ? (
                                    <Skeleton width={30} height={20} borderRadius={4} />
                                ) : (
                                    <Text
                                        style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >{stats.follower_count || 0}</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                onPress={() => (navigation as any).navigate('FollowList', { userId: user.id, type: 'following' })}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <UserPlus size={14} color={theme.colors.primary} />
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Takip</Text>
                                </View>
                                {isStatsLoading ? (
                                    <Skeleton width={30} height={20} borderRadius={4} />
                                ) : (
                                    <Text
                                        style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >{stats.following_count || 0}</Text>
                                )}
                            </TouchableOpacity>
                            <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <MessageSquare size={14} color={theme.colors.primary} />
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Gönderi</Text>
                                </View>
                                {isLoading && !refreshing ? (
                                    <Skeleton width={30} height={20} borderRadius={4} />
                                ) : (
                                    <Text
                                        style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >{userPosts.length || 0}</Text>
                                )}
                            </View>
                        </View>

                        {/* Activity Stats */}
                        <View style={styles.activityStatsRow}>
                            <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <BookOpen size={14} color={theme.colors.primary} />
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Kitap</Text>
                                </View>
                                {isStatsLoading ? (
                                    <Skeleton width={30} height={20} borderRadius={4} />
                                ) : (
                                    <Text
                                        style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >{stats.booksRead}</Text>
                                )}
                            </View>
                            <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Film size={14} color={theme.colors.primary} />
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Film</Text>
                                </View>
                                {isStatsLoading ? (
                                    <Skeleton width={30} height={20} borderRadius={4} />
                                ) : (
                                    <Text
                                        style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >{stats.moviesWatched}</Text>
                                )}
                            </View>
                            <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Calendar size={14} color={theme.colors.primary} />
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Etkinlik</Text>
                                </View>
                                {isStatsLoading ? (
                                    <Skeleton width={30} height={20} borderRadius={4} />
                                ) : (
                                    <Text
                                        style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, fontFamily: theme.fonts.headings }}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >{stats.eventsCount}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}
                    contentContainerStyle={styles.tabContentContainer}
                >
                    {['posts', 'replies', 'book', 'movie', 'music'].map((tab) => (
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
                                {tab === 'posts' ? 'Gönderiler' : tab === 'replies' ? 'Yanıtlar' : tab === 'book' ? 'Kitaplar' : tab === 'movie' ? 'Filmler' : 'Müzik'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Content Section */}
                {/* Animated Content Wrapper */}
                <View style={{ overflow: 'hidden', minHeight: 400 }}>
                    <Animated.View style={[
                        { flexDirection: 'row', width: SCREEN_WIDTH * 5 },
                        animatedStyle
                    ]}>
                        <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, paddingBottom: 20 }}>{renderPosts('posts')}</View>
                        <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, paddingBottom: 20 }}>{renderPosts('replies')}</View>
                        <View style={{ width: SCREEN_WIDTH }}>{renderGridContent('book')}</View>
                        <View style={{ width: SCREEN_WIDTH }}>{renderGridContent('movie')}</View>
                        <View style={{ width: SCREEN_WIDTH }}>{renderGridContent('music')}</View>
                    </Animated.View>
                </View>

            </ScrollView >

            <PostOptionsModal
                visible={optionsModalVisible}
                onClose={() => setOptionsModalVisible(false)}
                onDelete={handleDelete}
                targetPosition={menuPosition}
                isOwner={selectedPostForOptions?.user?.id === user?.id}
                isPinned={selectedPostForOptions?.is_pinned}
                onTogglePin={handleTogglePin}
            />

            <ThemedDialog
                visible={deleteDialogVisible}
                title="Gönderiyi Sil"
                message="Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                actions={[
                    { text: 'İptal', style: 'cancel', onPress: () => setDeleteDialogVisible(false) },
                    { text: 'Sil', style: 'destructive', onPress: confirmDelete }
                ]}
                onClose={() => setDeleteDialogVisible(false)}
            />

            {/* Profile Dropdown Menu */}
            {profileMenuVisible && (
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setProfileMenuVisible(false)}
                >
                    <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setProfileMenuVisible(false);
                                navigation.navigate('EditProfile' as never);
                            }}
                        >
                            <Settings size={18} color={theme.colors.text} />
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Profili Düzenle</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}

            <ShareOptionsSheet
                visible={shareOptionsVisible}
                onClose={() => setShareOptionsVisible(false)}
                onSelectDM={handleShareDM}
                onSelectStory={handleShareStory}
            />

            <ShareCardModal
                visible={shareCardVisible}
                onClose={() => setShareCardVisible(false)}
                shareType={selectedPostForShare ? "post" : "profile"}
                title={selectedPostForShare ? (selectedPostForShare.source || '') : (user?.full_name || user?.username || '')}
                username={user?.username || ''}
                bio={user?.bio || ''}
                coverUrl={selectedPostForShare ? selectedPostForShare.image_url : user?.avatar_url}
                followerCount={stats.follower_count}
                postCount={userPosts.length}
                postContent={selectedPostForShare?.comment_text || selectedPostForShare?.content || ''}
                postAuthor={selectedPostForShare?.user?.full_name || selectedPostForShare?.user?.username || ''}
                postAuthorAvatar={selectedPostForShare?.user?.avatar_url}
                quoteText={selectedPostForShare?.quote_text || ''}
                contentType={selectedPostForShare?.content_type || 'book'}
                isRepost={!!selectedPostForShare?.original_post_id}
                originalPostContent={selectedPostForShare?.original_post?.content || ''}
                originalPostAuthor={selectedPostForShare?.original_post?.user?.full_name || selectedPostForShare?.original_post?.user?.username || ''}
                originalPostAuthorAvatar={selectedPostForShare?.original_post?.user?.avatar_url}
                originalQuoteText={selectedPostForShare?.original_post?.quote_text || ''}
            />

            {/* Library Status Bottom Sheet */}
            <LibraryBottomSheet
                visible={librarySheetVisible}
                onClose={() => {
                    setLibrarySheetVisible(false);
                    setSelectedLibraryItem(null);
                }}
                contentType={selectedLibraryItem?.content_type || 'book'}
                currentStatus={selectedLibraryItem?.status || null}
                onSelectStatus={async (status: string) => {
                    if (!selectedLibraryItem || !user?.id) return;
                    try {
                        await libraryService.updateStatus(
                            selectedLibraryItem.content_type,
                            selectedLibraryItem.content_id,
                            status,
                            0,
                            selectedLibraryItem.content_title,
                            selectedLibraryItem.image_url,
                            selectedLibraryItem.creator,
                            undefined,
                            undefined,
                            undefined,
                            user.id
                        );
                        // Refresh library items
                        const updatedLibrary = await libraryService.getUserLibrary(user.id);
                        setLibraryItems(updatedLibrary || []);
                        Toast.show({
                            type: 'success',
                            text1: 'Güncellendi',
                            text2: 'Okuma durumu güncellendi.',
                        });
                    } catch (error) {
                        console.error('Error updating library status:', error);
                        Toast.show({
                            type: 'error',
                            text1: 'Hata',
                            text2: 'Durum güncellenemedi.',
                        });
                    }
                    setLibrarySheetVisible(false);
                    setSelectedLibraryItem(null);
                }}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerContainer: {
        height: 192,
        width: '100%',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerGradient: {
        ...StyleSheet.absoluteFillObject,
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
    },
    premiumBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981', // Emerald
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
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
    },
    editProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 6,
    },
    editProfileText: {
        fontWeight: '600',
        fontSize: 14,
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
        fontSize: 20,
        fontWeight: '800',
        // fontFamily: 'PlayfairDisplay-Bold', // Assuming font exists or fallback
    },
    premiumTag: {
        backgroundColor: '#10B981',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    username: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 12,
    },
    bio: {
        fontSize: 15,
        lineHeight: 22,
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
    },
    statsGrid: {
        gap: 12,
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 250, // Adjusted to position below the header actions
        right: 20,
        // backgroundColor: '#FFF', // Removed fixed color
        borderRadius: 12,
        borderWidth: 1, // Added border for better visibility in dark mode
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 160,
        zIndex: 101,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: '500',
    },
    socialStatsRow: {
        flexDirection: 'row',
        gap: 12,
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
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    tabContentContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginRight: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contentArea: {
        minHeight: 200,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingVertical: 8,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)', // Subtle separator
    },
    listPosterContainer: {
        width: 48,
        height: 72,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 14,
    },
    listPoster: {
        width: '100%',
        height: '100%',
    },
    listInfo: {
        flex: 1,
        height: 72, // Match poster height for alignment
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    listTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    listSubtitle: {
        fontSize: 13,
    },
    listMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    listStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    listStatusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    listRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    listRatingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
    },
    readingBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#000',
        padding: 4,
        borderRadius: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#A1A1AA',
        fontSize: 14,
    },
});
