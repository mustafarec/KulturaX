import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getStyles } from '../styles/CommentModal.styles';
import { UIComment } from '../../types/models';

interface CommentItemProps {
    item: UIComment;
    onProfilePress: (userId: number) => void;
    onLike: (commentId: number) => void;
    onReply: (comment: UIComment) => void;
}

export const CommentItem: React.FC<CommentItemProps> = React.memo(({ item, onProfilePress, onLike, onReply }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const isReply = !!item.parent_id;

    return (
        <View style={[styles.commentItem, isReply && styles.replyItem]}>
            <TouchableOpacity onPress={() => onProfilePress(item.user_id)}>
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
                    <TouchableOpacity onPress={() => onProfilePress(item.user_id)}>
                        <Text style={styles.username}>{item.username}</Text>
                    </TouchableOpacity>
                    <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                </View>
                <Text style={styles.text}>{item.content}</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onLike(item.id)}
                    >
                        <Text style={[styles.actionText, item.is_liked && styles.likedText]}>
                            {item.is_liked ? '❤️' : '🤍'} {item.like_count > 0 ? item.like_count : 'Beğen'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onReply(item)}
                    >
                        <Text style={styles.actionText}>↩️ Cevapla</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});
