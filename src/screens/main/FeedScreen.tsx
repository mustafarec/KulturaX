import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, StatusBar, TextInput, Animated as RNAnimated, Dimensions, ScrollView, BackHandler, DeviceEventEmitter } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Toast from 'react-native-toast-message';
import { Post, ContentType } from '../../types/models';

// Custom Hooks
import { useFeed } from '../../hooks/useFeed';
import { useFeedActions } from '../../hooks/useFeedActions';
import { usePostInteractions } from '../../hooks/usePostInteractions';

// Services
import { postService, clickTrackingService } from '../../services/backendApi';

// Components
import { FeedbackCard } from '../../components/FeedbackCard';
import { PostCard } from '../../components/PostCard';
import { UserCard } from '../../components/UserCard';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import { AnimatedMenuButton } from '../../components/AnimatedMenuButton';
import { SuggestedUsers } from '../../components/SuggestedUsers';
import { ShareOptionsSheet } from '../../components/ShareOptionsSheet';
import { ShareCardModal } from '../../components/ShareCardModal';
import { SharePostModal } from '../../components/SharePostModal';
import { SkeletonPost } from '../../components/ui/SkeletonPost';

// Contexts
import { useMessage } from '../../context/MessageContext';
import { useNotification } from '../../context/NotificationContext';

// Icons
import { Search, Bell, Ghost, ChevronDown, ChevronUp } from 'lucide-react-native';

// Styles
import { getStyles } from './styles/FeedScreen.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UnreadBadge = () => {
    const { unreadCount } = useMessage();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    if (unreadCount === 0) return null;
    return (
        <View style={styles.unreadBadge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
    );
};

const NotificationBadge = () => {
    const { unreadCount } = useNotification();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    if (unreadCount === 0) return null;
    return (
        <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
    );
};

