import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, StatusBar, TextInput, Animated as RNAnimated, TouchableWithoutFeedback, DeviceEventEmitter, LayoutAnimation, UIManager, Platform, Share, Dimensions, ScrollView, BackHandler } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import { postService, interactionService, userService, clickTrackingService } from '../../services/backendApi';
import { FeedbackCard } from '../../components/FeedbackCard';
import { PostCard } from '../../components/PostCard';
import { UserCard } from '../../components/UserCard';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import { AnimatedMenuButton } from '../../components/AnimatedMenuButton';
import { SuggestedUsers } from '../../components/SuggestedUsers';

import { useSideMenu } from '../../context/SideMenuContext';
import { useMessage } from '../../context/MessageContext';
import { useNotification } from '../../context/NotificationContext';
import { ShareOptionsSheet } from '../../components/ShareOptionsSheet';
import { ShareCardModal } from '../../components/ShareCardModal';
import { SharePostModal } from '../../components/SharePostModal';
import { SkeletonPost } from '../../components/ui/SkeletonPost';
import { Search, Bell, Ghost, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEEDBACK_STORAGE_KEY = '@last_feedback_time';
const FEEDBACK_COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours

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

    // Back Handler Logic for Exit Confirmation
    const lastBackPress = useRef(0);
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                const now = Date.now();
                if (now - lastBackPress.current < 2000) {
                    BackHandler.exitApp();
                    return true;
                }

                lastBackPress.current = now;
                Toast.show({
                    type: 'info',
                    text1: 'Uygulamadan Çıkılıyor',
                    text2: 'Çıkmak için tekrar geri tuşuna basın.',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [])
    );

    // Global state for current refreshing action
    const [refreshing, setRefreshing] = useState(false);

    // Consolidated loading check for active tab
    const isCurrentTabLoading = (tab: string) => loadingStates[tab as keyof typeof loadingStates];

    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

    const { user } = useAuth();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { toggleMenu } = useSideMenu();

    const [activeMainTab, setActiveMainTab] = useState<'forYou' | 'following'>('forYou');
    const [activeSubTab, setActiveSubTab] = useState<'trend' | 'movie' | 'book' | 'music'>('trend');
    const [isSubCategoriesVisible, setIsSubCategoriesVisible] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnim = React.useRef(new RNAnimated.Value(0)).current;

    // Animation Value for Tab Slide
    const translateX = useSharedValue(0);

    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareCardModalVisible, setShareCardModalVisible] = useState(false);
    const [sharePostModalVisible, setSharePostModalVisible] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);

    // Animasyon stili
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const getTabIndex = (tab: string) => {
        return tab === 'following' ? 1 : 0;
    };

    // Tab changed animation
    useEffect(() => {
        const index = getTabIndex(activeMainTab);
        const config = { damping: 30, stiffness: 250, mass: 1 };
        translateX.value = withSpring(-index * SCREEN_WIDTH, config);

        // Fetch data if empty or needed
        if (activeMainTab === 'following') {
            fetchFeed('following');
        } else {
            fetchFeed(activeSubTab);
        }
    }, [activeMainTab, activeSubTab]);

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
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 60,
            paddingBottom: 5,
            backgroundColor: 'rgba(255,255,255,0)', // Transparent, handled by content or blur if needed
            zIndex: 10,
        },
        headerTitle: {
            fontSize: 23,
            fontFamily: theme.fonts.headings,
            color: theme.colors.primary,
            textAlign: 'center',
        },
        searchContainer: {
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            zIndex: 9,
            overflow: 'hidden',
            justifyContent: 'center',
            marginTop: -10, // Pull it closer to header
        },
        searchInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.inputBackground,
            borderRadius: theme.borderRadius.l,
            paddingHorizontal: 16,
            height: 48,
            borderWidth: 0,
        },
        searchInput: {
            flex: 1,
            marginLeft: 8,
            fontSize: 15,
            color: theme.colors.text,
            height: '100%',
            paddingVertical: 0,
            fontFamily: theme.fonts.main,
        },
        tabsContainer: {
            flexDirection: 'row',
            backgroundColor: theme.colors.background,
            paddingHorizontal: 20,
            paddingVertical: 10,
            zIndex: 9,
            gap: 12,
        },
        tab: {
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 20,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: 'transparent',
        },
        activeTab: {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        tabText: {
            fontSize: 15,
            color: theme.colors.textSecondary,
            fontWeight: '600',
            fontFamily: theme.fonts.main,
        },
        activeTabText: {
            color: '#FFFFFF', // White text on primary pill
            fontWeight: '700',
        },
        headerLeft: {
            width: 50,
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        pageTitleContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
        },
        headerLogo: {
            width: 150,
            height: 40,
            resizeMode: 'contain',
            tintColor: theme.colors.primary, // Tint it to match the theme!
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
            paddingBottom: 100, // Extra padding for floating tab bar
            paddingTop: 8,
            paddingHorizontal: 16, // Add horizontal padding for cards
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
            fontFamily: theme.fonts.main,
            marginTop: 16,
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

    const fetchFeed = async (tabToFetch: string | undefined = undefined, isRefresh = false) => {
        // Determine what to fetch based on current state if not specified
        const targetTab = tabToFetch || (activeMainTab === 'following' ? 'following' : activeSubTab);

        // Cache check
        if (!isRefresh && searchQuery.trim().length === 0) {
            const currentData = getFeedDataForTab(targetTab);
            if (currentData && currentData.length > 0) {
                setLoadingForTab(targetTab, false);
                return;
            }
        }

        if (!isRefresh) setLoadingForTab(targetTab, true);
        try {
            const filter = targetTab === 'trend' ? '' : targetTab;
            let feedData = [];

            if (searchQuery.trim().length > 0) {
                // Search logic
                const [posts, users] = await Promise.all([
                    postService.getFeed(user?.id, filter, searchQuery),
                    userService.search(searchQuery)
                ]);
                const safePosts = Array.isArray(posts) ? posts : [];
                const safeUsers = Array.isArray(users) ? users : [];

                if (!Array.isArray(posts)) console.error('Search Posts API Error:', posts);

                const markedPosts = safePosts.map((p: any) => ({ ...p, type: 'post' }));
                const markedUsers = safeUsers.map((u: any) => ({ ...u, type: 'user', id: `user_${u.id}`, originalId: u.id }));
                feedData = [...markedUsers, ...markedPosts];
            } else {
                let posts;
                if (targetTab === 'following') {
                    posts = await postService.getFollowingFeed(user!.id, '', searchQuery);
                } else {
                    posts = await postService.getFeed(user?.id, filter === 'following' ? '' : filter, searchQuery);
                }
                if (!Array.isArray(posts)) {
                    console.error('Feed API Error: Expected array but got:', posts);
                    if (posts && posts.message) {
                        Toast.show({ type: 'error', text1: 'Hata', text2: posts.message });
                    }
                    posts = [];
                }
                feedData = posts.map((p: any) => ({ ...p, type: 'post' }));

                if (targetTab === 'trend') {
                    // Inject Suggested Users Block
                    if (feedData.length >= 5) {
                        const min = 5;
                        const max = Math.min(feedData.length, 10);
                        const randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;
                        feedData.splice(randomIndex, 0, { type: 'suggested_users', id: 'suggested_users_block_1' });
                    }

                    // Inject Feedback Cards based on Backend Trigger (Smart Triggers)
                    // Check local cooldown first
                    const lastFeedbackTimeStr = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
                    const lastFeedbackTime = lastFeedbackTimeStr ? parseInt(lastFeedbackTimeStr, 10) : 0;
                    const now = Date.now();
                    const shouldShowFeedback = (now - lastFeedbackTime) > FEEDBACK_COOLDOWN;

                    if (shouldShowFeedback) {
                        let feedbackInjected = false;
                        // Iterate backwards to avoid index shifting
                        for (let i = feedData.length - 1; i >= 0; i--) {
                            if (feedbackInjected) break; // Only show one per session/load if cooldown passed

                            const targetPost = feedData[i];

                            // Check if backend requested feedback for this post
                            if (targetPost && targetPost.type === 'post' && targetPost.request_feedback) {
                                const feedbackId = `feedback_${targetPost.id}_${Date.now()}`;
                                // Insert AFTER the post
                                feedData.splice(i + 1, 0, {
                                    type: 'feedback',
                                    id: feedbackId,
                                    targetPostId: targetPost.id
                                });
                                feedbackInjected = true;
                                // Update storage
                                AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, now.toString());
                            }
                        }
                    }
                }
            }
            setFeedForTab(targetTab, feedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingForTab(targetTab, false);
            if (isRefresh) setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchFeed(undefined, true);
    }, [activeMainTab, activeSubTab, searchQuery]);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('refresh_feed', () => {
            setRefreshing(true);
            fetchFeed(undefined, true);
        });
        return () => subscription.remove();
    }, [activeMainTab, activeSubTab, searchQuery]);

    const wasSearchUsed = React.useRef(false);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            wasSearchUsed.current = true;
            const timer = setTimeout(() => {
                fetchFeed();
            }, 500);
            return () => clearTimeout(timer);
        } else if (wasSearchUsed.current) {
            // Arama temizlendiğinde normal feed'i yeniden yükle (sadece arama kullanıldıysa)
            wasSearchUsed.current = false;
            fetchFeed(undefined, true);
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

    const handlePostUpdate = (updater: (post: any) => any) => {
        updateAllFeeds((list) => list.map(updater));
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

    const handleShareDM = () => {
        setShareModalVisible(false);
        // Open SharePostModal to select a user to send the post to
        setSharePostModalVisible(true);
    };

    const handleShareStory = () => {
        setShareModalVisible(false);
        setShareCardModalVisible(true);
    };

    const confirmDelete = async () => {
        const item = selectedPostForOptions;
        if (!item) return;

        try {
            if (user) {
                await postService.delete(item.id);
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

    const handleContentPress = (type: 'book' | 'movie' | 'music', id: string, title?: string) => {
        // Track click for analytics
        clickTrackingService.trackClick(type, id, title, 'feed');
        (navigation as any).navigate('ContentDetail', { id, type });
    };

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'suggested_users') {
            return <SuggestedUsers />;
        }

        if (item.type === 'feedback') {
            return (
                <FeedbackCard
                    onFeedback={(interested) => handleFeedbackAction(item.targetPostId, interested, item.id)}
                    onDismiss={() => handleFeedbackDismiss(item.id)}
                />
            );
        }

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
                // onLike replaced by internal hook
                onComment={() => (navigation as any).navigate('PostDetail', { postId: interactionId, autoFocusComment: false })}
                // onRepost replaced by internal hook
                onOptions={(pos) => handleOptionsPress(item, pos)}
                onUserPress={(userId) => (navigation as any).navigate('OtherProfile', { userId: userId || item.user.id })}
                onReposterPress={() => (navigation as any).navigate('OtherProfile', { userId: item.user.id })}
                currentUserId={user?.id}
                onContentPress={handleContentPress}
                // onSave replaced by internal hook (if we trust it, or use handlePostUpdate for optimistic)
                // We passed handleToggleSave previously. New hook can handle it if we pass onUpdatePost.
                isSaved={!!item.is_saved}
                onShare={() => handleShare(item)}
                onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                onUpdatePost={handlePostUpdate}
            />
        );
    };

    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const handleFeedbackAction = async (targetPostId: number, interested: boolean, feedbackItemId: string) => {
        // UI: Remove the feedback card locally
        updateAllFeeds(prev => prev.filter(item => item.id !== feedbackItemId));

        if (!user) return;
        try {
            await interactionService.sendFeedFeedback(targetPostId, interested ? 'show_more' : 'not_interested');
            // Toast.show({ type: 'success', text1: 'Geri bildiriminiz alındı.' });
        } catch (error) {
            console.error('Feedback failed', error);
        }
    };

    const handleFeedbackDismiss = (feedbackItemId: string) => {
        updateAllFeeds(prev => prev.filter(item => item.id !== feedbackItemId));
    };

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
                // Determine the actual post ID to track
                // For reposts (non-quote), we want to track the original post
                const isRepost = !!item.original_post_id;
                const isQuoteRepost = isRepost && item.original_post &&
                    item.content !== 'Yeniden paylaşım' &&
                    item.content !== item.original_post?.content;

                // For simple reposts, track the original post ID
                // For quote reposts, track the quote post itself
                const postIdToTrack = (isRepost && !isQuoteRepost && item.original_post)
                    ? item.original_post.id
                    : item.id;

                if (!viewedPosts.current.has(postIdToTrack)) {
                    viewedPosts.current.add(postIdToTrack);
                    postService.markViewed(postIdToTrack, userRef.current?.id);

                    // Also track the repost container itself to avoid re-processing
                    if (isRepost && postIdToTrack !== item.id) {
                        viewedPosts.current.add(item.id);
                    }
                }
            }
        });
    }).current;

    const renderList = (data: any[], loading: boolean) => {
        if (loading) {
            return (
                <View style={[styles.listContainer, { paddingTop: 0 }]}>
                    <SkeletonPost />
                    <SkeletonPost />
                    <SkeletonPost />
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
                // Performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={5}
                updateCellsBatchingPeriod={50}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ghost size={40} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>Henüz içerik yok</Text>
                    </View>
                }
            />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} translucent />
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
                <View style={[styles.headerRight]}>
                    <TouchableOpacity
                        onPress={() => {
                            const newVisible = !isSearchVisible;
                            setIsSearchVisible(newVisible);
                            // Arama kapatıldığında query'yi temizle
                            if (!newVisible) {
                                setSearchQuery('');
                            }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Search size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => (navigation as any).navigate('Notifications')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Bell size={24} color={theme.colors.text} />
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
                    <Search size={16} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kullanıcı veya gönderi ara..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </RNAnimated.View>

            {/* Modified Tabs Header - Pill Style */}
            <View style={[styles.tabsContainer, { zIndex: 1, paddingBottom: 0 }]}>
                {/* Trendler / Size Özel Tab */}
                <TouchableOpacity
                    onPress={() => {
                        if (activeMainTab === 'forYou') {
                            setIsSubCategoriesVisible(!isSubCategoriesVisible);
                        } else {
                            setActiveMainTab('forYou');
                            setIsSubCategoriesVisible(true);
                        }
                    }}
                    style={[
                        styles.tab,
                        activeMainTab === 'forYou' && styles.activeTab,
                        { flexDirection: 'row', alignItems: 'center', gap: 4 }
                    ]}
                >
                    <Text style={[styles.tabText, activeMainTab === 'forYou' && styles.activeTabText]}>
                        Trendler
                    </Text>
                    {activeMainTab === 'forYou' ? (
                        isSubCategoriesVisible ? (
                            <ChevronUp size={16} color="#FFFFFF" />
                        ) : (
                            <ChevronDown size={16} color="#FFFFFF" />
                        )
                    ) : (
                        <ChevronDown size={16} color={theme.colors.textSecondary} />
                    )}
                </TouchableOpacity>

                {/* Takip Tab */}
                <TouchableOpacity
                    onPress={() => {
                        setActiveMainTab('following');
                    }}
                    style={[styles.tab, activeMainTab === 'following' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeMainTab === 'following' && styles.activeTabText]}>Takip</Text>
                </TouchableOpacity>
            </View>

            {/* Sub-Category List (Horizontal Scroll) */}
            {activeMainTab === 'forYou' && isSubCategoriesVisible && (
                <View style={{ paddingVertical: 10 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                    >
                        {[
                            { id: 'trend', label: 'Tümü' },
                            { id: 'movie', label: 'Film' },
                            { id: 'book', label: 'Kitap' },
                            { id: 'music', label: 'Müzik' }
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => setActiveSubTab(item.id as any)}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 16,
                                    backgroundColor: activeSubTab === item.id ? theme.colors.primary : theme.colors.surface,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: activeSubTab === item.id ? theme.colors.primary : theme.colors.border,
                                }}
                            >
                                <Text style={{
                                    color: activeSubTab === item.id ? '#FFF' : theme.colors.text,
                                    fontSize: 13,
                                    fontWeight: activeSubTab === item.id ? '600' : '400',
                                    fontFamily: theme.fonts.main
                                }}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Close dropdown when tapping backdrop if needed - managed via visible state toggle mostly,
                 but can add a transparent absolute view to close it if desired.
                 For now, clicking the header toggles it, checking other interactions. */}


            {/* Animated Content Wrapper - only 2 pages now */}
            <Animated.View style={[styles.contentWrapper, { width: SCREEN_WIDTH * 2 }, animatedStyle]}>
                <View style={styles.page}>
                    {/* Page 1: Size Özel (Dynamic Content) */}
                    {renderList(getFeedDataForTab(activeSubTab), loadingStates[activeSubTab as keyof typeof loadingStates])}
                </View>
                <View style={styles.page}>
                    {/* Page 2: Following */}
                    {renderList(followingFeed, loadingStates.following)}
                </View>
            </Animated.View>

            <ShareOptionsSheet
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                onSelectDM={handleShareDM}
                onSelectStory={handleShareStory}
            />

            {(() => {
                const isRepost = !!selectedPostForShare?.original_post_id;
                const isQuoteRepost = isRepost && selectedPostForShare?.original_post &&
                    selectedPostForShare.content !== 'Yeniden paylaşım' &&
                    selectedPostForShare.content !== selectedPostForShare.original_post.content;

                const displayPost = (isRepost && !isQuoteRepost && selectedPostForShare?.original_post)
                    ? selectedPostForShare.original_post
                    : selectedPostForShare;

                return (
                    <ShareCardModal
                        visible={shareCardModalVisible}
                        onClose={() => setShareCardModalVisible(false)}
                        shareType="post"
                        title={displayPost?.source || ''}
                        postContent={displayPost?.comment_text || displayPost?.content || ''}
                        postAuthor={displayPost?.user?.full_name || displayPost?.user?.username || ''}
                        postAuthorAvatar={displayPost?.user?.avatar_url}
                        quoteText={displayPost?.quote_text || ''}
                        coverUrl={displayPost?.image_url}
                        contentType={displayPost?.content_type || 'book'}

                        isRepost={isRepost}
                        isQuoteRepost={isQuoteRepost}
                        repostedBy={isRepost && !isQuoteRepost ? (selectedPostForShare?.user?.full_name || selectedPostForShare?.user?.username) : undefined}

                        originalPostContent={selectedPostForShare?.original_post?.content || ''}
                        originalPostAuthor={selectedPostForShare?.original_post?.user?.full_name || selectedPostForShare?.original_post?.user?.username || ''}
                        originalPostAuthorAvatar={selectedPostForShare?.original_post?.user?.avatar_url}
                        originalQuoteText={selectedPostForShare?.original_post?.quote_text || ''}
                    />
                );
            })()}

            <SharePostModal
                visible={sharePostModalVisible}
                onClose={() => setSharePostModalVisible(false)}
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
