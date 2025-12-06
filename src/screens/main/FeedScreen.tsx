import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, StatusBar, TextInput, Animated, TouchableWithoutFeedback } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import { postService, interactionService, userService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { UserCard } from '../../components/UserCard';

// SideMenu is now global, we use context to control it
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

    // const [sideMenuVisible, setSideMenuVisible] = useState(false); // Removed local state
    const { user } = useAuth();
    const navigation = useNavigation();
    const { theme, themeMode, toggleTheme, setThemeMode } = useTheme();
    const { openMenu, toggleMenu } = useSideMenu(); // Use global side menu

    const [activeTab, setActiveTab] = useState<'trend' | 'movie' | 'book' | 'music'>('trend');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(searchAnim, {
            toValue: isSearchVisible ? 1 : 0,
            duration: 300,
            useNativeDriver: false, // Height animation doesn't support native driver
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
            paddingVertical: 0, // Android fix
        },
        tabsContainer: {
            flexDirection: 'row',
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            paddingBottom: 0,
            ...theme.shadows.soft,
            zIndex: 9,
            justifyContent: 'space-between',
            alignItems: 'center',
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
            width: 40,
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerAvatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },
        headerAvatarPlaceholder: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerAvatarText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        menuOverlay: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
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
        fab: {
            position: 'absolute',
            bottom: 105,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.soft,
        },
        newPostMenu: {
            position: 'absolute',
            bottom: 175,
            right: 20,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 8,
            width: 200,
            ...theme.shadows.soft,
            zIndex: 1000,
        },
        newPostMenuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
        },
        newPostMenuText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
        },
        menuDivider: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginHorizontal: 8,
        },
    }), [theme]);

    const fetchFeed = async () => {
        if (!refreshing) setIsLoading(true);
        try {
            // Map 'trend' to empty string (all posts), others to their values
            const filter = activeTab === 'trend' ? '' : activeTab;

            let feedData = [];

            // If searching, search for users too
            if (searchQuery.trim().length > 0) {
                const [posts, users] = await Promise.all([
                    postService.getFeed(user?.id, filter, searchQuery),
                    userService.search(searchQuery)
                ]);

                // Mark types for rendering
                const markedPosts = posts.map((p: any) => ({ ...p, type: 'post' }));
                const markedUsers = users.map((u: any) => ({ ...u, type: 'user', id: `user_${u.id}`, originalId: u.id })); // Avoid ID collision

                // Combine results (users first)
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
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFeed();
        });
        return unsubscribe;
    }, [navigation, user, activeTab, searchQuery]);

    // Also trigger fetch when activeTab changes directly (for immediate feedback)
    useEffect(() => {
        fetchFeed();
    }, [activeTab]);

    // Debounce search
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

        // Direct Repost kontrolü
        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;

        // Eğer Direct Repost ise, etkileşim orijinal posta yapılmalı
        // Quote Repost ise, etkileşim repostun kendisine yapılmalı
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        const updatedFeed = feed.map(post => {
            // Güncellenecek postlar:
            // 1. Hedef postun kendisi (targetPostId ile eşleşen)
            // 2. Hedef postun Direct Repostları (original_post.id'si targetPostId olanlar)

            const isTargetPost = post.id === targetPostId;
            const isDirectRepostOfTarget = post.original_post && post.original_post.id === targetPostId &&
                (!post.content || post.content === 'Yeniden paylaşım' || post.content === post.original_post.content);

            if (isTargetPost || isDirectRepostOfTarget) {
                // Hangi objeyi güncelleyeceğiz?
                // Eğer postun kendisi ise post objesini
                // Eğer repost ise post.original_post objesini

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
            // Revert on error could be added here
        }
    };

    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedPostForRepost, setSelectedPostForRepost] = useState<any>(null);

    const handleRepostPress = (item: any) => {
        // Eğer gönderi bir Direct Repost ise, orijinal gönderiyi hedef al
        // Böylece zincirleme repost yerine her zaman orijinal içerik paylaşılır
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

        try {
            // Direct Repost: İçerik orijinal ile aynı olmalı
            const content = item.content;
            const originalPosterUsername = item.user.username;
            const newSource = 'Paylaşım';
            const newAuthor = originalPosterUsername;
            const originalPostId = item.id;

            await postService.create(user.id, '', content, newSource, newAuthor, originalPostId);
            fetchFeed();
            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Yeniden gönderildi!',
            });
        } catch (error: any) {
            console.error('Repost error:', error);
            const errorMessage = error.message || 'Paylaşılamadı.';
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: errorMessage,
            });
        }
    };

    const handleQuoteRepost = () => {
        if (!selectedPostForRepost) return;
        setRepostMenuVisible(false);
        (navigation as any).navigate('CreateQuote', { originalPost: selectedPostForRepost });
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            'Sil',
            'Bu gönderiyi silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (user) {
                                await postService.delete(user.id, item.id);
                                setFeed(prev => prev.filter(post => post.id !== item.id));
                                Toast.show({
                                    type: 'success',
                                    text1: 'Başarılı',
                                    text2: 'Gönderi silindi.',
                                });
                            }
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Hata',
                                text2: 'Silinemedi.',
                            });
                        }
                    },
                },
            ]
        );
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

        // Direct Repost kontrolü
        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;

        // Etkileşim ID'si belirle
        const interactionId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        return (
            <PostCard
                post={item}
                onPress={() => setSelectedPostId(interactionId)}
                onLike={() => handleLike(item)}
                onComment={() => (navigation as any).navigate('PostDetail', { postId: interactionId, autoFocusComment: false })}
                onRepost={() => handleRepostPress(item)}
                onDelete={user && user.username === item.user.username ? () => handleDelete(item) : undefined}
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
                    <TouchableOpacity onPress={toggleMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon name="menu" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.pageTitleContainer}>
                    <Image
                        source={require('../../assets/images/header_logo.png')}
                        style={styles.headerLogo}
                    />
                </View>
                <View style={[styles.headerRight, { flexDirection: 'row', alignItems: 'center', paddingRight: 16 }]}>
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
                        outputRange: [0, 60] // 40 height + 10 margin + extra buffer if needed
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
                    // autoFocus // Removing autoFocus as it might cause issues during animation
                    />
                </View>
            </Animated.View>

            <View style={styles.tabsContainer}>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('trend')}
                        style={[styles.tab, activeTab === 'trend' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'trend' && styles.activeTabText]}>Trendler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('movie')}
                        style={[styles.tab, activeTab === 'movie' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'movie' && styles.activeTabText]}>Film</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('book')}
                        style={[styles.tab, activeTab === 'book' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>Kitap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('music')}
                        style={[styles.tab, activeTab === 'music' && styles.activeTab]}
                    >
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



            {/* SideMenu is now handled globally, so we don't render it here */}

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onDirectRepost={handleDirectRepost}
                onQuoteRepost={handleQuoteRepost}
            />


        </View>
    );
};