export const FeedScreen = () => {
    // --- HOOKS ---
    const { feeds, loadingStates, refreshing, fetchFeed, updateAllFeeds, handlePostUpdate } = useFeed();
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const styles = getStyles(theme);

    // Interaction Hooks
    const { handleLike, handleToggleSave, handleDirectRepost, handleQuoteRepost, handleContentPress: handleContentPressHook, handleUserPress } = usePostInteractions({ onUpdatePost: handlePostUpdate });
    const { handleDelete, handleFeedback, handleFeedbackAction, handleFeedbackDismiss } = useFeedActions({ updateAllFeeds, user });

    // --- LOCAL UI STATE ---
    const [activeMainTab, setActiveMainTab] = useState<'forYou' | 'following'>('forYou');
    const [activeSubTab, setActiveSubTab] = useState<'trend' | 'movie' | 'book' | 'music'>('trend');
    const [isSubCategoriesVisible, setIsSubCategoriesVisible] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnim = useRef(new RNAnimated.Value(0)).current;

    // Modals
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState<Post | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Share Modals
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareCardModalVisible, setShareCardModalVisible] = useState(false);
    const [sharePostModalVisible, setSharePostModalVisible] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<Post | null>(null);

    // Animation Value for Tab Slide
    const translateX = useSharedValue(0);

    // --- EFFECT: Tab Changes ---
    useEffect(() => {
        const index = activeMainTab === 'following' ? 1 : 0;
        const config = { damping: 30, stiffness: 250, mass: 1 };
        translateX.value = withSpring(-index * SCREEN_WIDTH, config);

        if (activeMainTab === 'following') {
            fetchFeed('following');
        } else {
            fetchFeed(activeSubTab);
        }
    }, [activeMainTab, activeSubTab, fetchFeed]);

    // --- EFFECT: Search Animation ---
    useEffect(() => {
        RNAnimated.timing(searchAnim, {
            toValue: isSearchVisible ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isSearchVisible]);

    // --- EFFECT: Search Logic ---
    const wasSearchUsed = useRef(false);
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            wasSearchUsed.current = true;
            const timer = setTimeout(() => {
                const targetTab = activeMainTab === 'following' ? 'following' : activeSubTab;
                fetchFeed(targetTab, searchQuery);
            }, 500);
            return () => clearTimeout(timer);
        } else if (wasSearchUsed.current) {
            wasSearchUsed.current = false;
            const targetTab = activeMainTab === 'following' ? 'following' : activeSubTab;
            fetchFeed(targetTab, '', true);
        }
    }, [searchQuery, activeMainTab, activeSubTab, fetchFeed]);

    // --- EFFECT: Refresh Trigger ---
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('refresh_feed', () => {
            const targetTab = activeMainTab === 'following' ? 'following' : activeSubTab;
            fetchFeed(targetTab, searchQuery, true);
        });
        return () => subscription.remove();
    }, [activeMainTab, activeSubTab, searchQuery, fetchFeed]);

    // --- Back Handler ---
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
                Toast.show({ type: 'info', text1: 'Uygulamadan Çıkılıyor', text2: 'Çıkmak için tekrar geri tuşuna basın.', position: 'bottom', visibilityTime: 2000 });
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    // --- HANDLERS ---
    const onRefresh = React.useCallback(() => {
        const targetTab = activeMainTab === 'following' ? 'following' : activeSubTab;
        fetchFeed(targetTab, searchQuery, true);
    }, [activeMainTab, activeSubTab, searchQuery, fetchFeed]);

    const handleContentWrap = (type: ContentType, id: string, title?: string) => {
        clickTrackingService.trackClick(type, id, title, 'feed');
        handleContentPressHook(type, id);
    };

    const handleOptionsPress = React.useCallback((item: any, position: { x: number; y: number; width: number; height: number }) => {
        setSelectedPostForOptions(item);
        setMenuPosition(position);
        setOptionsModalVisible(true);
    }, []);

    const handleSharePress = (item: any) => {
        setSelectedPostForShare(item);
        setShareModalVisible(true);
    };

    const confirmDelete = () => {
        if (selectedPostForOptions) {
            handleDelete(selectedPostForOptions.id);
            setDeleteDialogVisible(false);
            setOptionsModalVisible(false);
        }
    };

    // --- View Tracking ---
    const viewedPosts = useRef(new Set<number>());
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 1000 }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        viewableItems.forEach(viewableItem => {
            const item = viewableItem.item;
            if (item && item.id && item.type === 'post') {
                const isRepost = !!item.original_post_id;
                const isQuoteRepost = isRepost && item.original_post && item.content !== 'Yeniden paylaşım' && item.content !== item.original_post?.content;
                const postIdToTrack = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

                if (!viewedPosts.current.has(postIdToTrack)) {
                    viewedPosts.current.add(postIdToTrack);
                    postService.markViewed(postIdToTrack, user?.id);
                    if (isRepost && postIdToTrack !== item.id) viewedPosts.current.add(item.id);
                }
            }
        });
    }).current;


    // --- RENDER ---
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

    // OPTIMIZED: useCallback prevents function re-creation on every render
    const renderItem = React.useCallback(({ item }: { item: any }) => {
        if (item.type === 'suggested_users') return <SuggestedUsers />;
        if (item.type === 'feedback') return <FeedbackCard onFeedback={(interested) => handleFeedbackAction(item.targetPostId, interested, item.id)} onDismiss={() => handleFeedbackDismiss(item.id)} />;
        if (item.type === 'user') return <UserCard user={{ id: item.originalId, username: item.username, name: item.name, surname: item.surname, avatar_url: item.avatar_url }} onPress={() => handleUserPress(item.originalId)} />;

        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post && item.content !== 'Yeniden paylaşım' && item.content !== item.original_post.content;

        return (
            <PostCard
                post={item}
                onPress={() => { /* Detail Navigation or expand */ }}
                onComment={() => (navigation as any).navigate('PostDetail', { postId: (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id, autoFocusComment: false })}
                onOptions={(pos) => handleOptionsPress(item, pos)}
                onUserPress={(userId) => handleUserPress(userId || item.user.id)}
                onReposterPress={() => handleUserPress(item.user.id)}
                currentUserId={user?.id}
                onContentPress={handleContentWrap}
                isSaved={!!item.is_saved}
                onShare={() => handleSharePress(item)}
                onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}

                // Hook Actions
                onLike={() => handleLike(item)}
                onSave={() => handleToggleSave(item)}
                onRepost={() => handleDirectRepost(item)}
            />
        );
    }, [navigation, user?.id, handleUserPress, handleContentWrap, handleOptionsPress, handleLike, handleToggleSave, handleDirectRepost, handleFeedbackAction, handleFeedbackDismiss]);

    const renderList = (data: any[], loading: boolean) => {
        if (loading) {
            return (
                <View style={[styles.listContainer, { paddingTop: 0 }]}>
                    <SkeletonPost /><SkeletonPost /><SkeletonPost />
                </View>
            );
        }
        return (
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={5}
                updateCellsBatchingPeriod={50}
                ListEmptyComponent={<View style={styles.emptyContainer}><Ghost size={40} color={theme.colors.textSecondary} /><Text style={styles.emptyText}>Henüz içerik yok</Text></View>}
            />
        );
    };

    const getFeedData = (tab: string) => {
        switch (tab) {
            case 'following': return feeds.following;
            case 'trend': return feeds.trend;
            case 'movie': return feeds.movie;
            case 'book': return feeds.book;
            case 'music': return feeds.music;
            default: return [];
        }
    };

    const subCategories = [
        { id: 'trend', label: 'Tümü' },
        { id: 'movie', label: 'Film' },
        { id: 'book', label: 'Kitap' },
        { id: 'music', label: 'Müzik' }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} translucent />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}><AnimatedMenuButton /></View>
                <View style={styles.pageTitleContainer}><Image source={require('../../assets/images/header_logo.png')} style={styles.headerLogo} /></View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => {
                        const newVisible = !isSearchVisible;
                        setIsSearchVisible(newVisible);
                        if (!newVisible) setSearchQuery('');
                    }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Search size={24} color={theme.colors.text} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => (navigation as any).navigate('Notifications')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Bell size={24} color={theme.colors.text} /><NotificationBadge /></TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <RNAnimated.View style={[styles.searchContainer, { height: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }), opacity: searchAnim, transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <View style={styles.searchInputContainer}>
                    <Search size={16} color={theme.colors.textSecondary} />
                    <TextInput style={styles.searchInput} placeholder="Kullanıcı veya gönderi ara..." placeholderTextColor={theme.colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
                </View>
            </RNAnimated.View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { zIndex: 1, paddingBottom: 0 }]}>
                <TouchableOpacity onPress={() => activeMainTab === 'forYou' ? setIsSubCategoriesVisible(!isSubCategoriesVisible) : (setActiveMainTab('forYou'), setIsSubCategoriesVisible(true))} style={[styles.tab, activeMainTab === 'forYou' && styles.activeTab, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Text style={[styles.tabText, activeMainTab === 'forYou' && styles.activeTabText]}>Trendler</Text>
                    {activeMainTab === 'forYou' ? (isSubCategoriesVisible ? <ChevronUp size={16} color="#FFFFFF" /> : <ChevronDown size={16} color="#FFFFFF" />) : <ChevronDown size={16} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveMainTab('following')} style={[styles.tab, activeMainTab === 'following' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeMainTab === 'following' && styles.activeTabText]}>Takip</Text>
                </TouchableOpacity>
            </View>

            {/* Sub-Tabs */}
            {activeMainTab === 'forYou' && isSubCategoriesVisible && (
                <View style={styles.subCategoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCategoryScrollContent}>
                        {subCategories.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => setActiveSubTab(item.id as any)}
                                style={[
                                    styles.subCategoryItem,
                                    activeSubTab === item.id ? styles.subCategoryItemActive : styles.subCategoryItemInactive
                                ]}>
                                <Text style={[
                                    styles.subCategoryText,
                                    activeSubTab === item.id ? styles.subCategoryTextActive : styles.subCategoryTextInactive
                                ]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Content Pages */}
            <Animated.View style={[styles.contentWrapper, { width: SCREEN_WIDTH * 2 }, animatedStyle]}>
                <View style={styles.page}>
                    {renderList(getFeedData(activeSubTab), loadingStates[activeSubTab as keyof typeof loadingStates])}
                </View>
                <View style={styles.page}>
                    {renderList(getFeedData('following'), loadingStates.following)}
                </View>
            </Animated.View>

            {/* Features Modals */}
            <ShareOptionsSheet visible={shareModalVisible} onClose={() => setShareModalVisible(false)} onSelectDM={() => { setShareModalVisible(false); setSharePostModalVisible(true); }} onSelectStory={() => { setShareModalVisible(false); setShareCardModalVisible(true); }} />

            {/* Share Card Modal Logic */}
            {(() => {
                const isRepost = !!selectedPostForShare?.original_post_id;
                const isQuoteRepost = isRepost && selectedPostForShare?.original_post && selectedPostForShare.content !== 'Yeniden paylaşım' && selectedPostForShare.content !== selectedPostForShare.original_post.content;
                const displayPost = (isRepost && !isQuoteRepost && selectedPostForShare?.original_post) ? selectedPostForShare.original_post : selectedPostForShare;
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

            <SharePostModal visible={sharePostModalVisible} onClose={() => setSharePostModalVisible(false)} post={selectedPostForShare} />

            <PostOptionsModal visible={optionsModalVisible} onClose={() => setOptionsModalVisible(false)} onDelete={() => setDeleteDialogVisible(true)} isOwner={selectedPostForOptions?.user?.id === user?.id} targetPosition={menuPosition} onFeedback={(type) => handleFeedback(type, selectedPostForOptions)} />

            <ThemedDialog visible={deleteDialogVisible} title="Sil" message="Bu gönderiyi silmek istediğinize emin misiniz?" onClose={() => setDeleteDialogVisible(false)} actions={[{ text: 'İptal', style: 'cancel', onPress: () => setDeleteDialogVisible(false) }, { text: 'Sil', style: 'destructive', onPress: confirmDelete }]} />
        </View>
    );
};

