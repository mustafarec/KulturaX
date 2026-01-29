import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { messageService, userService } from '../../services/backendApi';
import { ArrowLeft, Send, AlertCircle, RotateCcw } from 'lucide-react-native';
import { Image } from 'react-native';

// Message type with status
interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    status?: 'sending' | 'sent' | 'failed';
    tempId?: number; // For tracking optimistic messages
}

export const ChatScreen = () => {
    const route = useRoute<any>();
    const { otherUserId, otherUserName, avatarUrl } = route.params;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [chatUser, setChatUser] = useState<{ username: string, avatar_url?: string }>({
        username: otherUserName || 'Kullanıcı',
        avatar_url: avatarUrl
    });
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const { markAsRead } = useMessage();
    const { sendMessage: sendSocketMessage, sendTyping, onNewMessage, onTyping, onMessageSent, isConnected } = useWebSocket();
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // WebSocket Listeners
    useEffect(() => {
        if (!user || !otherUserId) return;

        // Listen for new messages
        const unsubscribeMessages = onNewMessage((message: any) => {
            console.log('[ChatScreen] WS Message Received:', message); // DEBUG LOG
            // Only handle messages for this chat
            if (message.sender_id === otherUserId || (message.receiver_id === otherUserId && message.sender_id === user.id)) {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, { ...message, status: 'sent' }];
                });

                // Mark as read immediately if looking at screen
                // sendReadReceipt(user.id, [message.id]); 
            }
        });

        // Listen for typing status
        const unsubscribeTyping = onTyping((data) => {
            if (data.userId === otherUserId) {
                setIsOtherUserTyping(data.isTyping);
            }
        });

        const unsubscribeSent = onMessageSent((data) => {
            console.log('[ChatScreen] Message Sent Ack:', data);
        });

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
            unsubscribeSent();
        };
    }, [user, otherUserId, onNewMessage, onTyping, onMessageSent]);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: Platform.OS === 'ios' ? 50 : 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.background,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        backButton: {
            padding: 8,
            marginLeft: -8,
        },
        headerTitleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 8,
        },
        avatarPlaceholder: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
        },
        avatarText: {
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 14,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text,
        },
        list: {
            padding: theme.spacing.m,
            paddingBottom: 20,
        },
        messageContainer: {
            marginBottom: 8,
        },
        messageBubble: {
            maxWidth: '80%',
            padding: 12,
            borderRadius: 20,
        },
        myMessage: {
            alignSelf: 'flex-end',
            backgroundColor: theme.colors.primary,
            borderBottomRightRadius: 4,
        },
        myMessageFailed: {
            alignSelf: 'flex-end',
            backgroundColor: theme.colors.error,
            borderBottomRightRadius: 4,
            opacity: 0.8,
        },
        myMessageSending: {
            alignSelf: 'flex-end',
            backgroundColor: theme.colors.primary,
            borderBottomRightRadius: 4,
            opacity: 0.6,
        },
        theirMessage: {
            alignSelf: 'flex-start',
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: 4,
        },
        messageText: {
            fontSize: 16,
            marginBottom: 4,
        },
        myMessageText: {
            color: '#ffffff',
        },
        theirMessageText: {
            color: theme.colors.text,
        },
        timeText: {
            fontSize: 10,
            alignSelf: 'flex-end',
        },
        myTimeText: {
            color: 'rgba(255, 255, 255, 0.7)',
        },
        theirTimeText: {
            color: theme.colors.textSecondary,
        },
        // Failed message styles
        failedContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginTop: 4,
            gap: 4,
        },
        failedText: {
            color: theme.colors.error,
            fontSize: 12,
        },
        retryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 12,
            backgroundColor: theme.colors.error + '20',
            gap: 4,
        },
        retryText: {
            color: theme.colors.error,
            fontSize: 12,
            fontWeight: '600',
        },
        sendingIndicator: {
            alignSelf: 'flex-end',
            marginTop: 4,
        },
        sendingText: {
            color: theme.colors.textSecondary,
            fontSize: 10,
            fontStyle: 'italic',
        },
        inputContainer: {
            flexDirection: 'row',
            padding: 12,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'center',
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.background,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
            maxHeight: 100,
            color: theme.colors.text,
            marginRight: 12,
            fontSize: 16,
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
        },
        sendButtonDisabled: {
            backgroundColor: theme.colors.textSecondary,
            opacity: 0.5,
        },
    }), [theme]);

    const fetchUserProfile = async () => {
        try {
            const profile = await userService.getUserProfile(otherUserId);
            if (profile) {
                setChatUser({ username: profile.username, avatar_url: profile.avatar_url });
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const fetchMessages = async () => {
        if (!user) return;
        try {
            const data = await messageService.getMessages(user.id, otherUserId);
            // Merge with local failed messages
            setMessages(prev => {
                const failedMessages = prev.filter(m => m.status === 'failed');
                const serverMessageIds = new Set(data.map((m: ChatMessage) => m.id));
                // Keep failed messages that haven't been sent yet
                const remainingFailed = failedMessages.filter(m => !serverMessageIds.has(m.id));
                return [...data.map((m: ChatMessage) => ({ ...m, status: 'sent' as const })), ...remainingFailed];
            });
            setIsLoading(false);
            markAsRead(otherUserId);
        } catch (error) {
            console.error(error);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        fetchMessages();
        fetchUserProfile();

        // Polling removed as per user request to rely on WebSocket
    }, [otherUserId, user]);

    const sendMessage = async (content: string, tempId: number) => {
        try {
            await messageService.send(otherUserId, content);
            // Mark as sent
            setMessages(prev => prev.map(m =>
                m.tempId === tempId ? { ...m, status: 'sent' as const } : m
            ));
            // fetchMessages(); // Sync with server - Removed to rely on WS (or local update)
        } catch (error) {
            console.error('Message send failed:', error);
            // Mark as failed
            setMessages(prev => prev.map(m =>
                m.tempId === tempId ? { ...m, status: 'failed' as const } : m
            ));
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        const content = inputText.trim();
        const tempId = Date.now();
        setInputText('');

        // Optimistic update with 'sending' status
        const newMessage: ChatMessage = {
            id: tempId,
            tempId: tempId,
            sender_id: user.id,
            receiver_id: otherUserId,
            content: content,
            created_at: new Date().toISOString(),
            status: 'sending',
        };
        setMessages(prev => [...prev, newMessage]);

        // Send the message via API (Persistence)
        sendMessage(content, tempId);

        // Send via WebSocket (Real-time)
        console.log('[ChatScreen] Auto-Send Check:', { isConnected, otherUserId }); // DEBUG LOG
        if (isConnected) {
            console.log('[ChatScreen] Sending WS Message to:', otherUserId); // DEBUG LOG
            sendSocketMessage(otherUserId, content, tempId);
        } else {
            console.log('[ChatScreen] WS NOT CONNECTED - Skipping JS send'); // DEBUG LOG
        }
    };

    const handleRetry = (message: ChatMessage) => {
        if (!user) return;

        // Update status back to sending
        setMessages(prev => prev.map(m =>
            m.tempId === message.tempId ? { ...m, status: 'sending' as const } : m
        ));

        // Retry sending
        sendMessage(message.content, message.tempId!);
    };

    const handleInputChange = (text: string) => {
        setInputText(text);

        if (isConnected) {
            sendTyping(otherUserId, true);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(otherUserId, false);
            }, 2000);
        }
    };

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isMyMessage = item.sender_id === user?.id;
        const isFailed = item.status === 'failed';
        const isSending = item.status === 'sending';

        const getBubbleStyle = () => {
            if (!isMyMessage) return styles.theirMessage;
            if (isFailed) return styles.myMessageFailed;
            if (isSending) return styles.myMessageSending;
            return styles.myMessage;
        };

        return (
            <View style={[styles.messageContainer, { alignItems: isMyMessage ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.messageBubble, getBubbleStyle()]}>
                    <Text style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.theirMessageText
                    ]}>{item.content}</Text>
                    <Text style={[
                        styles.timeText,
                        isMyMessage ? styles.myTimeText : styles.theirTimeText
                    ]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* Sending indicator */}
                {isSending && (
                    <View style={styles.sendingIndicator}>
                        <Text style={styles.sendingText}>Gönderiliyor...</Text>
                    </View>
                )}

                {/* Failed message - Retry button */}
                {isFailed && (
                    <View style={styles.failedContainer}>
                        <AlertCircle size={14} color={theme.colors.error} />
                        <Text style={styles.failedText}>Gönderilemedi</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => handleRetry(item)}
                        >
                            <RotateCcw size={12} color={theme.colors.error} />
                            <Text style={styles.retryText}>Yeniden dene</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    {chatUser.avatar_url ? (
                        <Image source={{ uri: chatUser.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{chatUser.username.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.headerTitle}>{chatUser.username}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* DEBUG: Visual WS Status - Explicit Banner in Body */}
            <View style={{
                paddingVertical: 4,
                backgroundColor: isConnected ? '#4CAF50' : '#F44336',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
            }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {isConnected ? 'WEBSOCKET: BAĞLI (ON)' : 'WEBSOCKET: BAĞLI DEĞİL (OFF)'}
                </Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => (item.tempId || item.id).toString()}
                    contentContainerStyle={styles.list}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {isOtherUserTyping && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                        {otherUserName} yazıyor...
                    </Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={handleInputChange}
                    placeholder="Mesaj yazın..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Send size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};
