import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { messageService, userService } from '../../services/backendApi';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import { Image } from 'react-native';

export const ChatScreen = () => {
    const route = useRoute<any>();
    const { otherUserId, otherUserName, avatarUrl } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [chatUser, setChatUser] = useState<{ username: string, avatar_url?: string }>({
        username: otherUserName || 'Kullanıcı',
        avatar_url: avatarUrl
    });
    const { user } = useAuth();
    const navigation = useNavigation();
    const { markAsRead } = useMessage();
    const flatListRef = useRef<FlatList>(null);

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
            setMessages(data);
            setIsLoading(false);
            markAsRead(otherUserId); // Mark as read when fetching
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        navigation.setOptions({ headerShown: false }); // Hide default header
        fetchMessages();
        fetchUserProfile();

        // Polling for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [otherUserId, user]);

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        const content = inputText.trim();
        setInputText('');

        try {
            // Optimistic update
            const newMessage = {
                id: Date.now(),
                sender_id: user.id,
                receiver_id: otherUserId,
                content: content,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, newMessage]);

            await messageService.send(user.id, otherUserId, content);
            fetchMessages(); // Sync with server
        } catch (error) {
            console.error(error);
            // TODO: Handle error (remove optimistic message)
        }
    };

    const renderItem = ({ item }: { item: any }) => {
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
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
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
                    <Icon name="arrow-left" size={20} color={theme.colors.text} />
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

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Mesaj yazın..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Icon name="paper-plane" size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
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
        borderBottomColor: theme.colors.glassBorder,
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
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
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
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glassBorder,
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
});
