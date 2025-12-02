import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { messageService, userService } from '../../services/backendApi';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

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
    const { otherUserId, username: initialUsername, avatarUrl: initialAvatarUrl } = route.params as { otherUserId: number, username?: string, avatarUrl?: string };
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sending, setSending] = useState(false);
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
        // Polling for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [user, otherUserId]);

    const handleSend = async () => {
        if (!inputText.trim() || !user || sending) return;

        setSending(true);
        try {
            await messageService.send(user.id, otherUserId, inputText.trim());
            setInputText('');
            await fetchMessages();
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
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

    const renderItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === user?.id;
        return (
            <View style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessage : styles.theirMessage
            ]}>
                <Text style={[
                    styles.messageText,
                    isMyMessage ? styles.myMessageText : styles.theirMessageText
                ]}>{item.content}</Text>
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
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
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
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
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
                            <Icon name="paper-plane" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text,
        letterSpacing: -0.5,
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
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
        ...theme.shadows.soft,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.glass,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    theirMessageText: {
        color: theme.colors.text,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimeText: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimeText: {
        color: theme.colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        marginRight: 10,
        fontSize: 15,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.soft,
    },
    disabledButton: {
        backgroundColor: theme.colors.secondary,
        opacity: 0.5,
    },
});
