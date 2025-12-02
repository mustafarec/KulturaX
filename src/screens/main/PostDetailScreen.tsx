import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image, Keyboard } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { postService, interactionService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { RepostMenu } from '../../components/RepostMenu';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';

export const PostDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { postId, autoFocusComment } = route.params as { postId: number; autoFocusComment?: boolean };
    const { user: currentUser } = useAuth();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Comment State
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isCommentsLoading, setIsCommentsLoading] = useState(true);
    const [replyTo, setReplyTo] = useState<{ id: number, username: string } | null>(null);
    const inputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Interaction State
    const [repostMenuVisible, setRepostMenuVisible] = useState(false);
    const [selectedRepostPost, setSelectedRepostPost] = useState<any>(null);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const allPosts = await postService.getFeed(currentUser?.id);
            const foundPost = allPosts.find((p: any) => p.id == postId);

            if (foundPost) {
                setPost(foundPost);
            } else {
                Toast.show({ type: 'error', text1: 'Hata', text2: 'Gönderi bulunamadı veya silinmiş.' });
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Gönderi yüklenirken bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        setIsCommentsLoading(true);
        try {
            const data = await interactionService.getComments(postId, currentUser?.id);
            setComments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [postId]);

    useEffect(() => {
        if (autoFocusComment && !loading && !isCommentsLoading) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 500);
        }
    }, [autoFocusComment, loading, isCommentsLoading]);

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

    const handleSendComment = async () => {
        if (!newComment.trim() || !currentUser) return;

        try {
            await interactionService.addComment(currentUser.id, postId, newComment, replyTo?.id);
            setNewComment('');
            setReplyTo(null);
            Keyboard.dismiss();
            fetchComments();
            // Refresh post to update comment count
            fetchPost();
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Yorum gönderilemedi.',
            });
        }
    };

    const handleLikeComment = async (commentId: number) => {
        if (!currentUser) return;
        try {
            const result = await interactionService.likeComment(currentUser.id, commentId);
            setComments(prevComments => prevComments.map(c => {
                if (c.id === commentId) {
                    return { ...c, is_liked: result.liked, like_count: result.count };
                }
                return c;
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleReply = (comment: any) => {
        setReplyTo({ id: comment.id, username: comment.username });
        setNewComment(`@${comment.username} `);
        inputRef.current?.focus();
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

    const goToProfile = (userId: number) => {
        (navigation as any).navigate('OtherProfile', { userId: userId });
    };

    // Comment Organization Logic
    const getDescendants = (parentId: number, allComments: any[]): any[] => {
        const directChildren = allComments.filter(c => c.parent_id === parentId);
        let results: any[] = [];
        directChildren.forEach(child => {
            results.push(child);
            results = [...results, ...getDescendants(child.id, allComments)];
        });
        return results;
    };

    const organizedComments = useMemo(() => {
        const mainComments = comments.filter(c => !c.parent_id);
        let result: any[] = [];
        mainComments.forEach(main => {
            result.push(main);
            const descendants = getDescendants(main.id, comments);
            result = [...result, ...descendants];
        });
        return result;
    }, [comments]);

    const renderCommentItem = (item: any) => {
        const isReply = !!item.parent_id;
        return (
            <View key={item.id} style={[styles.commentItem, isReply && styles.replyItem]}>
                <TouchableOpacity onPress={() => goToProfile(item.user_id)}>
                    <View style={styles.avatarPlaceholder}>
                        {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                        ) : (
                            <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                </TouchableOpacity>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={() => goToProfile(item.user_id)}>
                            <Text style={styles.username}>{item.username}</Text>
                        </TouchableOpacity>
                        <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                    </View>
                    <Text style={styles.text}>{item.content}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleLikeComment(item.id)}
                        >
                            <Text style={[styles.actionText, item.is_liked && styles.likedText]}>
                                {item.is_liked ? '❤️' : '🤍'} {item.like_count > 0 ? item.like_count : 'Beğen'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleReply(item)}
                        >
                            <Text style={styles.actionText}>↩️ Cevapla</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gönderi</Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
                    onComment={() => inputRef.current?.focus()}
                    onRepost={() => handleRepost(post)}
                />

                <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Yorumlar ({comments.length})</Text>
                    {isCommentsLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                    ) : comments.length === 0 ? (
                        <View style={styles.emptyComments}>
                            <Text style={styles.emptyCommentsText}>Henüz yorum yok. İlk yorumu sen yap!</Text>
                        </View>
                    ) : (
                        organizedComments.map(item => renderCommentItem(item))
                    )}
                </View>
            </ScrollView>

            <View style={styles.inputWrapper}>
                {replyTo && (
                    <View style={styles.replyBar}>
                        <Text style={styles.replyText}>@{replyTo.username} kişisine yanıt veriliyor</Text>
                        <TouchableOpacity onPress={() => {
                            setReplyTo(null);
                            setNewComment('');
                        }}>
                            <Text style={styles.cancelReply}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Yorum yaz..."
                        placeholderTextColor="#95A5A6"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !newComment.trim() && styles.disabledButton]}
                        onPress={handleSendComment}
                        disabled={!newComment.trim()}
                    >
                        <Icon name="paper-plane" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <RepostMenu
                visible={repostMenuVisible}
                onClose={() => setRepostMenuVisible(false)}
                onRepost={handleDirectRepost}
                onQuote={handleQuoteRepost}
            />
        </KeyboardAvoidingView>
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        zIndex: 10,
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
    scrollContent: {
        paddingBottom: 100, // Space for input area
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
    commentsSection: {
        padding: 16,
        borderTopWidth: 8,
        borderTopColor: '#F8F9FA',
    },
    commentsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    emptyComments: {
        padding: 20,
        alignItems: 'center',
    },
    emptyCommentsText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    replyItem: {
        marginLeft: 40,
        marginTop: -10,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontWeight: 'bold',
        color: theme.colors.text,
        fontSize: 16,
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        fontWeight: '700',
        color: '#2C3E50',
        fontSize: 14,
    },
    text: {
        color: '#4A4A4A',
        fontSize: 14,
        lineHeight: 20,
    },
    time: {
        fontSize: 11,
        color: '#95A5A6',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 16,
    },
    actionButton: {
        paddingVertical: 4,
    },
    actionText: {
        fontSize: 12,
        color: '#95A5A6',
        fontWeight: '600',
    },
    likedText: {
        color: theme.colors.primary,
    },
    inputWrapper: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        backgroundColor: '#FFFFFF',
    },
    replyBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F0F2F5',
    },
    replyText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    cancelReply: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'flex-end',
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 10,
        color: '#2C3E50',
        marginRight: 12,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#BDC3C7',
    },
});
