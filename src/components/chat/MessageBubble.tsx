import React from 'react';
import { View, Text, Pressable, Animated as RNAnimated, StyleSheet } from 'react-native';
import Animated, { FadeIn, LinearTransition, withTiming } from 'react-native-reanimated';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Reply } from 'lucide-react-native';
import { SharedPostMessage } from '../SharedPostMessage';
import { LinkPreview, extractUrl } from './LinkPreview';
import LinearGradient from 'react-native-linear-gradient';

interface Reaction {
    user_id: number;
    emoji: string;
    username: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    is_read?: number | boolean;
    reactions?: Reaction[];
    reply_to?: { id: number; username: string; content: string } | null;
}

interface MessageBubbleProps {
    item: Message;
    isMyMessage: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    isNewMessage: boolean;
    showUnreadDivider: boolean;
    showDateSeparator: boolean;
    dateLabel: string;
    chatUsername: string;
    theme: any;
    highlightText?: string;
    isFocusedMatch?: boolean;
    onLongPress: (id: number, content: string, isOwn: boolean) => void;
    onSwipeReply: (id: number, content: string, username: string) => void;
}

// Decode HTML entities
const decodeContent = (content: string) => {
    return content
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#039;/g, "'");
};

// Parse date string without timezone conversion (treat as local time)
const parseLocalDate = (dateStr: string): Date => {
    if (dateStr.includes('T')) {
        return new Date(dateStr);
    }
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
};

// Helper to highlight text
const renderHighlightedText = (text: string, highlight: string, styles: any, isFocused: boolean) => {
    if (!highlight || !text) return <Text>{text}</Text>;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <Text>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <Text key={index} style={isFocused ? styles.activeHighlightedText : styles.highlightedText}>
                        {part}
                    </Text>
                ) : (
                    <Text key={index}>{part}</Text>
                )
            )}
        </Text>
    );
};

// Parse shared post JSON
const parseSharedPost = (content: string) => {
    try {
        if (content.trim().startsWith('{')) {
            const parsed = JSON.parse(content);
            if (parsed.type === 'post_share' && parsed.post) {
                return { isSharedPost: true, sharedPostData: parsed.post, sharedPostComment: parsed.comment || '' };
            }
        }
    } catch (e) { }
    return { isSharedPost: false, sharedPostData: null, sharedPostComment: '' };
};

// Custom Entering Animation
const CustomEntering = (targetValues: any) => {
    'worklet';
    return {
        initialValues: {
            transform: [{ translateY: 60 }],
            opacity: 0,
        },
        animations: {
            transform: [{ translateY: withTiming(0, { duration: 300 }) }],
            opacity: withTiming(1, { duration: 300 }),
        },
    };
};

