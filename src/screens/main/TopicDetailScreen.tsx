import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { topicService, interactionService, postService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { RepostMenu } from '../../components/RepostMenu';
import { SharePostModal } from '../../components/SharePostModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TopicDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets(); // Hook


    // Check if params exists, if not handle gracefully or redirect
    const { topic } = route.params as { topic: any } || {};

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(topic?.is_followed || false);
    const [followerCount, setFollowerCount] = useState(parseInt(topic?.follower_count || '0', 10));

    // Interaction States
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedPostForRepost, setSelectedPostForRepost] = useState<any>(null);

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);

    const handleLike = async (item: any) => {
        if (!user) return;
        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        const updatePosts = (list: any[]) => list.map(post => {
            const isTargetPost = post.id === targetPostId;
            const isDirectRepostOfTarget = post.original_post && post.original_post.id === targetPostId &&
                (!post.content || post.content === 'Yeniden paylaşım' || post.content === post.original_post.content);

            if (isTargetPost || isDirectRepostOfTarget) {
                const postToUpdate = isTargetPost ? post : post.original_post;
                const currentCount = parseInt(postToUpdate.like_count || '0', 10);
                const newIsLiked = !postToUpdate.is_liked;
                const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

                if (isTargetPost) {
                    return { ...post, is_liked: newIsLiked, like_count: newCount };
                } else {
                    return {
                        ...post,
                        original_post: { ...post.original_post, is_liked: newIsLiked, like_count: newCount }
                    };
                }
            }
            return post;
        });

        setPosts(updatePosts);

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
        const originalPostId = item.id;

        // Optimistic Update
        setPosts(posts => {
            return posts.map(post => {
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
        });

        try {
            await postService.create(user.id, '', 'Yeniden paylaşım', 'Paylaşım', user.username, originalPostId);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Yeniden paylaşıldı.' });
        } catch (error: any) {
            console.error('Repost error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Paylaşılamadı.' });
        }
    };

    const handleQuoteRepost = () => {
        if (!selectedPostForRepost) return;
        setRepostMenuVisible(false);
        (navigation as any).navigate('CreateQuote', { originalPost: selectedPostForRepost });
    };

    const handleOptionsPress = (item: any, position: { x: number; y: number; width: number; height: number }) => {
        setSelectedPostForOptions(item);
        setMenuPosition(position);
        setOptionsModalVisible(true);
    };

    const handleDelete = () => {
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        const item = selectedPostForOptions;
        if (!item) return;

        try {
            if (user) {
                await postService.delete(user.id, item.id);
                setPosts(prev => prev.filter(post => post.id !== item.id));
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

    const handleToggleSave = async (item: any) => {
        if (!item || !user) return;
        const isSaved = item.is_saved;

        const updatePosts = (list: any[]) => list.map(p => {
            if (p.id === item.id) return { ...p, is_saved: !isSaved };
            if (p.original_post && p.original_post.id === item.id) return {
                ...p,
                original_post: { ...p.original_post, is_saved: !isSaved }
            };
            return p;
        });
        setPosts(updatePosts);

        try {
            await interactionService.toggleBookmark(user.id, item.id);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: !isSaved ? 'Kaydedildi.' : 'Kaydedilenlerden çıkarıldı.' });
        } catch (error: any) {
            // Revert
            setPosts(prev => {
                return prev.map(p => {
                    if (p.id === item.id) return { ...p, is_saved: isSaved };
                    if (p.original_post && p.original_post.id === item.id) return {
                        ...p,
                        original_post: { ...p.original_post, is_saved: isSaved }
                    };
                    return p;
                });
            });
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız.' });
        }
    };

    const handleShare = (item: any) => {
        setSelectedPostForShare(item);
        setShareModalVisible(true);
    };

    const handleContentPress = (type: 'book' | 'movie' | 'music', id: string) => {
        (navigation as any).navigate('ContentDetail', { id, type });
    };

    // If topic is missing, go back
    useEffect(() => {
        if (!topic) {
            navigation.goBack();
        }
    }, [topic]);

    useEffect(() => {
        if (topic) {
            loadPosts();
        }
    }, [topic]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await topicService.getPostsByTopic(topic.id);
            setPosts(data.map((p: any) => ({ ...p, type: 'post' })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!user) return;
        // Optimistic update
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        setFollowerCount((prev: number) => newStatus ? prev + 1 : prev - 1);

        try {
            await topicService.followTopic(topic.id);
        } catch (error) {
            // Revert
            setIsFollowing(!newStatus);
            setFollowerCount((prev: number) => !newStatus ? prev + 1 : prev - 1);
        }
    };

    if (!topic) return null;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            padding: 24,
            paddingTop: 24 + insets.top, // Dynamic safe area for content
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.secondary + '20', // 20% opacity
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        description: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
            paddingHorizontal: 20,
        },
        stats: {
            flexDirection: 'row',
            gap: 16,
            marginBottom: 16,
        },
        statText: {
            color: theme.colors.textSecondary,
            fontSize: 13,
        },
        followButton: {
            backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: isFollowing ? 1 : 0,
            borderColor: theme.colors.border,
        },
        followButtonText: {
            color: isFollowing ? theme.colors.text : '#fff',
            fontWeight: '600',
        },
        backButton: {
            position: 'absolute',
            top: 16 + insets.top, // Dynamic safe area
            left: 16,
            zIndex: 10,
            padding: 8,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        }
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={topic.icon || 'cube-outline'} size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.title}>{topic.name}</Text>
                        {topic.description && <Text style={styles.description}>{topic.description}</Text>}

                        <View style={styles.stats}>
                            <Text style={styles.statText}>{followerCount} takipçi</Text>
                            <Text style={styles.statText}>•</Text>
                            <Text style={styles.statText}>{topic.post_count} gönderi</Text>
                        </View>

                        <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                            <Text style={styles.followButtonText}>{isFollowing ? 'Takip Ediliyor' : 'Takip Et'}</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={() => (navigation as any).navigate('PostDetail', { postId: item.id })}
                        onLike={() => handleLike(item)}
                        onComment={() => (navigation as any).navigate('PostDetail', { postId: item.id, autoFocusComment: true })}
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
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={{ color: theme.colors.textSecondary }}>Henüz bu konuda paylaşım yok.</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 20 }} color={theme.colors.primary} /> : null}
            />

            <PostOptionsModal
                visible={optionsModalVisible}
                onClose={() => setOptionsModalVisible(false)}
                onDelete={handleDelete}
                isOwner={selectedPostForOptions?.user?.id === user?.id}
                targetPosition={menuPosition}
            />

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

            <ThemedDialog
                visible={deleteDialogVisible}
                title="Sil"
                message="Bu gönderiyi silmek istediğinizden emin misiniz?"
                actions={[
                    { text: 'İptal', style: 'cancel', onPress: () => setDeleteDialogVisible(false) },
                    { text: 'Sil', style: 'destructive', onPress: confirmDelete }
                ]}
                onClose={() => setDeleteDialogVisible(false)}
            />
        </View>
    );
};
