import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform, StatusBar, Alert, Dimensions, Animated as RNAnimated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/backendApi';
import { ThemedDialog } from '../../components/ThemedDialog';

interface Conversation {
    chat_partner_id: number;
    username: string;
    avatar_url: string | null;
    last_message: string;
    last_message_time: string;
    last_message_sender_id: number;
    unread_count?: number | string;
    is_typing?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MessageScreen = () => {
    const [inboxConversations, setInboxConversations] = useState<Conversation[]>([]);
    const [requestsConversations, setRequestsConversations] = useState<Conversation[]>([]);

    const [isLoadingInbox, setIsLoadingInbox] = useState(true);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<{ partnerId: number, type: 'inbox' | 'requests' } | null>(null);

    const [refreshing, setRefreshing] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

    const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');
    const translateX = useSharedValue(0);

    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // Animasyon stili
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    // Tab değiştiğinde animasyonu tetikle
    useEffect(() => {
        const config = { damping: 30, stiffness: 250, mass: 1 };
        if (activeTab === 'inbox') {
            translateX.value = withSpring(0, config);
        } else {
            translateX.value = withSpring(-SCREEN_WIDTH, config);
        }
    }, [activeTab]);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            paddingBottom: 0,
            zIndex: 10,
        },
        headerContent: {
            padding: 20,
            paddingBottom: 10,
        },
        headerTitle: {
            fontSize: 23,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 16,
        },
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: 4,
            width: '100%',
        },
        tab: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
            borderRadius: 10,
        },
        activeTab: {
            backgroundColor: theme.colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeTabText: {
            color: theme.colors.text,
        },
        tabBadge: {
            position: 'absolute',
            top: 4,
            right: 12,
            backgroundColor: theme.colors.error,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            borderWidth: 1.5,
            borderColor: theme.colors.background,
        },
        tabBadgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
        },
        contentContainer: {
            flex: 1,
            flexDirection: 'row',
            width: SCREEN_WIDTH * 2, // 2 ekran genişliği
        },
        page: {
            width: SCREEN_WIDTH,
            height: '100%',
        },
        list: {
            paddingTop: 10,
            paddingBottom: 20,
        },
        item: {
            flexDirection: 'row',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        swipeableWrapper: {
            marginHorizontal: 16,
            marginBottom: 12,
            overflow: 'hidden',
            borderRadius: 16,
        },
        itemUnread: {
            backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(139, 90, 43, 0.08)',
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.primary,
        },
        avatarContainer: {
            marginRight: 16,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        placeholderAvatar: {
            backgroundColor: theme.colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholderText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        itemContent: {
            flex: 1,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
        },
        username: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        usernameUnread: {
            fontWeight: '800',
        },
        time: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        timeUnread: {
            color: theme.colors.primary,
            fontWeight: '600',
        },
        message: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        messageUnread: {
            color: theme.colors.text,
            fontWeight: '600',
        },
        unreadBadge: {
            backgroundColor: theme.colors.error,
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
            marginLeft: 8,
        },
        unreadBadgeText: {
            color: '#fff',
            fontSize: 11,
            fontWeight: 'bold',
        },
        unreadDot: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            backgroundColor: theme.colors.error,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: theme.colors.surface,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
            paddingHorizontal: 40,
        },
        emptyIcon: {
            fontSize: 64,
            marginBottom: 16,
            opacity: 0.5,
            color: theme.colors.textSecondary,
        },
        emptyTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 15,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
        deleteAction: {
            backgroundColor: theme.colors.error,
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            height: 56,
            borderRadius: 12,
            marginLeft: 8,
        },
        deleteActionContainer: {
            width: 80,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            marginBottom: 12,
        },
        deleteActionText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 13,
        },
        typingText: {
            fontSize: 14,
            color: '#22c55e', // Yeşil renk
            fontWeight: '600',
            fontStyle: 'italic',
        },
    }), [theme]);

    const fetchInbox = async () => {
        if (!user) return;
        try {
            const data = await messageService.getInbox('inbox');
            setInboxConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch inbox:', error);
        } finally {
            setIsLoadingInbox(false);
        }
    };

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const data = await messageService.getInbox('requests');
            setRequestsConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setIsLoadingRequests(false);
        }
    }

    const fetchAll = async () => {
        setRefreshing(true);
        await Promise.all([fetchInbox(), fetchRequests()]);
        setRefreshing(false);
    }

    useEffect(() => {
        if (user) {
            fetchInbox();
            fetchRequests();
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Her odaklanmada veriyi taze tut, ama loading gösterme
            if (user) {
                messageService.getInbox('inbox').then(data => setInboxConversations(Array.isArray(data) ? data : []));
                messageService.getInbox('requests').then(data => setRequestsConversations(Array.isArray(data) ? data : []));
            }
        });
        return unsubscribe;
    }, [navigation, user]);

    // Periodic refresh every 5 seconds and typing status check
    useEffect(() => {
        if (!user) return;

        const refreshInterval = setInterval(() => {
            // Refresh inbox silently
            messageService.getInbox('inbox').then(data => setInboxConversations(Array.isArray(data) ? data : []));
        }, 5000);

        // Check typing status every 2 seconds
        const typingInterval = setInterval(async () => {
            const newTypingStatus: Record<number, boolean> = {};
            for (const conv of inboxConversations.slice(0, 5)) { // Only check first 5 to limit API calls
                try {
                    const result = await messageService.getTyping(conv.chat_partner_id);
                    if (result?.is_typing) {
                        newTypingStatus[conv.chat_partner_id] = true;
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
            setTypingUsers(newTypingStatus);
        }, 2000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(typingInterval);
        };
    }, [user, inboxConversations.length]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 86400000 && now.getDate() === date.getDate()) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const handleDelete = (partnerId: number, type: 'inbox' | 'requests') => {
        setConversationToDelete({ partnerId, type });
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        if (!conversationToDelete) return;

        const { partnerId, type } = conversationToDelete;
        setDeleteDialogVisible(false); // Close immediately for optimistic UI

        if (type === 'inbox') {
            const prev = [...inboxConversations];
            setInboxConversations(p => p.filter(c => c.chat_partner_id !== partnerId));
            try {
                if (user) await messageService.deleteConversation(user.id, partnerId);
            } catch (error) {
                console.error('Failed to delete conversation:', error);
                setInboxConversations(prev);
            }
        } else {
            const prev = [...requestsConversations];
            setRequestsConversations(p => p.filter(c => c.chat_partner_id !== partnerId));
            try {
                if (user) await messageService.deleteConversation(user.id, partnerId);
            } catch (error) {
                console.error('Failed to delete conversation:', error);
                setRequestsConversations(prev);
            }
        }
        setConversationToDelete(null);
    };

    const renderRightActions = (progress: any, dragX: any, partnerId: number, type: 'inbox' | 'requests') => {
        const translateX = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
        });

        const opacity = dragX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
        });

        return (
            <RNAnimated.View style={[styles.deleteActionContainer, { transform: [{ translateX }], opacity }]}>
                <TouchableOpacity
                    style={styles.deleteAction}
                    onPress={() => handleDelete(partnerId, type)}
                >
                    <Text style={styles.deleteActionText}>Sil</Text>
                </TouchableOpacity>
            </RNAnimated.View>
        );
    };

    const formatLastMessage = (message: string) => {
        const decoded = message
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'");

        try {
            if (decoded.trim().startsWith('{')) {
                const parsed = JSON.parse(decoded);
                if (parsed.type === 'post_share') {
                    const postUser = parsed.post.user || parsed.post.author || {};
                    const authorName = postUser.username || postUser.name || 'bir';
                    return parsed.comment ? `📷 ${parsed.comment}` : `📷 ${authorName} adlı kullanıcının gönderisini iletti`;
                }
            }
        } catch (e) {
            // Not a JSON
        }
        return decoded;
    };

    const renderItem = ({ item, type }: { item: Conversation, type: 'inbox' | 'requests' }) => {
        const unreadNum = parseInt(String(item.unread_count)) || 0;
        const hasUnread = unreadNum > 0;

        return (
            <View style={styles.swipeableWrapper}>
                <Swipeable
                    renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.chat_partner_id, type)}
                    overshootRight={false}
                    friction={2}
                    rightThreshold={40}
                >
                    <TouchableOpacity
                        style={[styles.item, hasUnread && styles.itemUnread]}
                        activeOpacity={0.7}
                        delayPressIn={100}
                        onPress={() => (navigation as any).navigate('ChatDetail', {
                            otherUserId: item.chat_partner_id,
                            username: item.username,
                            avatarUrl: item.avatar_url,
                            isRequest: type === 'requests',
                            unreadCount: unreadNum
                        })}
                    >
                        <View style={styles.avatarContainer}>
                            {item.avatar_url ? (
                                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar]}>
                                    <Text style={styles.placeholderText}>{item.username.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            {hasUnread && <View style={styles.unreadDot} />}
                        </View>
                        <View style={styles.itemContent}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.username, hasUnread && styles.usernameUnread]}>{item.username}</Text>
                                <Text style={[styles.time, hasUnread && styles.timeUnread]}>{formatTime(item.last_message_time)}</Text>
                            </View>
                            {typingUsers[item.chat_partner_id] ? (
                                <Text style={styles.typingText}>yazıyor...</Text>
                            ) : (
                                <Text style={[styles.message, hasUnread && styles.messageUnread]} numberOfLines={1}>
                                    {item.last_message_sender_id === user?.id ? 'Siz: ' : ''}{formatLastMessage(item.last_message)}
                                </Text>
                            )}
                        </View>
                        {hasUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>{unreadNum}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Swipeable>
            </View>
        );
    };

    const renderEmptyState = (type: 'inbox' | 'requests', loading: boolean) => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )
        }
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>{type === 'inbox' ? 'Mesaj Yok' : 'İstek Yok'}</Text>
                <Text style={styles.emptyText}>
                    {type === 'inbox'
                        ? 'Henüz kimseyle mesajlaşmadınız.'
                        : 'Bekleyen mesaj isteğiniz yok.'}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'inbox' && styles.activeTab]}
                            onPress={() => setActiveTab('inbox')}
                        >
                            <Text style={[styles.tabText, activeTab === 'inbox' && styles.activeTabText]}>Gelen Kutusu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                            onPress={() => setActiveTab('requests')}
                        >
                            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>İstekler</Text>
                            {requestsConversations.length > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>
                                        {requestsConversations.length > 99 ? '99+' : requestsConversations.length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Animated.View style={[styles.contentContainer, animatedStyle]}>
                {/* Inbox Page */}
                <View style={styles.page}>
                    <FlatList
                        data={inboxConversations}
                        renderItem={(props) => renderItem({ ...props, type: 'inbox' })}
                        keyExtractor={(item) => item.chat_partner_id.toString()}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={fetchAll} colors={[theme.colors.primary]} />
                        }
                        ListEmptyComponent={() => renderEmptyState('inbox', isLoadingInbox)}
                    />
                </View>

                {/* Requests Page */}
                <View style={styles.page}>
                    <FlatList
                        data={requestsConversations}
                        renderItem={(props) => renderItem({ ...props, type: 'requests' })}
                        keyExtractor={(item) => item.chat_partner_id.toString()}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={fetchAll} colors={[theme.colors.primary]} />
                        }
                        ListEmptyComponent={() => renderEmptyState('requests', isLoadingRequests)}
                    />
                </View>
            </Animated.View>

            <ThemedDialog
                visible={deleteDialogVisible}
                title="Sohbeti Sil"
                message="Bu sohbeti ve tüm mesajlarını silmek istediğine emin misin?"
                actions={[
                    {
                        text: 'Vazgeç',
                        style: 'cancel',
                        onPress: () => setDeleteDialogVisible(false),
                    },
                    {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: confirmDelete,
                    }
                ]}
                onClose={() => setDeleteDialogVisible(false)}
            />
        </View >
    );
};


