import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal, Pressable, Dimensions, Clipboard, Animated as RNAnimated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn, FadeInUp, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
// BlurView removed for Expo Go compatibility - using semi-transparent overlay instead
import { theme as defaultTheme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { messageService, userService } from '../../services/backendApi';
import { ArrowLeft, Send, Reply, Copy, Pencil, Undo2, CheckSquare, Plus, ChevronRight } from 'lucide-react-native';
import { SharedPostMessage } from '../../components/SharedPostMessage';
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
    reply_to?: {
        id: number;
        username: string;
        content: string;
    } | null;
}

export const ChatDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { otherUserId, username: initialUsername, avatarUrl: initialAvatarUrl, isRequest: initialIsRequest, unreadCount: initialUnreadCount } = route.params as { otherUserId: number, username?: string, avatarUrl?: string, isRequest?: boolean, unreadCount?: number };
    const { user } = useAuth();
    const { markAsRead } = useMessage();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: insets.top + 10,
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: theme.borderRadius.xl,
            borderBottomRightRadius: theme.borderRadius.xl,
            ...theme.shadows.soft,
        },
        backButton: {
            padding: 8,
            marginRight: 8,
            borderRadius: theme.borderRadius.pill,
            backgroundColor: theme.colors.background,
        },
        headerInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        headerAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 12,
        },
        headerAvatarPlaceholder: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        headerAvatarText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
            fontFamily: theme.fonts.headings,
        },
        headerTitle: {
            fontSize: 20,
            color: theme.colors.text,
            fontFamily: theme.fonts.headings, // Updated font
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        list: {
            padding: 16,
            paddingBottom: 32,
        },
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
            borderBottomRightRadius: 4,
            marginRight: 8,
        },
        theirMessage: {
            alignSelf: 'flex-start',
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginLeft: 8,
        },
        // iMessage style tail for sent messages
        myMessageTail: {
            position: 'absolute',
            bottom: 0,
            right: -6,
            width: 0,
            height: 0,
            borderLeftWidth: 8,
            borderLeftColor: theme.colors.primary,
            borderTopWidth: 8,
            borderTopColor: 'transparent',
            borderBottomWidth: 0,
            borderRightWidth: 0,
        },
        // iMessage style tail for received messages
        theirMessageTail: {
            position: 'absolute',
            bottom: 0,
            left: -6,
            width: 0,
            height: 0,
            borderRightWidth: 8,
            borderRightColor: theme.colors.surface,
            borderTopWidth: 8,
            borderTopColor: 'transparent',
            borderBottomWidth: 0,
            borderLeftWidth: 0,
        },
        messageText: {
            fontSize: 15,
            lineHeight: 22,
            fontFamily: theme.fonts.main,
        },
        myMessageText: {
            color: '#FFFFFF',
        },
        theirMessageText: {
            color: theme.colors.text,
        },
        timeText: {
            fontSize: 11,
            marginTop: 4,
            alignSelf: 'flex-end',
            fontFamily: theme.fonts.main,
        },
        myTimeText: {
            color: 'rgba(255,255,255,0.7)',
        },
        theirTimeText: {
            color: theme.colors.textSecondary,
        },
        // Read status indicator
        readStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginTop: 2,
        },
        readStatusText: {
            fontSize: 10,
            color: 'rgba(255,255,255,0.6)',
            marginLeft: 2,
        },
        inputContainer: {
            flexDirection: 'row',
            padding: 16,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'flex-end',
            paddingBottom: Math.max(insets.bottom, 16),
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.inputBackground, // Match Inbox search
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 12,
            maxHeight: 120,
            marginRight: 12,
            fontSize: 15,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.soft,
        },
        disabledButton: {
            backgroundColor: theme.colors.muted,
            opacity: 0.5,
        },
        // Request styles remain mostly same, just slight font updates
        requestContainer: {
            padding: 24,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'center',
            paddingBottom: Math.max(insets.bottom, 24),
        },
        requestText: {
            fontSize: 15,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 20,
            fontFamily: theme.fonts.main,
            lineHeight: 22,
        },
        requestButtons: {
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between',
            gap: 16,
        },
        requestButton: {
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        acceptButton: {
            backgroundColor: theme.colors.primary,
        },
        declineButton: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.error,
        },
        acceptButtonText: {
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: 15,
            fontFamily: theme.fonts.main,
        },
        declineButtonText: {
            color: theme.colors.error,
            fontWeight: '600',
            fontSize: 15,
            fontFamily: theme.fonts.main,
        },
        unreadDivider: {
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 16,
            paddingVertical: 4,
        },
        unreadDividerText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: theme.fonts.main,
            letterSpacing: 0.5,
        },
        // Date separator styles
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
            overflow: 'hidden',
        },
        // Typing indicator styles
        typingIndicator: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
        },
        typingBubble: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        typingDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.textSecondary,
            marginHorizontal: 2,
        },
        // Emoji reaction styles
        reactionContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 4,
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
        reactionEmoji: {
            fontSize: 14,
        },
        // Emoji picker modal styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        emojiPicker: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            ...theme.shadows.default,
        },
        emojiButton: {
            padding: 8,
            margin: 4,
        },
        emojiText: {
            fontSize: 28,
        },
    }), [theme, insets]);

    // iMessage style emoji options
    const EMOJI_OPTIONS = ['❤️', '👍', '👎', '😂', '‼️', '❓', '😍', '🔥'];
    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
    const [selectedMessageContent, setSelectedMessageContent] = useState<string>('');
    const [selectedMessageIsOwn, setSelectedMessageIsOwn] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<{ id: number; content: string; username: string } | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isRequest, setIsRequest] = useState(initialIsRequest || false);
    const [unreadCount] = useState(initialUnreadCount || 0);
    const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);
    const [chatUser, setChatUser] = useState<{ username: string, avatar_url?: string } | null>(
        initialUsername ? { username: initialUsername, avatar_url: initialAvatarUrl } : null
    );
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const fetchMessages = async () => {
        if (!user) return;
        try {
            const data = await messageService.getMessages(user.id, otherUserId);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        // Always fetch to ensure we have the latest info and handle missing params case
        try {
            const profile = await userService.getUserProfile(otherUserId);
            if (profile) {
                setChatUser({ username: profile.username, avatar_url: profile.avatar_url });
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            if (!chatUser) {
                setChatUser({ username: 'Kullanıcı', avatar_url: undefined });
            }
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchUserProfile();
        markAsRead(otherUserId);

        // Polling for new messages every 5 seconds
        const interval = setInterval(() => {
            fetchMessages();
            markAsRead(otherUserId);
        }, 5000);
        return () => clearInterval(interval);
    }, [user, otherUserId]);

    // Polling for typing indicator every 2 seconds
    useEffect(() => {
        const checkTyping = async () => {
            const result = await messageService.getTyping(otherUserId);
            setIsTyping(result?.is_typing || false);
        };

        const typingInterval = setInterval(checkTyping, 2000);
        return () => clearInterval(typingInterval);
    }, [otherUserId]);

    // Send typing indicator when user types
    const handleInputChange = (text: string) => {
        setInputText(text);

        // Send typing indicator
        if (text.trim()) {
            messageService.setTyping(otherUserId);
        }
    };

    // Handle long press on message to show context menu
    const handleLongPress = (messageId: number, content: string, isOwn: boolean) => {
        setSelectedMessageId(messageId);
        setSelectedMessageContent(content);
        setSelectedMessageIsOwn(isOwn);
        setShowContextMenu(true);
    };

    // Handle emoji selection
    const handleEmojiSelect = async (emoji: string) => {
        if (!selectedMessageId) return;

        try {
            await messageService.addReaction(selectedMessageId, emoji);
            await fetchMessages();
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }

        setShowContextMenu(false);
        setSelectedMessageId(null);
        setSelectedMessageContent('');
    };

    // Handle copy message
    const handleCopy = () => {
        Clipboard.setString(selectedMessageContent);
        Toast.show({
            type: 'success',
            text1: 'Kopyalandı',
            text2: 'Mesaj panoya kopyalandı.',
            visibilityTime: 2000,
        });
        setShowContextMenu(false);
        setSelectedMessageId(null);
    };

    // Close context menu
    const closeContextMenu = () => {
        setShowContextMenu(false);
        setSelectedMessageId(null);
        setSelectedMessageContent('');
    };

    // Handle unsend message
    const handleUnsend = async () => {
        if (!selectedMessageId) return;

        try {
            await messageService.unsendMessage(selectedMessageId);
            Toast.show({
                type: 'success',
                text1: 'Geri Alındı',
                text2: 'Mesaj başarıyla geri alındı.',
                visibilityTime: 2000,
            });
            await fetchMessages();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: error.message || 'Mesaj geri alınamadı. 15 dakikadan eski olabilir.',
            });
        }
        closeContextMenu();
    };

    // Handle edit message
    const handleEdit = () => {
        if (!selectedMessageId) return;

        setEditingMessageId(selectedMessageId);
        setInputText(selectedMessageContent);

        closeContextMenu();

        Toast.show({
            type: 'info',
            text1: 'Mesaj Düzenleniyor',
            text2: 'Mesajı düzenleyip göndere basarak güncelleyin.',
            visibilityTime: 2000,
        });
    };

    // Handle reply from swipe
    const handleReplyForSwipe = (id: number, content: string, username: string) => {
        setReplyToMessage({
            id: id,
            content: content,
            username: username
        });
    };

    // Handle reply message
    const handleReply = () => {
        if (!selectedMessageId) return;

        setReplyToMessage({
            id: selectedMessageId,
            content: selectedMessageContent,
            username: selectedMessageIsOwn ? 'Siz' : (chatUser?.username || 'Kullanıcı')
        });

        closeContextMenu();
    };

    // Scroll to unread messages on first load
    useEffect(() => {
        if (!isLoading && messages.length > 0 && unreadCount > 0 && !hasScrolledToUnread) {
            // In inverted FlatList, scroll to index = unreadCount (which is after the divider)
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: Math.min(unreadCount, messages.length - 1),
                    animated: true,
                    viewPosition: 0.5
                });
                setHasScrolledToUnread(true);
            }, 300);
        }
    }, [isLoading, messages.length, unreadCount, hasScrolledToUnread]);

    const [newMessageId, setNewMessageId] = useState<number | null>(null);

    const handleSend = async () => {
        if (!inputText.trim() || !user || sending) return;

        const messageContent = inputText.trim();
        const tempId = Date.now(); // Temporary ID for optimistic UI

        // Optimistic UI: Add message immediately with animation
        const optimisticMessage: Message = {
            id: tempId,
            sender_id: user.id,
            receiver_id: otherUserId,
            content: messageContent,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessageId(tempId);
        setInputText('');

        // Scroll to bottom immediately
        setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 50);

        setSending(true);
        try {
            if (editingMessageId) {
                await messageService.editMessage(editingMessageId, messageContent);
                setInputText('');
                setEditingMessageId(null);
                Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Mesaj başarıyla düzenlendi.' });
            } else if (replyToMessage) {
                await messageService.sendWithReply(otherUserId, messageContent, replyToMessage.id);
                setInputText('');
                setReplyToMessage(null);
            } else {
                await messageService.send(otherUserId, messageContent);
            }

            // Fetch real messages to get the actual ID
            await fetchMessages();
            setNewMessageId(null);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setNewMessageId(null);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Mesaj gönderilemedi.',
            });
        } finally {
            setSending(false);
        }
    };

    const handleAccept = async () => {
        if (!user) return;
        try {
            await messageService.acceptRequest(user.id, otherUserId);
            setIsRequest(false);
            Toast.show({
                type: 'success',
                text1: 'İstek Kabul Edildi',
                text2: 'Artık mesajlaşabilirsiniz.',
            });
        } catch (error) {
            console.error('Failed to accept request:', error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'İstek kabul edilemedi.',
            });
        }
    };

    const handleDecline = async () => {
        if (!user) return;
        try {
            await messageService.declineRequest(user.id, otherUserId);
            navigation.goBack();
            Toast.show({
                type: 'info',
                text1: 'İstek Reddedildi',
                text2: 'Konuşma silindi.',
            });
        } catch (error) {
            console.error('Failed to decline request:', error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'İstek reddedilemedi.',
            });
        }
    };

    const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

    const renderItem = useCallback(({ item, index }: { item: Message, index: number }) => {
        const isMyMessage = item.sender_id === user?.id;

        // Get neighbors from reversed list
        const prevMessage = reversedMessages[index + 1]; // Older message
        const nextMessage = reversedMessages[index - 1]; // Newer message

        const isSameSenderAsPrev = prevMessage?.sender_id === item.sender_id;
        const isSameSenderAsNext = nextMessage?.sender_id === item.sender_id;
        const isFirstInGroup = !isSameSenderAsPrev;
        const isLastInGroup = !isSameSenderAsNext;

        // Date separator logic
        // Fix date parsing for iOS/Android consistency (replace space with T)
        const parseDate = (dateStr: string) => new Date(dateStr.replace(' ', 'T'));

        const messageDate = parseDate(item.created_at);
        const prevMessageDate = prevMessage ? parseDate(prevMessage.created_at) : null;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isSameDay = (d1: Date, d2: Date) =>
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();

        const showDateSeparator = !prevMessage || (prevMessageDate && !isSameDay(messageDate, prevMessageDate));

        const getDateLabel = (date: Date) => {
            if (isSameDay(date, today)) return 'Bugün';
            if (isSameDay(date, yesterday)) return 'Dün';
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
        };

        // Decode HTML entities
        let content = item.content
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'");

        let isSharedPost = false;
        let sharedPostData = null;
        let sharedPostComment = '';

        try {
            if (content.trim().startsWith('{')) {
                const parsed = JSON.parse(content);
                if (parsed.type === 'post_share' && parsed.post) {
                    isSharedPost = true;
                    sharedPostData = parsed.post;
                    sharedPostComment = parsed.comment || '';
                }
            }
        } catch (e) {
            // Not a JSON or parse error, treat as text
        }

        // Inverted list: index 0 = newest (bottom), so unread starts at index (unreadCount - 1)
        // Show divider AFTER the first unread message (which is at index unreadCount - 1 in inverted list)
        const showUnreadDivider = unreadCount > 0 && index === unreadCount - 1;

        // Check if this is the newly sent message for animation
        const isNewMessage = item.id === newMessageId;

        const BubbleWrapper = isNewMessage ? Animated.View : View;
        const animationProps = isNewMessage ? {
            entering: ZoomIn.duration(400)
                .springify()
                .damping(14)
                .stiffness(100)
                .withInitialValues({
                    opacity: 0.5,
                    transform: [
                        { scale: 0.8 },
                        { translateY: 80 }  // Starts from below (textbox area)
                    ]
                }),
        } : {};

        // Grouped message styles
        const groupedStyle = {
            marginBottom: isLastInGroup ? 12 : 4, // Less spacing within groups
            // Adjust border radius for grouped messages
            ...(isMyMessage ? {
                borderTopRightRadius: isFirstInGroup ? 20 : 12,
                borderBottomRightRadius: isLastInGroup ? 4 : 12,
            } : {
                borderTopLeftRadius: isFirstInGroup ? 20 : 12,
                borderBottomLeftRadius: isLastInGroup ? 4 : 12,
            }),
            maxWidth: '100%' // Ensure bubble doesn't overflow container width constraints
        };

        return (
            <>
                {/* Date separator - show when day changes */}
                <Swipeable
                    renderLeftActions={(progress, dragX) => {
                        const trans = dragX.interpolate({
                            inputRange: [0, 50, 100],
                            outputRange: [-20, 0, 0],
                        });
                        const opacity = dragX.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 1],
                        });

                        return (
                            <RectButton style={{ justifyContent: 'center', alignItems: 'center', width: 50 }}>
                                <RNAnimated.View style={{ transform: [{ translateX: trans }], opacity }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: theme.colors.surface,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        ...theme.shadows.soft
                                    }}>
                                        <Reply size={16} color={theme.colors.primary} />
                                    </View>
                                </RNAnimated.View>
                            </RectButton>
                        );
                    }}
                    onSwipeableLeftOpen={() => {
                        // Immediately close swipeable to reset
                        (item as any).swipeable?.close();
                        // Trigger reply
                        // Need to wrap in timeout to avoid state update conflicts during gesture
                        setTimeout(() => {
                            // Re-using the logic from handleLongPress setup but just for reply
                            setSelectedMessageId(item.id);
                            setSelectedMessageContent(item.content);
                            setSelectedMessageIsOwn(isMyMessage);
                            // Directly trigger reply without context menu
                            handleReplyForSwipe(item.id, item.content, isMyMessage ? 'Siz' : (chatUser?.username || 'Kullanıcı'));
                        }, 100);
                    }}
                    ref={(ref) => { (item as any).swipeable = ref; }}
                >
                    <Pressable onLongPress={() => handleLongPress(item.id, item.content, isMyMessage)}>
                        <BubbleWrapper
                            style={[
                                styles.messageBubble,
                                isMyMessage ? styles.myMessage : styles.theirMessage,
                                groupedStyle as any,
                                isSharedPost ? { width: '80%', padding: 4 } : {}
                            ]}
                            {...animationProps}
                        >
                            {/* iMessage style tail - only show on last message in group */}
                            {isLastInGroup && (
                                <View style={isMyMessage ? styles.myMessageTail : styles.theirMessageTail} />
                            )}

                            {/* Reply Context */}
                            {item.reply_to && (
                                <View style={{
                                    backgroundColor: isMyMessage ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)',
                                    padding: 8,
                                    borderRadius: 8,
                                    marginBottom: 6,
                                    borderLeftWidth: 3,
                                    borderLeftColor: isMyMessage ? 'rgba(255,255,255,0.5)' : theme.colors.primary,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                        <Reply size={12} color={isMyMessage ? 'rgba(255,255,255,0.9)' : theme.colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: 'bold',
                                            color: isMyMessage ? 'rgba(255,255,255,0.9)' : theme.colors.primary,
                                            fontFamily: theme.fonts.main
                                        }}>
                                            {item.reply_to.username}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 13,
                                        color: isMyMessage ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary,
                                        fontFamily: theme.fonts.main
                                    }} numberOfLines={1}>
                                        {item.reply_to.content}
                                    </Text>
                                </View>
                            )}

                            {isSharedPost ? (
                                <SharedPostMessage
                                    post={sharedPostData}
                                    comment={sharedPostComment}
                                    isMyMessage={isMyMessage}
                                />
                            ) : (
                                <Text style={[
                                    styles.messageText,
                                    isMyMessage ? styles.myMessageText : styles.theirMessageText
                                ]}>{item.content}</Text>
                            )}

                            {/* Emoji reactions */}
                            {item.reactions && item.reactions.length > 0 && (
                                <View style={styles.reactionContainer}>
                                    {item.reactions.map((reaction, idx) => (
                                        <View key={idx} style={styles.reactionBadge}>
                                            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Only show time and read status on last message in group */}
                            {isLastInGroup && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 }}>
                                    <Text style={[
                                        styles.timeText,
                                        isMyMessage ? styles.myTimeText : styles.theirTimeText,
                                        { marginTop: 0 }
                                    ]}>
                                        {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    {/* Read status for sent messages - iMessage style */}
                                    {isMyMessage && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.readStatusText}>
                                                {item.is_read ? ' · Okundu' : ' · Gönderildi'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </BubbleWrapper>
                    </Pressable>
                </Swipeable>

                {/* Status indicators for replies (Context Menu logic place is not here, it's global) */}
                {/* Unread Divider */}
                {showUnreadDivider && (
                    <View style={styles.unreadDivider}>
                        <LinearGradient
                            colors={theme.dark ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'] : ['rgba(0,0,0,0)', 'rgba(210, 180, 140, 0.4)', 'rgba(0,0,0,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                width: '100%',
                                alignItems: 'center',
                                paddingVertical: 6,
                            }}
                        >
                            <Text style={[styles.unreadDividerText, { color: theme.colors.primary }]}>Okunmamış Mesajlar</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Date separator - show when day changes (Render last to appear at Top in Inverted list) */}
                {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateSeparatorText}>{getDateLabel(messageDate)}</Text>
                    </View>
                )}
            </>
        );
    }, [messages, reversedMessages, user, newMessageId, unreadCount]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerInfo}
                    onPress={() => {
                        // Navigate to user profile
                        (navigation as any).navigate('OtherProfile', { userId: otherUserId });
                    }}
                >
                    {chatUser?.avatar_url ? (
                        <Image source={{ uri: chatUser.avatar_url }} style={styles.headerAvatar} />
                    ) : (
                        <View style={styles.headerAvatarPlaceholder}>
                            <Text style={styles.headerAvatarText}>{chatUser?.username?.charAt(0).toUpperCase() || '?'}</Text>
                        </View>
                    )}
                    <Text style={styles.headerTitle}>{chatUser?.username || 'Yükleniyor...'}</Text>
                    <ChevronRight size={20} color={theme.colors.textSecondary} style={{ marginTop: 3 }} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={[...messages].reverse()} // Reverse data for inverted list so newest is at bottom
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    inverted={true} // Start from bottom
                    keyboardShouldPersistTaps="handled"
                    onScrollToIndexFailed={(info) => {
                        // Fallback: scroll to offset if scrollToIndex fails
                        setTimeout(() => {
                            flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
                        }, 100);
                    }}
                />
            )}

            {isRequest ? (
                <View style={styles.requestContainer}>
                    <Text style={styles.requestText}>
                        {chatUser?.username} seni takip etmiyor. Mesaj isteğini kabul etmek istiyor musun?
                    </Text>
                    <View style={styles.requestButtons}>
                        <TouchableOpacity style={[styles.requestButton, styles.declineButton]} onPress={handleDecline}>
                            <Text style={styles.declineButtonText}>Reddet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.requestButton, styles.acceptButton]} onPress={handleAccept}>
                            <Text style={styles.acceptButtonText}>Kabul Et</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    {/* Typing indicator */}
                    {isTyping && (
                        <View style={styles.typingIndicator}>
                            <View style={styles.typingBubble}>
                                <View style={[styles.typingDot, { opacity: 0.4 }]} />
                                <View style={[styles.typingDot, { opacity: 0.7 }]} />
                                <View style={[styles.typingDot, { opacity: 1 }]} />
                            </View>
                        </View>
                    )}

                    {/* Reply/Edit Indicator */}
                    {(replyToMessage || editingMessageId) && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            backgroundColor: theme.colors.surface,
                            borderTopWidth: 1,
                            borderTopColor: theme.colors.border,
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 2 }}>
                                    {editingMessageId ? 'Mesaj Düzenleniyor' : `Yanıtlanan: ${replyToMessage?.username}`}
                                </Text>
                                <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                                    {editingMessageId ? 'Düzenlemek için metni girin...' : replyToMessage?.content}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => {
                                setReplyToMessage(null);
                                setEditingMessageId(null);
                                setInputText('');
                            }}>
                                <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: 'bold' }}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={handleInputChange}
                            placeholder="Mesaj..."
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Send size={20} color={!inputText.trim() ? theme.colors.text : "#fff"} />
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* iMessage Style Context Menu */}
            <Modal
                visible={showContextMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={closeContextMenu}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(128,128,128,0.6)',
                        justifyContent: 'center', // Center content vertically
                        alignItems: 'center',
                    }}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={closeContextMenu}
                    >
                        {/* Message Preview */}
                        <Animated.View
                            entering={ZoomIn.duration(200)}
                            exiting={FadeOut.duration(150)}
                            style={{
                                maxWidth: '85%',
                                padding: 14,
                                borderRadius: 16,
                                marginBottom: 20,
                                backgroundColor: selectedMessageIsOwn ? theme.colors.primary : theme.colors.surface,
                                ...theme.shadows.default,
                            }}
                        >
                            <Text style={[
                                styles.messageText,
                                selectedMessageIsOwn ? styles.myMessageText : styles.theirMessageText
                            ]} numberOfLines={3}>
                                {selectedMessageContent}
                            </Text>
                        </Animated.View>

                        {/* Emoji Reaction Bar */}
                        <Animated.View
                            entering={ZoomIn.delay(50).duration(250).springify()}
                            exiting={FadeOut.duration(150)}
                            style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 24,
                                paddingHorizontal: 12,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                flexWrap: 'wrap', // Responsive wrapping
                                justifyContent: 'center',
                                width: '90%', // Limit width
                                maxWidth: 360,
                                marginBottom: 12,
                                ...theme.shadows.default,
                            }}
                        >
                            {EMOJI_OPTIONS.map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        padding: 8,
                                        margin: 2,
                                    }}
                                    onPress={() => handleEmojiSelect(emoji)}
                                >
                                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </Animated.View>

                        {/* Context Menu Actions */}
                        <Animated.View
                            entering={ZoomIn.delay(100).duration(250).springify()}
                            exiting={FadeOut.duration(150)}
                            style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 16,
                                overflow: 'hidden',
                                width: '70%', // Consistent width
                                maxWidth: 280,
                                ...theme.shadows.default,
                            }}
                        >
                            {/* Yanıtla */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                    borderBottomColor: theme.colors.border,
                                }}
                                onPress={handleReply}
                            >
                                <Reply size={20} color={theme.colors.text} />
                                <Text style={{ marginLeft: 12, fontSize: 16, color: theme.colors.text, fontFamily: theme.fonts.main }}>Yanıtla</Text>
                            </TouchableOpacity>

                            {/* Düzenle - sadece kendi mesajları için */}
                            {selectedMessageIsOwn && (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                        borderBottomColor: theme.colors.border,
                                    }}
                                    onPress={handleEdit}
                                >
                                    <Pencil size={20} color={theme.colors.text} />
                                    <Text style={{ marginLeft: 12, fontSize: 16, color: theme.colors.text, fontFamily: theme.fonts.main }}>Düzenle</Text>
                                </TouchableOpacity>
                            )}

                            {/* Gönderiyi Geri Al - sadece kendi mesajları için */}
                            {selectedMessageIsOwn && (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                        borderBottomColor: theme.colors.border,
                                    }}
                                    onPress={handleUnsend}
                                >
                                    <Undo2 size={20} color={theme.colors.text} />
                                    <Text style={{ marginLeft: 12, fontSize: 16, color: theme.colors.text, fontFamily: theme.fonts.main }}>Gönderiyi Geri Al</Text>
                                </TouchableOpacity>
                            )}

                            {/* Kopyala */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                    borderBottomColor: theme.colors.border,
                                }}
                                onPress={handleCopy}
                            >
                                <Copy size={20} color={theme.colors.text} />
                                <Text style={{ marginLeft: 12, fontSize: 16, color: theme.colors.text, fontFamily: theme.fonts.main }}>Kopyala</Text>
                            </TouchableOpacity>

                            {/* Seç */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                }}
                                onPress={() => {
                                    closeContextMenu();
                                    Toast.show({ type: 'info', text1: 'Seç', text2: 'Bu özellik yakında eklenecek.' });
                                }}
                            >
                                <CheckSquare size={20} color={theme.colors.text} />
                                <Text style={{ marginLeft: 12, fontSize: 16, color: theme.colors.text, fontFamily: theme.fonts.main }}>Seç</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Pressable>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};
