import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelectorModal } from '../../components/ThemeSelectorModal';
import { postService, interactionService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { RepostMenu } from '../../components/RepostMenu';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import ThemeIcon from 'react-native-vector-icons/Ionicons';

export const FeedScreen = () => {
    const [feed, setFeed] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [newPostMenuVisible, setNewPostMenuVisible] = useState(false);
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const { user } = useAuth();
    const navigation = useNavigation();
    const { theme, themeMode, toggleTheme, setThemeMode } = useTheme();

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
            paddingTop: 60,
            paddingBottom: 20,
            backgroundColor: theme.colors.surface,
            ...theme.shadows.soft,
            zIndex: 10,
        },
        headerLeft: {
            width: 40,
        },
        headerRight: {
            width: 40,
            alignItems: 'flex-end',
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
            paddingTop: 0,
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
            const data = await postService.getFeed(user?.id);
            setFeed(data);
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
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFeed();
        });
        return unsubscribe;
    }, [navigation, user]);

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

            await postService.create(user.id, content, newSource, newAuthor, originalPostId);
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

    const handleContentPress = (type: 'book' | 'movie', id: string) => {
        if (type === 'book') {
            (navigation as any).navigate('BookDetail', { bookId: id });
        } else if (type === 'movie') {
            (navigation as any).navigate('MovieDetail', { movieId: parseInt(id, 10) });
        }
    };

    const renderItem = ({ item }: { item: any }) => {
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
                onComment={() => (navigation as any).navigate('PostDetail', { postId: interactionId, autoFocusComment: true })}
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
                    <TouchableOpacity onPress={() => (navigation as any).navigate('Profile')}>
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <Text style={styles.headerAvatarText}>{user?.username?.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.pageTitleContainer}>
                    <Image
                        source={require('../../assets/images/header_logo.png')}
                        style={styles.headerLogo}
                    />
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={() => setThemeModalVisible(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ThemeIcon
                            name={themeMode === 'auto' ? 'color-wand-outline' : (themeMode === 'dark' ? 'moon' : 'sunny')}
                            size={24}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={feed}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="social-dropbox" size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <Text style={styles.emptyText}>Henüz gönderi yok.</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* New Post Menu */}
            {newPostMenuVisible && (
                <View style={styles.newPostMenu}>
                    <TouchableOpacity
                        style={styles.newPostMenuItem}
                        onPress={() => {
                            setNewPostMenuVisible(false);
                            (navigation as any).navigate('CreateQuote', { mode: 'thought' });
                        }}
                    >
                        <Icon name="bubble" size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                        <Text style={styles.newPostMenuText}>Düşünceni Paylaş</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                        style={styles.newPostMenuItem}
                        onPress={() => {
                            setNewPostMenuVisible(false);
                            (navigation as any).navigate('CreateQuote', { mode: 'quote' });
                        }}
                    >
                        <Icon name="book-open" size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                        <Text style={styles.newPostMenuText}>Alıntı/İnceleme Yap</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setNewPostMenuVisible(!newPostMenuVisible)}
                activeOpacity={0.8}
            >
                <Icon name={newPostMenuVisible ? "close" : "pencil"} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onRepost={handleDirectRepost}
                onQuote={handleQuoteRepost}
            />

            <ThemeSelectorModal
                visible={themeModalVisible}
                onClose={() => setThemeModalVisible(false)}
            />
        </View>
    );
};
