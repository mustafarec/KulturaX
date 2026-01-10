import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { interactionService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { UIComment, CommentReply } from '../types/models';

// Components
import { CommentItem } from './comments/CommentItem';
import { CommentInput } from './comments/CommentInput';

// Styles
import { getStyles } from './styles/CommentModal.styles';

interface CommentModalProps {
    visible: boolean;
    onClose: () => void;
    postId: number;
    onCommentAdded?: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ visible, onClose, postId, onCommentAdded }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const [comments, setComments] = useState<UIComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [replyTo, setReplyTo] = useState<CommentReply | null>(null);
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

    const handleReply = (comment: UIComment) => {
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

    const renderItem = ({ item }: { item: UIComment }) => (
        <CommentItem
            item={item}
            onProfilePress={goToProfile}
            onLike={handleLike}
            onReply={handleReply}
        />
    );

    const getDescendants = (parentId: number, allComments: UIComment[]): UIComment[] => {
        const directChildren = allComments.filter(c => c.parent_id === parentId);
        let results: UIComment[] = [];
        directChildren.forEach(child => {
            results.push(child);
            results = [...results, ...getDescendants(child.id, allComments)];
        });
        return results;
    };

    const organizedComments = useMemo(() => {
        const mainComments = comments.filter(c => !c.parent_id);

        let result: UIComment[] = [];
        mainComments.forEach(main => {
            result.push(main);
            const descendants = getDescendants(main.id, comments);
            result = [...result, ...descendants];
        });
        return result;
    }, [comments]);

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

                        <CommentInput
                            ref={inputRef}
                            value={newComment}
                            onChangeText={setNewComment}
                            onSend={handleSend}
                            replyTo={replyTo}
                            onCancelReply={() => setReplyTo(null)}
                        />
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};


