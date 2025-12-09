import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, StatusBar, TextInput, Animated, TouchableWithoutFeedback, DeviceEventEmitter } from 'react-native';
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
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import ThemeIcon from 'react-native-vector-icons/Ionicons';

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
    const [feed, setFeed] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

    const { user } = useAuth();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { toggleMenu } = useSideMenu();

    const [activeTab, setActiveTab] = useState<'trend' | 'movie' | 'book' | 'music'>('trend');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnim = React.useRef(new Animated.Value(0)).current;
    const flatListRef = React.useRef<FlatList>(null);

    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedPostForRepost, setSelectedPostForRepost] = useState<any>(null);

    useEffect(() => {
        Animated.timing(searchAnim, {
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
            flexDirection: 'row',
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            paddingBottom: 0,
            shadowColor: theme.dark ? "#000" : "#000",
            shadowOffset: { width: 0, height: 4 }, // Shadow below the line
            shadowOpacity: theme.dark ? 0.3 : 0.05, // Subtle on light, stronger on dark
            shadowRadius: 3,
            elevation: 3, // Android shadow
            zIndex: 9,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 1, // Ensure shadow is visible
        },
        tab: {
            marginRight: 24,
            paddingVertical: 12,
        },
        activeTab: {
            borderBottomWidth: 3,
            borderBottomColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 16,
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

    const fetchFeed = async () => {
        if (!refreshing) setIsLoading(true);
        try {
            const filter = activeTab === 'trend' ? '' : activeTab;
            let feedData = [];

            if (searchQuery.trim().length > 0) {
                const [posts, users] = await Promise.all([
                    postService.getFeed(user?.id, filter, searchQuery),
                    userService.search(searchQuery)
                ]);
                const markedPosts = posts.map((p: any) => ({ ...p, type: 'post' }));
                const markedUsers = users.map((u: any) => ({ ...u, type: 'user', id: `user_${u.id}`, originalId: u.id }));
                feedData = [...markedUsers, ...markedPosts];
            } else {
                const posts = await postService.getFeed(user?.id, filter, searchQuery);
                feedData = posts.map((p: any) => ({ ...p, type: 'post' }));
            }
            setFeed(feedData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchFeed();
    }, [activeTab, searchQuery]);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('refresh_feed', () => {
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }
            setRefreshing(true);
            fetchFeed();
        });
        return () => subscription.remove();
    }, [activeTab, searchQuery]);

    useEffect(() => {
        fetchFeed();
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isSearchVisible) {
                fetchFeed();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleLike = async (item: any) => {
        if (!user) return;
        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        const updatedFeed = feed.map(post => {
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
        setFeed(updatedFeed);

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
        const originalPosterUsername = item.user.username;
        const newSource = 'Paylaşım';
        const newAuthor = originalPosterUsername;
        const originalPostId = item.id;

        // Create optimistic post object
        const optimisticPost = {
            id: Date.now(), // Temporary ID
            user: {
                id: user.id,
                username: user.username,
                full_name: user.name ? `${user.name} ${user.surname}` : user.username,
                avatar_url: user.avatar_url
            },
            content: 'Yeniden paylaşım',
            created_at: new Date().toISOString(),
            original_post_id: originalPostId,
            original_post: item, // Embed the full original post
            like_count: 0,
            comment_count: 0,
            repost_count: 0,
            is_liked: false,
            is_reposted: false,
            type: 'post'
        };

        // Update feed immediately
        setFeed(prevFeed => [optimisticPost, ...prevFeed]);

        // Optimistically update the repost count of the original post in the feed
        const updatedFeed = feed.map(post => {
            if (post.id === item.id) {
                return {
                    ...post,
                    repost_count: parseInt(post.repost_count || 0) + 1,
                    is_reposted: true
                };
            }
            // Also check if the item is an original post inside a repost
            if (post.original_post && post.original_post.id === item.id) {
                return {
                    ...post,
                    original_post: {
                        ...post.original_post,
                        repost_count: parseInt(post.original_post.repost_count || 0) + 1,
                        is_reposted: true
                    }
                };
            }
            return post;
        });
        // Note: We are setting feed twice here which is fine in batching, but let's combine it in a real robust implementation. 
        // For simplicity in this step, let's just prepend. The count update on the item itself is tricky because we just prepended.

        // Refined Optimistic Update: Prepend AND update counts
        setFeed(prevFeed => {
            const updated = prevFeed.map(post => {
                if (post.id === item.id) {
                    return { ...post, repost_count: (parseInt(post.repost_count || 0) + 1).toString(), is_reposted: true };
                }
                if (post.original_post && post.original_post.id === item.id) {
                    return {
                        ...post,
                        original_post: {
                            ...post.original_post,
                            repost_count: (parseInt(post.original_post.repost_count || 0) + 1).toString(),
                            is_reposted: true // Updates the green loop icon
                        }
                    };
                }
                return post;
            });
            return [optimisticPost, ...updated];
        });


        try {
            await postService.create(user.id, '', content, newSource, newAuthor, originalPostId);
            // In a perfect world, we replace the temp ID with the real one from response, 
            // but for now, we just let the next natural refresh handle consistency or silently succeed.
            // fetchFeed(); // Do NOT fetchFeed to avoid reload.
            // Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Yeniden gönderildi!' }); // Optional, maybe too noisy if it's instant
        } catch (error: any) {
            console.error('Repost error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'Paylaşılamadı.' });
            // Revert changes on error (TODO: complex to revert perfectly without ID, but usually acceptable to just refresh)
            fetchFeed();
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

    const confirmDelete = async () => {
        const item = selectedPostForOptions;
        if (!item) return;

        try {
            if (user) {
                await postService.delete(user.id, item.id);
                setFeed(prev => prev.filter(post => post.id !== item.id));
                Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Gönderi silindi.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Silinemedi.' });
        } finally {
            setDeleteDialogVisible(false);
            setOptionsModalVisible(false); // Ensure options menu is also closed/reset
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
                onOptions={user && user.username === item.user.username ? (pos) => handleOptionsPress(item, pos) : undefined}
                onUserPress={(userId) => (navigation as any).navigate('OtherProfile', { userId: userId || item.user.id })}
                onReposterPress={() => (navigation as any).navigate('OtherProfile', { userId: item.user.id })}
                currentUserId={user?.id}
                onContentPress={handleContentPress}
            />
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
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

            <Animated.View style={[
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
            </Animated.View>

            <View style={styles.tabsContainer}>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => setActiveTab('trend')} style={[styles.tab, activeTab === 'trend' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'trend' && styles.activeTabText]}>Trendler</Text>
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
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={feed}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="ghost" size={40} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>Henüz içerik yok</Text>
                        </View>
                    }
                />
            )}

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onDirectRepost={handleDirectRepost}
                onQuoteRepost={handleQuoteRepost}
            />

            <PostOptionsModal
                visible={optionsModalVisible}
                onClose={() => setOptionsModalVisible(false)}
                onDelete={handleDelete}
                isOwner={selectedPostForOptions?.user?.id === user?.id}
                targetPosition={menuPosition}
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
