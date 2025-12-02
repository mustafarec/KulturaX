import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { postService, interactionService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { CommentModal } from '../../components/CommentModal';
import { RepostMenu } from '../../components/RepostMenu';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';

export const PostDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { postId } = route.params as { postId: number };
    const { user: currentUser } = useAuth();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Interaction State
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedRepostPost, setSelectedRepostPost] = useState<any>(null);

    const fetchPost = async () => {
        setLoading(true);
        try {
            // Tekil post çekme endpoint'i olmadığı için feed'den filtreliyoruz veya yeni endpoint yazılabilir.
            // Şimdilik getFeed kullanıp filtreleyelim (verimsiz ama hızlı çözüm).
            // İdealde: postService.getPost(postId) olmalı.
            // Backend'de get_post.php olmadığı için, feed'den bulmaya çalışacağız.
            // VEYA: postService.getFeed() tüm postları getiriyorsa oradan buluruz.

            // Geçici Çözüm: Feed'i çekip bulmaya çalışalım.
            // Eğer backend'de get_post.php eklendiyse onu kullanmalıyız.
            // Şimdilik var olan getFeed ile ilerleyelim.
            const allPosts = await postService.getFeed(currentUser?.id);
            const foundPost = allPosts.find((p: any) => p.id == postId);

            if (foundPost) {
                setPost(foundPost);
            } else {
                // Post bulunamadı
                Toast.show({ type: 'error', text1: 'Hata', text2: 'Gönderi bulunamadı veya silinmiş.' });
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Gönderi yüklenirken bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const handleLike = async (post: any) => {
        if (!currentUser) return;
        try {
            const isLiked = post.is_liked;
            const currentLikeCount = typeof post.like_count === 'string' ? parseInt(post.like_count, 10) : post.like_count;
            const newLikeCount = isLiked ? currentLikeCount - 1 : currentLikeCount + 1;

            setPost({ ...post, is_liked: !isLiked, like_count: newLikeCount });

            const response = await interactionService.toggleLike(currentUser.id, post.id);

            if (response && typeof response.count === 'number') {
                setPost({ ...post, is_liked: response.liked, like_count: response.count });
            }
        } catch (error) {
            console.error(error);
            fetchPost(); // Revert
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
                'Yeniden paylaşım',
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

    const handleContentPress = (type: 'book' | 'movie', id: string) => {
        if (type === 'book') {
            (navigation as any).navigate('BookDetail', { bookId: id });
        } else if (type === 'movie') {
            (navigation as any).navigate('MovieDetail', { movieId: parseInt(id, 10) });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gönderi</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Gönderi bulunamadı.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gönderi</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <PostCard
                    post={post}
                    onPress={() => { }}
                    onUserPress={(userId) => {
                        const targetUserId = post.original_post ? post.original_post.user.id : post.user.id;
                        if (targetUserId !== currentUser?.id) {
                            (navigation as any).navigate('OtherProfile', { userId: targetUserId });
                        }
                    }}
                    onContentPress={handleContentPress}
                    onLike={() => handleLike(post)}
                    onComment={() => setSelectedPostId(post.id)}
                    onRepost={() => handleRepost(post)}
                />
            </ScrollView>

            {selectedPostId && (
                <CommentModal
                    visible={!!selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                    postId={selectedPostId}
                    onCommentAdded={() => {
                        fetchPost();
                    }}
                />
            )}

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onRepost={handleDirectRepost}
                onQuote={handleQuoteRepost}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginLeft: 15,
    },
    content: {
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
});
