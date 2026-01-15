import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Platform, Image, Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { postService, interactionService, clickTrackingService } from '../../services/backendApi';
import { formatRelativeTime } from '../../utils/dateUtils';
import { PostCard } from '../../components/PostCard';
import { SkeletonPost } from '../../components/ui/SkeletonPost';
import { ArrowLeft, Send, Heart, MessageCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import { useAuth } from '../../context/AuthContext';
import { MoreHorizontal, Trash } from 'lucide-react-native';
import { ContentType } from '../../types/models';
import { NativeAdComment } from '../../components/ads';

export const PostDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { postId, autoFocusComment, commentId } = route.params as { postId: number; autoFocusComment?: boolean; commentId?: number };
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
    const insets = useSafeAreaInsets();

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


    // Options Menu State
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deleteCommentDialogVisible, setDeleteCommentDialogVisible] = useState(false);
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Keyboard visibility tracking for Android SafeArea fix
    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleOptionsPress = (position: { x: number, y: number, width: number, height: number }) => {
        setMenuPosition(position);
        setOptionsModalVisible(true);
    };

    const handleToggleSave = async () => {
        if (!post || !currentUser) return;
        const isSaved = post.is_saved;
        setPost({ ...post, is_saved: !isSaved });

        try {
            await interactionService.toggleBookmark(currentUser.id, post.id);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: !isSaved ? 'Kaydedildi.' : 'Kaydedilenlerden çıkarıldı.' });
        } catch (error: any) {
            setPost({ ...post, is_saved: isSaved });
            const errorMessage = error.response?.data?.error || error.message || 'İşlem başarısız.';
            Toast.show({ type: 'error', text1: 'Hata', text2: errorMessage });
        }
    };

    const handleDelete = () => {
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        if (!post || !currentUser) return;
        try {
            await postService.delete(post.id);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Gönderi silindi.' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Silinemedi.' });
        } finally {
            setDeleteDialogVisible(false);
            setOptionsModalVisible(false);
        }
    };

    const handleDeleteComment = (commentId: number) => {
        setSelectedCommentId(commentId);
        setDeleteCommentDialogVisible(true);
    };

    const confirmDeleteComment = async () => {
        if (!selectedCommentId || !currentUser) return;
        try {
            await interactionService.deleteComment(currentUser.id, selectedCommentId);
            setComments(prevComments => prevComments.filter(c => c.id !== selectedCommentId));
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Yorum silindi.' });
            // Post yorum sayısını güncellemek için postu yeniden çekebiliriz veya manuel azaltabiliriz
            // fetchPost(); 
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Yorum silinemedi.' });
        } finally {
            setDeleteCommentDialogVisible(false);
            setSelectedCommentId(null);
        }
    };

    const fetchPost = async () => {
        setLoading(true);
        try {
            const allPosts = await postService.getFeed(currentUser?.id);
            const foundPost = allPosts.find((p: any) => p.id == postId);

            if (foundPost) {
                setPost(foundPost);
            } else {
                // If not found, it might be deleted. We don't error out yet 
                // because we want to show the comments thread.
                setPost(null);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
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

    // Interaction logic moved to PostCard internal hook

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

    const handleContentPress = (type: ContentType, id: string, title?: string) => {
        // Track click for analytics
        clickTrackingService.trackClick(type, id, title, 'post_detail');

        if (type === 'book') {
            (navigation as any).navigate('BookDetail', { bookId: id });
        } else if (type === 'movie') {
            (navigation as any).navigate('MovieDetail', { movieId: parseInt(id, 10) });
        }
    };

    const goToProfile = (userId: number) => {
        (navigation as any).navigate('OtherProfile', { userId: userId });
    };

    const organizedComments = useMemo(() => {
        // If focusing on a sub-thread, only show direct replies to the root comment
        if (commentId) {
            return comments.filter(c => c.parent_id === commentId);
        }
        // Otherwise, only show top-level comments
        return comments.filter(c => !c.parent_id);
    }, [comments, commentId]);

    const rootComment = useMemo(() => {
        if (!commentId) return null;
        return comments.find(c => c.id === commentId);
    }, [comments, commentId]);

    const styles = useMemo(() => StyleSheet.create({
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
            paddingVertical: 15,
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
            borderTopColor: theme.colors.surface, // Was #F8F9FA
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
            backgroundColor: theme.colors.surface, // Was #F8F9FA
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
            color: theme.colors.text,
            fontSize: 14,
        },
        displayName: {
            fontWeight: '700',
            color: theme.colors.text,
            fontSize: 14,
            marginBottom: 2,
        },
        subHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 0,
        },
        usernameHandle: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        dot: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginHorizontal: 4,
        },
        text: {
            color: theme.colors.text, // Was #4A4A4A
            fontSize: 14,
            lineHeight: 20,
            marginTop: 4,
        },
        time: {
            fontSize: 12,
            color: theme.colors.textSecondary, // Was #95A5A6
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
            color: theme.colors.textSecondary, // Was #95A5A6
            fontWeight: '600',
        },
        moreButton: {
            padding: 4,
            marginLeft: 8,
        },
        optionsOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 100,
        },
        commentOptionsMenu: {
            position: 'absolute',
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            padding: 8,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            minWidth: 120,
            zIndex: 101,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
        },
        menuText: {
            marginLeft: 8,
            fontSize: 14,
            color: theme.colors.text,
        },
        menuTextDestructive: {
            marginLeft: 8,
            fontSize: 14,
            color: theme.colors.error,
        },
        likedText: {
            color: theme.colors.primary,
        },
        inputWrapper: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            paddingBottom: insets.bottom,
        },
        replyBar: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.surface, // Was #F0F2F5
        },
        replyText: {
            fontSize: 12,
            color: theme.colors.textSecondary, // Was #7F8C8D
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
            backgroundColor: theme.colors.background, // Was #FFFFFF
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.surface, // Was #F0F2F5
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 10,
            color: theme.colors.text, // Was #2C3E50
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
            backgroundColor: theme.colors.secondary, // Was #BDC3C7
        },
    }), [theme, isKeyboardVisible, insets.bottom]);

    const renderCommentItem = (item: any) => {
        const childCount = comments.filter(c => c.parent_id === item.id).length;

        return (
            <View key={item.id} style={styles.commentItem}>
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
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={() => goToProfile(item.user_id)}>
                                <Text style={styles.displayName}>{item.name ? `${item.name} ${item.surname || ''}` : item.username}</Text>
                            </TouchableOpacity>
                            <View style={styles.subHeader}>
                                <Text style={styles.usernameHandle}>@{item.username}</Text>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
                            </View>
                        </View>
                        {currentUser && item.user_id === currentUser.id && (
                            <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => handleDeleteComment(item.id)}
                            >
                                <MoreHorizontal size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.text}>{item.content}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, { flexDirection: 'row', alignItems: 'center' }]}
                            onPress={() => handleLikeComment(item.id)}
                        >
                            <Heart
                                size={16}
                                color={item.is_liked ? theme.colors.error : theme.colors.textSecondary}
                                fill={item.is_liked ? theme.colors.error : 'transparent'}
                            />
                            <Text style={[styles.actionText, { marginLeft: 6 }, item.is_liked && { color: theme.colors.error }]}>
                                {item.like_count > 0 ? item.like_count : 'Beğen'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { flexDirection: 'row', alignItems: 'center' }]}
                            onPress={() => handleReply(item)}
                        >
                            <MessageCircle size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.actionText, { marginLeft: 6 }]}>Cevapla</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Show Replies Button */}
                    {!commentId && childCount > 0 && (
                        <TouchableOpacity
                            style={{
                                marginTop: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 4
                            }}
                            onPress={() => (navigation as any).push('PostDetail', { postId, commentId: item.id })}
                        >
                            <View style={{
                                width: 20,
                                height: 1,
                                backgroundColor: theme.colors.border,
                                marginRight: 8
                            }} />
                            <Text style={{
                                color: theme.colors.primary,
                                fontSize: 13,
                                fontWeight: '600'
                            }}>
                                {childCount} yanıtı gör
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gönderi</Text>
                </View>
                <View style={{ marginTop: 12 }}>
                    <SkeletonPost />
                </View>
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior="padding"
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'android' ? -insets.bottom : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gönderi</Text>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Placeholder for Deleted Root Post */}
                    {!loading && !post && (
                        <View style={{
                            marginHorizontal: 16,
                            marginTop: 12,
                            padding: 16,
                            backgroundColor: theme.colors.surface,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderStyle: 'dashed',
                            flexDirection: 'row',
                            alignItems: 'center',
                            opacity: 0.8
                        }}>
                            <Trash size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Bu gönderi silindi.</Text>
                        </View>
                    )}

                    {/* Main Post UI */}
                    {post && !commentId && (
                        <View style={{ marginTop: 12 }}>
                            <PostCard
                                post={post}
                                onPress={() => { }}
                                onUserPress={(userId) => {
                                    // Gelen userId'yi kullan (PostCard doğru ID'yi gönderir)
                                    if (userId && userId !== currentUser?.id) {
                                        (navigation as any).navigate('OtherProfile', { userId: userId });
                                    }
                                }}
                                onReposterPress={() => {
                                    // Repost eden kişinin profiline git
                                    const reposterId = post.user.id;
                                    if (reposterId && reposterId !== currentUser?.id) {
                                        (navigation as any).navigate('OtherProfile', { userId: reposterId });
                                    }
                                }}
                                onContentPress={handleContentPress}
                                onComment={() => inputRef.current?.focus()}
                                onOptions={(currentUser && (post.user.id === currentUser.id || post.user.username === currentUser.username)) ? handleOptionsPress : undefined}
                                onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
                                onUpdatePost={(updater) => setPost((prev: any) => prev ? updater(prev) : null)}
                            />
                        </View>
                    )}

                    {/* Sub-Thread Header (Focused Comment) */}
                    {commentId && rootComment && (
                        <View style={{ marginTop: 12 }}>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    marginBottom: 8
                                }}
                                onPress={() => navigation.goBack()}
                            >
                                <ArrowLeft size={16} color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.primary, marginLeft: 8, fontSize: 14 }}>Ana gönderiye dön</Text>
                            </TouchableOpacity>
                            <View style={[styles.commentItem, { backgroundColor: theme.colors.surface, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }]}>
                                <TouchableOpacity onPress={() => goToProfile(rootComment.user_id)}>
                                    <View style={styles.avatarPlaceholder}>
                                        {rootComment.avatar_url ? (
                                            <Image source={{ uri: rootComment.avatar_url }} style={styles.avatar} />
                                        ) : (
                                            <Text style={styles.avatarText}>{rootComment.username.charAt(0).toUpperCase()}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.commentContent}>
                                    <View style={styles.commentHeader}>
                                        <View>
                                            <Text style={styles.displayName}>{rootComment.name ? `${rootComment.name} ${rootComment.surname || ''}` : rootComment.username}</Text>
                                            <Text style={styles.usernameHandle}>@{rootComment.username}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.text, { fontSize: 16, marginTop: 8 }]}>{rootComment.content}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsTitle}>
                            {commentId ? 'Yanıta Gelen Cevaplar' : `Yorumlar (${comments.length})`}
                        </Text>
                        {isCommentsLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {/* Sponsorlu Reklam - Yorumlar Başında */}
                                <NativeAdComment />

                                {comments.length === 0 ? (
                                    <View style={styles.emptyComments}>
                                        <Text style={styles.emptyCommentsText}>Henüz yorum yok. İlk yorumu sen yap!</Text>
                                    </View>
                                ) : (
                                    organizedComments.map(item => renderCommentItem(item))
                                )}
                            </>
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
                            <Send size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>



                <PostOptionsModal
                    visible={optionsModalVisible}
                    onClose={() => setOptionsModalVisible(false)}
                    onDelete={handleDelete}
                    isOwner={post?.user?.id === currentUser?.id}
                    targetPosition={menuPosition}
                    onToggleSave={handleToggleSave}
                    isSaved={!!post?.is_saved}
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

                <ThemedDialog
                    visible={deleteCommentDialogVisible}
                    title="Yorumu Sil"
                    message="Bu yorumu silmek istediğinize emin misiniz?"
                    onClose={() => setDeleteCommentDialogVisible(false)}
                    actions={[
                        { text: 'İptal', style: 'cancel', onPress: () => setDeleteCommentDialogVisible(false) },
                        { text: 'Sil', style: 'destructive', onPress: confirmDeleteComment }
                    ]}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};


