import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme as defaultTheme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { messageService, userService } from '../../services/backendApi';
import { ArrowLeft, Send } from 'lucide-react-native';
import { SharedPostMessage } from '../../components/SharedPostMessage';

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
}

export const ChatDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { otherUserId, username: initialUsername, avatarUrl: initialAvatarUrl, isRequest: initialIsRequest } = route.params as { otherUserId: number, username?: string, avatarUrl?: string, isRequest?: boolean };
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
            ...theme.shadows.default, // Subtler shadow
        },
        myMessage: {
            alignSelf: 'flex-end',
            backgroundColor: theme.colors.primary,
            borderBottomRightRadius: 4,
        },
        theirMessage: {
            alignSelf: 'flex-start',
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
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
    }), [theme, insets]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isRequest, setIsRequest] = useState(initialIsRequest || false);
    const [chatUser, setChatUser] = useState<{ username: string, avatar_url?: string } | null>(
        initialUsername ? { username: initialUsername, avatar_url: initialAvatarUrl } : null
    );
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

    const handleSend = async () => {
        if (!inputText.trim() || !user || sending) return;

        setSending(true);
        try {
            await messageService.send(otherUserId, inputText.trim());
            setInputText('');
            await fetchMessages();
            // Scroll to bottom (inverted list, so offset 0 is the bottom)
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
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

    const renderItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === user?.id;

        // Decode HTML entities (especially quotes) before parsing
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
            // If it fails to parse, we should probably display the original encoded content 
            // or the decoded one depending on how other messages are stored. 
            // Assuming other messages might be plain text, displaying decoded content is usually safer for readability.
        }

        return (
            <View style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessage : styles.theirMessage,
                isSharedPost ? { width: '80%', padding: 4 } : {} // Fixed width percentage for cards to ensure they look good
            ]}>
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

                <Text style={[
                    styles.timeText,
                    isMyMessage ? styles.myTimeText : styles.theirTimeText
                ]}>
                    {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    {chatUser?.avatar_url ? (
                        <Image source={{ uri: chatUser.avatar_url }} style={styles.headerAvatar} />
                    ) : (
                        <View style={styles.headerAvatarPlaceholder}>
                            <Text style={styles.headerAvatarText}>{chatUser?.username?.charAt(0).toUpperCase() || '?'}</Text>
                        </View>
                    )}
                    <Text style={styles.headerTitle}>{chatUser?.username || 'Yükleniyor...'}</Text>
                </View>
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
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
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
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Mesaj yaz..."
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
                )}
            </KeyboardAvoidingView>
        </View>
    );
};