const createStyles = (theme: any) => StyleSheet.create({
    messageBubble: {
        maxWidth: '80%',
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
        position: 'relative',
        ...theme.shadows.default,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: theme.fonts.main,
    },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: theme.colors.text },
    timeText: {
        fontSize: 11,
        fontFamily: theme.fonts.main,
    },
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    theirTimeText: { color: theme.colors.textSecondary },
    readStatusText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: theme.fonts.main,
    },
    myMessageTail: {
        position: 'absolute',
        bottom: 0,
        right: -6,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 0,
        borderTopWidth: 8,
        borderLeftColor: theme.colors.primary,
        borderRightColor: 'transparent',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    theirMessageTail: {
        position: 'absolute',
        bottom: 0,
        left: -6,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 0,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: theme.colors.surface,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateSeparatorText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '500',
        backgroundColor: theme.colors.background,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    unreadDivider: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 16,
    },
    unreadDividerText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    reactionBadge: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 4,
        marginTop: 2,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    highlightedText: {
        backgroundColor: '#FFE066',
        color: '#000',
    },
    activeHighlightedText: {
        backgroundColor: '#FF9F1C',
        color: '#fff',
    },
});

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
    item,
    isMyMessage,
    isFirstInGroup,
    isLastInGroup,
    isNewMessage,
    showUnreadDivider,
    showDateSeparator,
    dateLabel,
    chatUsername,
    theme,
    highlightText,
    isFocusedMatch,
    onLongPress,
    onSwipeReply
}) => {
    // Memoize content analysis
    const { content, isSharedPost, sharedPostData, sharedPostComment, detectedUrl } = React.useMemo(() => {
        const decoded = decodeContent(item.content);
        const shared = parseSharedPost(decoded);
        return {
            content: decoded,
            ...shared,
            detectedUrl: !shared.isSharedPost ? extractUrl(decoded) : null
        };
    }, [item.content]);

    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const animationProps = React.useMemo(() => ({
        entering: CustomEntering,
        layout: LinearTransition.duration(200)
    }), []);

    const groupedStyle = React.useMemo(() => ({
        marginBottom: isLastInGroup ? 12 : 4,
        ...(isMyMessage ? {
            borderTopRightRadius: isFirstInGroup ? 20 : 12,
            borderBottomRightRadius: isLastInGroup ? 4 : 12,
        } : {
            borderTopLeftRadius: isFirstInGroup ? 20 : 12,
            borderBottomLeftRadius: isLastInGroup ? 4 : 12,
        }),
    }), [isLastInGroup, isMyMessage, isFirstInGroup]);

    return (
        <View>
            {/* Date Separator */}
            {showDateSeparator && (
                <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>{dateLabel}</Text>
                </View>
            )}

            {/* Unread Divider */}
            {showUnreadDivider && (
                <View style={styles.unreadDivider} collapsable={false}>
                    <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <LinearGradient
                            colors={theme.dark ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'] : ['rgba(0,0,0,0)', 'rgba(210,180,140,0.4)', 'rgba(0,0,0,0)']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                        />
                        <Text style={styles.unreadDividerText}>Okunmamış Mesajlar</Text>
                    </View>
                </View>
            )}

            <Swipeable
                renderLeftActions={(progress, dragX) => {
                    const trans = dragX.interpolate({ inputRange: [0, 50, 100], outputRange: [-20, 0, 0] });
                    const opacity = dragX.interpolate({ inputRange: [0, 50], outputRange: [0, 1] });
                    return (
                        <RectButton style={{ justifyContent: 'center', alignItems: 'center', width: 50 }}>
                            <RNAnimated.View style={{ transform: [{ translateX: trans }], opacity }}>
                                <View style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    backgroundColor: theme.colors.surface,
                                    justifyContent: 'center', alignItems: 'center',
                                    ...theme.shadows.soft
                                }}>
                                    <Reply size={16} color={theme.colors.primary} />
                                </View>
                            </RNAnimated.View>
                        </RectButton>
                    );
                }}
                onSwipeableLeftOpen={() => {
                    setTimeout(() => {
                        onSwipeReply(item.id, item.content, isMyMessage ? 'Siz' : chatUsername);
                    }, 100);
                }}
            >
                <Pressable onLongPress={() => onLongPress(item.id, item.content, isMyMessage)}>
                    <Animated.View
                        style={[
                            styles.messageBubble,
                            isMyMessage ? styles.myMessage : styles.theirMessage,
                            groupedStyle as any,
                            isSharedPost ? { width: '80%', padding: 4 } : {}
                        ]}
                        {...animationProps}
                    >
                        {/* Tail */}
                        {isLastInGroup && (
                            <View style={isMyMessage ? styles.myMessageTail : styles.theirMessageTail} />
                        )}

                        {/* Reply Context */}
                        {item.reply_to && (
                            <View style={{
                                backgroundColor: isMyMessage ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)',
                                padding: 8, borderRadius: 8, marginBottom: 6,
                                borderLeftWidth: 3, borderLeftColor: isMyMessage ? 'rgba(255,255,255,0.5)' : theme.colors.primary,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <Reply size={12} color={isMyMessage ? 'rgba(255,255,255,0.9)' : theme.colors.primary} style={{ marginRight: 4 }} />
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: isMyMessage ? 'rgba(255,255,255,0.9)' : theme.colors.primary }}>
                                        {item.reply_to.username}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 13, color: isMyMessage ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }} numberOfLines={1}>
                                    {item.reply_to.content}
                                </Text>
                            </View>
                        )}

                        {/* Content */}
                        {isSharedPost ? (
                            <SharedPostMessage post={sharedPostData} comment={sharedPostComment} isMyMessage={isMyMessage} />
                        ) : (
                            <>
                                <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                                    {highlightText ? renderHighlightedText(content, highlightText, styles, !!isFocusedMatch) : content}
                                </Text>
                                {detectedUrl && (
                                    <LinkPreview url={detectedUrl} isMyMessage={isMyMessage} theme={theme} />
                                )}
                            </>
                        )}

                        {/* Reactions */}
                        {item.reactions && item.reactions.length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                                {item.reactions.map((r, idx) => (
                                    <View key={idx} style={styles.reactionBadge}>
                                        <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Time and Read Status */}
                        <Animated.View
                            layout={LinearTransition.duration(200)}
                            style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 }}
                        >
                            <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.theirTimeText]}>
                                {parseLocalDate(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {isMyMessage && !isNewMessage && (
                                <Animated.Text
                                    entering={FadeIn.duration(300)}
                                    layout={LinearTransition.duration(200)}
                                    key={item.is_read ? 'read' : 'sent'}
                                    style={styles.readStatusText}
                                >
                                    {item.is_read ? ' · Okundu' : ' · Gönderildi'}
                                </Animated.Text>
                            )}
                        </Animated.View>
                    </Animated.View>
                </Pressable>
            </Swipeable>
        </View>
    );
});
