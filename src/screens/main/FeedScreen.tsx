import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, StatusBar, TextInput, Animated as RNAnimated, TouchableWithoutFeedback, DeviceEventEmitter, LayoutAnimation, UIManager, Platform, Share, Dimensions, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import { postService, interactionService, userService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { UserCard } from '../../components/UserCard';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import { AnimatedMenuButton } from '../../components/AnimatedMenuButton';

import { useSideMenu } from '../../context/SideMenuContext';
import { useMessage } from '../../context/MessageContext';
import { useNotification } from '../../context/NotificationContext';
import { RepostMenu } from '../../components/RepostMenu';
import { SharePostModal } from '../../components/SharePostModal';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import ThemeIcon from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UnreadBadge = () => {
    const { unreadCount } = useMessage();
    const { theme } = useTheme();

    if (unreadCount === 0) return null;

    return (
        <View style={{
            position: 'absolute',
            right: -6,
            top: -4,
            backgroundColor: theme.colors.error,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.colors.surface,
        }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 2 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
        </View>
    );
};

const NotificationBadge = () => {
    const { unreadCount } = useNotification();
    const { theme } = useTheme();

    if (unreadCount === 0) return null;

    return (
        <View style={{
            position: 'absolute',
            right: -6,
            top: -4,
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.colors.surface,
        }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 2 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
        </View>
    );
};

export const FeedScreen = () => {
    // Tab States
    const [trendFeed, setTrendFeed] = useState<any[]>([]);
    const [followingFeed, setFollowingFeed] = useState<any[]>([]);
    const [movieFeed, setMovieFeed] = useState<any[]>([]);
    const [bookFeed, setBookFeed] = useState<any[]>([]);
    const [musicFeed, setMusicFeed] = useState<any[]>([]);

    const [loadingStates, setLoadingStates] = useState({
        trend: true,
        following: true,
        movie: true,
        book: true,
        music: true
    });

    // Global state for current refreshing action
    const [refreshing, setRefreshing] = useState(false);

    // Consolidated loading check for active tab
    const isCurrentTabLoading = (tab: string) => loadingStates[tab as keyof typeof loadingStates];

    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

    const { user } = useAuth();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { toggleMenu } = useSideMenu();

    const [activeTab, setActiveTab] = useState<'trend' | 'following' | 'movie' | 'book' | 'music'>('trend');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnim = React.useRef(new RNAnimated.Value(0)).current;

    // Animation Value for Tab Slide
    const translateX = useSharedValue(0);

    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedPostForRepost, setSelectedPostForRepost] = useState<any>(null);

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);

    // Animasyon stili
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const getTabIndex = (tab: string) => {
        switch (tab) {
            case 'trend': return 0;
            case 'following': return 1;
            case 'movie': return 2;
            case 'book': return 3;
            case 'music': return 4;
            default: return 0;
        }
    };

    // Tab changed animation
    useEffect(() => {
        const index = getTabIndex(activeTab);
        const config = { damping: 30, stiffness: 250, mass: 1 };
        translateX.value = withSpring(-index * SCREEN_WIDTH, config);

        // Fetch data if empty or needed
        fetchFeed(activeTab);
    }, [activeTab]);

    useEffect(() => {
        RNAnimated.timing(searchAnim, {
            toValue: isSearchVisible ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isSearchVisible]);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 30,
            paddingBottom: 5,
            backgroundColor: theme.colors.surface,
            zIndex: 10,
        },
        searchContainer: {
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            zIndex: 9,
            overflow: 'hidden',
        },
        searchInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 40,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 10,
        },
        searchInput: {
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
            color: theme.colors.text,
            height: '100%',
            paddingVertical: 0,
        },
        tabsContainer: {
            backgroundColor: theme.colors.surface,
            paddingVertical: 0,
            shadowColor: theme.dark ? "#000" : "#000",
            shadowOffset: { width: 0, height: 4 }, // Shadow below the line
            shadowOpacity: theme.dark ? 0.3 : 0.05, // Subtle on light, stronger on dark
            shadowRadius: 3,
            elevation: 3, // Android shadow
            zIndex: 9,
            marginBottom: 1, // Ensure shadow is visible
        },
        tab: {
            marginRight: 24,
            paddingVertical: 12,
            alignItems: 'center',
            minWidth: 50, // Minimum clickable area
        },
        activeTab: {
            borderBottomWidth: 3,
            borderBottomColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        activeTabText: {
            color: theme.colors.text,
            fontWeight: '700',
        },
        headerLeft: {
            width: 50,
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        pageTitleContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            height: 50,
        },
        headerLogo: {
            width: 150,
            height: 36,
            resizeMode: 'contain',
        },
        contentWrapper: {
            flexDirection: 'row',
            width: SCREEN_WIDTH * 5,
            flex: 1,
        },
        page: {
            width: SCREEN_WIDTH,
            flex: 1,
        },
        listContainer: {
            paddingBottom: 160,
            paddingTop: 8,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
        },
        emptyText: {
            fontSize: 16,
            color: theme.colors.textSecondary,
        },
    }), [theme]);

    const setFeedForTab = (tab: string, data: any[]) => {
        switch (tab) {
            case 'trend': setTrendFeed(data); break;
            case 'following': setFollowingFeed(data); break;
            case 'movie': setMovieFeed(data); break;
            case 'book': setBookFeed(data); break;
            case 'music': setMusicFeed(data); break;
        }
    };

    const setLoadingForTab = (tab: string, loading: boolean) => {
        setLoadingStates(prev => ({ ...prev, [tab]: loading }));
    };

    const getFeedDataForTab = (tab: string) => {
        switch (tab) {
            case 'trend': return trendFeed;
            case 'following': return followingFeed;
            case 'movie': return movieFeed;
            case 'book': return bookFeed;
            case 'music': return musicFeed;
            default: return [];
        }
    };

    const fetchFeed = async (tabToFetch = activeTab, isRefresh = false) => {
        // Cache check: If not refreshing, not searching, and we already have data, don't fetch.
        if (!isRefresh && searchQuery.trim().length === 0) {
            const currentData = getFeedDataForTab(tabToFetch);
            if (currentData && currentData.length > 0) {
                setLoadingForTab(tabToFetch, false);
                return;
            }
        }

        if (!isRefresh) setLoadingForTab(tabToFetch, true);
        try {
            const filter = tabToFetch === 'trend' ? '' : tabToFetch;
            let feedData = [];

            if (searchQuery.trim().length > 0) {
                // Search logic - mostly applies to Trend or current context
                const [posts, users] = await Promise.all([
                    postService.getFeed(user?.id, filter, searchQuery),
                    userService.search(searchQuery)
                ]);
                const markedPosts = posts.map((p: any) => ({ ...p, type: 'post' }));
                const markedUsers = users.map((u: any) => ({ ...u, type: 'user', id: `user_${u.id}`, originalId: u.id }));
                feedData = [...markedUsers, ...markedPosts];
            } else {
                let posts;
                if (tabToFetch === 'following') {
                    posts = await postService.getFollowingFeed(user!.id, '', searchQuery);
                } else {
                    posts = await postService.getFeed(user?.id, filter, searchQuery);
                }
                feedData = posts.map((p: any) => ({ ...p, type: 'post' }));
            }
            setFeedForTab(tabToFetch, feedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingForTab(tabToFetch, false);
            if (isRefresh) setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchFeed(activeTab, true);
    }, [activeTab, searchQuery]);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('refresh_feed', () => {
            // Refresh current tab
            setRefreshing(true);
            fetchFeed(activeTab, true);
        });
        return () => subscription.remove();
    }, [activeTab, searchQuery]);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const timer = setTimeout(() => {
                fetchFeed(activeTab);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    // Update ALL lists to ensure consistency:
    const updateAllFeeds = (updateFn: (feed: any[]) => any[]) => {
        setTrendFeed(updateFn);
        setFollowingFeed(updateFn);
        setMovieFeed(updateFn);
        setBookFeed(updateFn);
        setMusicFeed(updateFn);
    };

    const handleLike = async (item: any) => {
        if (!user) return;
        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        const syncUpdate = (feedList: any[]) => feedList.map(post => {
            const isTargetPost = post.id === targetPostId;
            const isDirectRepostOfTarget = post.original_post && post.original_post.id === targetPostId &&
                (!post.content || post.content === 'Yeniden paylaşım' || post.content === post.original_post.content);

            if (isTargetPost || isDirectRepostOfTarget) {
                const postToUpdate = isTargetPost ? post : post.original_post;
                const currentCount = parseInt(postToUpdate.like_count || '0', 10);
                const newIsLiked = !postToUpdate.is_liked;
                const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

                if (isTargetPost) {
                    return {
                        ...post,
                        is_liked: newIsLiked,
                        like_count: newCount
                    };
                } else {
                    return {
                        ...post,
                        original_post: {
                            ...post.original_post,
                            is_liked: newIsLiked,
                            like_count: newCount
                        }
                    };
                }
            }
            return post;
        });

        updateAllFeeds(syncUpdate);

        try {
            await interactionService.toggleLike(user.id, targetPostId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRepostPress = (item: any) => {
        const isDirectRepost = item.original_post_id && item.original_post &&
            (item.content === 'Yeniden paylaşım' || item.content === item.original_post.content);
        const targetItem = isDirectRepost ? item.original_post : item;
        setSelectedPostForRepost(targetItem);
        setRepostMenuVisible(true);
    };

    const handleDirectRepost = async () => {
        if (!selectedPostForRepost || !user) return;
        setRepostMenuVisible(false);
        const item = selectedPostForRepost;

        // Optimistic Update
        const content = item.content;
        const newSource = 'Paylaşım';
        const newAuthor = item.user.username;
        const originalPostId = item.id;

        const optimisticPost = {
            id: Date.now(),
            user: {
                id: user.id,
                username: user.username,
                full_name: user.name ? `${user.name} ${user.surname}` : user.username,
                avatar_url: user.avatar_url
            },
            content: 'Yeniden paylaşım',
            created_at: new Date().toISOString(),
            original_post_id: originalPostId,
            original_post: item,
            like_count: 0,
            comment_count: 0,
            repost_count: 0,
            is_liked: false,
            is_reposted: false,
            type: 'post'
        };

        const syncUpdate = (feedList: any[]) => {
            const updated = feedList.map(post => {
                if (post.id === item.id) {
                    return { ...post, repost_count: (parseInt(post.repost_count || 0) + 1).toString(), is_reposted: true };
                }
                if (post.original_post && post.original_post.id === item.id) {
                    return {
                        ...post,
                        original_post: {
                            ...post.original_post,
                            repost_count: (parseInt(post.original_post.repost_count || 0) + 1).toString(),
                            is_reposted: true
                        }
                    };
                }
                return post;
            });
            return [optimisticPost, ...updated];
        };

        // Only update current feed with the new post at top, but update counts everywhere
        // Actually, prepending the new post only makes sense in the list it belongs to? 
        // Or "Trend" and "Following" if it's my post? 
        // For simplicity: Prepend to Trend and Following (if my post shows there), 
        // but since we don't know for sure, let's just prepend to the currently Active Tab list, 
        // and update counts on all.

        // Simpler strategy: Just fetchFeed() after success to be accurate, but optimistic count update is nice.
        updateAllFeeds(syncUpdate);

        try {
            await postService.create(user.id, '', content, newSource, newAuthor, originalPostId);
        } catch (error: any) {
            console.error('Repost error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'Paylaşılamadı.' });
            fetchFeed(activeTab, true);
        }
    };

    const handleQuoteRepost = () => {
        if (!selectedPostForRepost) return;
        setRepostMenuVisible(false);
        (navigation as any).navigate('CreateQuote', { originalPost: selectedPostForRepost });
    };

    const handleOptionsPress = React.useCallback((item: any, position: { x: number; y: number; width: number; height: number }) => {
        setSelectedPostForOptions(item);
        setMenuPosition(position);
        setOptionsModalVisible(true);
    }, []);

    const handleDelete = () => {
        setDeleteDialogVisible(true);
    };

    const handleToggleSave = async (item: any) => {
        if (!item || !user) return;

        const isSaved = item.is_saved;

        const syncUpdate = (feedList: any[]) => feedList.map(p => {
            if (p.id === item.id) return { ...p, is_saved: !isSaved };
            if (p.original_post && p.original_post.id === item.id) return {
                ...p,
                original_post: { ...p.original_post, is_saved: !isSaved }
            };
            return p;
        });

        updateAllFeeds(syncUpdate);

        try {
            await interactionService.toggleBookmark(user.id, item.id);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: !isSaved ? 'Kaydedildi.' : 'Kaydedilenlerden çıkarıldı.' });
        } catch (error: any) {
            console.error('Toggle Bookmark Error:', error);
            // Revert
            const revertUpdate = (feedList: any[]) => feedList.map(p => {
                if (p.id === item.id) return { ...p, is_saved: isSaved };
                if (p.original_post && p.original_post.id === item.id) return {
                    ...p,
                    original_post: { ...p.original_post, is_saved: isSaved }
                };
                return p;
            });
            updateAllFeeds(revertUpdate);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız.' });
        }
    };

    const handleShare = (item: any) => {
        setSelectedPostForShare(item);
        setShareModalVisible(true);
    };

    const confirmDelete = async () => {
        const item = selectedPostForOptions;
        if (!item) return;

        try {
            if (user) {
                await postService.delete(user.id, item.id);
                updateAllFeeds(prev => prev.filter(post => post.id !== item.id));
                Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Gönderi silindi.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Silinemedi.' });
        } finally {
            setDeleteDialogVisible(false);
            setOptionsModalVisible(false);
            setSelectedPostForOptions(null);
        }
    };

    const handleContentPress = (type: 'book' | 'movie' | 'music', id: string) => {
        (navigation as any).navigate('ContentDetail', { id, type });
    };

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'user') {
            return (
                <UserCard
                    user={{
                        id: item.originalId,
                        username: item.username,
                        name: item.name,
                        surname: item.surname,
                        avatar_url: item.avatar_url
                    }}
                    onPress={() => (navigation as any).navigate('OtherProfile', { userId: item.originalId })}
                />
            );
        }

        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;
        const interactionId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        return (
            <PostCard
                post={item}
                onPress={() => setSelectedPostId(interactionId)}
                onLike={() => handleLike(item)}
                onComment={() => (navigation as any).navigate('PostDetail', { postId: interactionId, autoFocusComment: false })}
                onRepost={() => handleRepostPress(item)}
                onOptions={(pos) => handleOptionsPress(item, pos)}
                onUserPress={(userId) => (navigation as any).navigate('OtherProfile', { userId: userId || item.user.id })}
                onReposterPress={() => (navigation as any).navigate('OtherProfile', { userId: item.user.id })}
                currentUserId={user?.id}
                onContentPress={handleContentPress}
                onSave={() => handleToggleSave(item)}
                isSaved={!!item.is_saved}
                onShare={() => handleShare(item)}
            />
        );
    };

    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const handleFeedback = async (type: 'report' | 'not_interested' | 'show_more') => {
        const item = selectedPostForOptions;
        if (!item || !user) return;

        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        if (type === 'not_interested' || type === 'report') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
            updateAllFeeds(prev => prev.filter(post => post.id !== item.id));

            Toast.show({
                type: 'success',
                text1: 'Bildirim alındı',
                text2: type === 'report' ? 'İçerik bildirildi ve gizlendi.' : 'Bu içerik gizlendi.'
            });
        } else if (type === 'show_more') {
            Toast.show({
                type: 'success',
                text1: 'Anlaşıldı',
                text2: 'Buna benzer içerikleri daha sık göreceksiniz.'
            });
        }

        try {
            await interactionService.sendFeedFeedback(targetPostId, type);
        } catch (error) {
            console.error('Feedback error:', error);
        } finally {
            setOptionsModalVisible(false);
            setSelectedPostForOptions(null);
        }
    };

    // View Tracking Logic
    const viewedPosts = React.useRef(new Set<number>());
    const userRef = React.useRef(user);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 1000
    }).current;

    const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: any[] }) => {
        viewableItems.forEach(viewableItem => {
            const item = viewableItem.item;
            if (item && item.id && item.type === 'post') {
                if (!viewedPosts.current.has(item.id)) {
                    viewedPosts.current.add(item.id);
                    postService.markViewed(item.id, userRef.current?.id);
                }
            }
        });
    }).current;

    const renderList = (data: any[], loading: boolean) => {
        if (loading) {
            return (
                <View style={[styles.loadingContainer, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="ghost" size={40} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>Henüz içerik yok</Text>
                    </View>
                }
            />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <AnimatedMenuButton />
                </View>
                <View style={styles.pageTitleContainer}>
                    <Image
                        source={require('../../assets/images/header_logo.png')}
                        style={styles.headerLogo}
                    />
                </View>
                <View style={[styles.headerRight, { flexDirection: 'row', alignItems: 'center' }]}>
                    <TouchableOpacity
                        onPress={() => setIsSearchVisible(!isSearchVisible)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginRight: 16 }}
                    >
                        <ThemeIcon name="search" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => (navigation as any).navigate('Notifications')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ThemeIcon name="notifications-outline" size={24} color={theme.colors.text} />
                        <NotificationBadge />
                    </TouchableOpacity>
                </View>
            </View>

            <RNAnimated.View style={[
                styles.searchContainer,
                {
                    height: searchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 60]
                    }),
                    opacity: searchAnim,
                    transform: [{
                        translateY: searchAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0]
                        })
                    }]
                }
            ]}>
                <View style={styles.searchInputContainer}>
                    <ThemeIcon name="search" size={16} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kullanıcı veya gönderi ara..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </RNAnimated.View>

            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
                    style={{ flexGrow: 0 }}
                >
                    <TouchableOpacity onPress={() => setActiveTab('trend')} style={[styles.tab, activeTab === 'trend' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'trend' && styles.activeTabText]}>Trendler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('following')} style={[styles.tab, activeTab === 'following' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Takip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('movie')} style={[styles.tab, activeTab === 'movie' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'movie' && styles.activeTabText]}>Film</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('book')} style={[styles.tab, activeTab === 'book' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>Kitap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('music')} style={[styles.tab, activeTab === 'music' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'music' && styles.activeTabText]}>Müzik</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Animated Content Wrapper */}
            <Animated.View style={[styles.contentWrapper, animatedStyle]}>
                <View style={styles.page}>
                    {renderList(trendFeed, loadingStates.trend)}
                </View>
                <View style={styles.page}>
                    {renderList(followingFeed, loadingStates.following)}
                </View>
                <View style={styles.page}>
                    {renderList(movieFeed, loadingStates.movie)}
                </View>
                <View style={styles.page}>
                    {renderList(bookFeed, loadingStates.book)}
                </View>
                <View style={styles.page}>
                    {renderList(musicFeed, loadingStates.music)}
                </View>
            </Animated.View>

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onDirectRepost={handleDirectRepost}
                onQuoteRepost={handleQuoteRepost}
            />

            <SharePostModal
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                post={selectedPostForShare}
            />

            <PostOptionsModal
                visible={optionsModalVisible}
                onClose={() => setOptionsModalVisible(false)}
                onDelete={handleDelete}
                isOwner={selectedPostForOptions?.user?.id === user?.id}
                targetPosition={menuPosition}
                onFeedback={handleFeedback}
            />

            <ThemedDialog
                visible={deleteDialogVisible}
                title="Sil"
                message="Bu gönderiyi silmek istediğinize emin misiniz?"
                onClose={() => setDeleteDialogVisible(false)}
                actions={[
                    { text: 'İptal', style: 'cancel', onPress: () => setDeleteDialogVisible(false) },
                    { text: 'Sil', style: 'destructive', onPress: confirmDelete }
                ]}
            />
        </View>
    );
};
