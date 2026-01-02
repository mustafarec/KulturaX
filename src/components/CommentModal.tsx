import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { interactionService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

interface CommentModalProps {
    visible: boolean;
    onClose: () => void;
    postId: number;
    onCommentAdded?: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ visible, onClose, postId, onCommentAdded }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [replyTo, setReplyTo] = useState<{ id: number, username: string, rootId?: number } | null>(null);
    const { user } = useAuth();
    const inputRef = React.useRef<TextInput>(null);
    const slideAnim = useRef(new Animated.Value(600)).current;

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const data = await interactionService.getComments(postId, user?.id);
            setComments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchComments();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            slideAnim.setValue(600);
        }
    }, [visible, postId]);

    const handleSend = async () => {
        if (!newComment.trim() || !user) return;

        try {
            await interactionService.addComment(user.id, postId, newComment, replyTo?.id);
            setNewComment('');
            setReplyTo(null);
            fetchComments();
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Yorum gönderilemedi.',
            });
        }
    };

    const handleLike = async (commentId: number) => {
        if (!user) return;
        try {
            const result = await interactionService.likeComment(user.id, commentId);
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
        if (comment.parent_id) {
            setNewComment(`@${comment.username} `);
        } else {
            setNewComment('');
        }
        inputRef.current?.focus();
    };

    const goToProfile = (userId: number) => {
        onClose();
        setTimeout(() => {
            (navigation as any).navigate('OtherProfile', { userId: userId });
        }, 300);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isReply = !!item.parent_id;
        return (
            <View style={[styles.commentItem, isReply && styles.replyItem]}>
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
                            onPress={() => handleLike(item.id)}
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

    const getDescendants = (parentId: number, allComments: any[]): any[] => {
        const directChildren = allComments.filter(c => c.parent_id === parentId);
        let results: any[] = [];
        directChildren.forEach(child => {
            results.push(child);
            results = [...results, ...getDescendants(child.id, allComments)];
        });
        return results;
    };

    const organizedComments = React.useMemo(() => {
        const mainComments = comments.filter(c => !c.parent_id);

        let result: any[] = [];
        mainComments.forEach(main => {
            result.push(main);
            const descendants = getDescendants(main.id, comments);
            result = [...result, ...descendants];
        });
        return result;
    }, [comments]);

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
        },
        backdrop: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        container: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '85%',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: -4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
        },
        header: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            alignItems: 'center',
        },
        headerIndicator: {
            width: 40,
            height: 4,
            backgroundColor: theme.colors.textSecondary,
            borderRadius: 2,
            marginBottom: 12,
            opacity: 0.3,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.text,
        },
        closeButtonContainer: {
            padding: 8,
            backgroundColor: theme.colors.background,
            borderRadius: 20,
        },
        closeButton: {
            color: theme.colors.textSecondary,
            fontSize: 14,
            fontWeight: 'bold',
        },
        list: {
            padding: 16,
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
            color: '#FFFFFF',
            fontSize: 16,
        },
        commentContent: {
            flex: 1,
            backgroundColor: theme.colors.background,
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
        text: {
            color: theme.colors.text,
            fontSize: 14,
            lineHeight: 20,
        },
        time: {
            fontSize: 11,
            color: theme.colors.textSecondary,
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
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        likedText: {
            color: theme.colors.primary,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 60,
        },
        emptyIcon: {
            fontSize: 48,
            marginBottom: 12,
            opacity: 0.5,
            color: theme.colors.textSecondary,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.colors.textSecondary,
            fontSize: 15,
        },
        footer: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        replyBar: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.background,
        },
        replyText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        cancelReply: {
            fontSize: 12,
            color: theme.colors.primary,
            fontWeight: 'bold',
        },
        inputContainer: {
            flexDirection: 'row',
            padding: 16,
            alignItems: 'flex-end',
            backgroundColor: theme.colors.surface,
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.background,
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 12,
            color: theme.colors.text,
            marginRight: 12,
            fontSize: 15,
            maxHeight: 100,
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 24,
            justifyContent: 'center',
        },
        disabledButton: {
            backgroundColor: theme.colors.textSecondary,
            opacity: 0.5,
        },
        sendButtonText: {
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 14,
        },
    }), [theme]);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.header}>
                            <View style={styles.headerIndicator} />
                            <View style={styles.headerRow}>
                                <Text style={styles.title}>Yorumlar</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={organizedComments}
                                renderItem={renderItem}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={styles.list}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyIcon}>💭</Text>
                                        <Text style={styles.emptyText}>Henüz yorum yok. İlk yorumu sen yap!</Text>
                                    </View>
                                }
                            />
                        )}

                        <View style={styles.footer}>
                            {replyTo && (
                                <View style={styles.replyBar}>
                                    <Text style={styles.replyText}>@{replyTo.username} kişisine yanıt veriliyor</Text>
                                    <TouchableOpacity onPress={() => setReplyTo(null)}>
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
                                    onPress={handleSend}
                                    disabled={!newComment.trim()}
                                >
                                    <Text style={styles.sendButtonText}>Gönder</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};


