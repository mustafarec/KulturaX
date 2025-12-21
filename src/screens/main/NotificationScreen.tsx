import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, Image, DeviceEventEmitter, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/backendApi';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';
import { Heart, MessageCircle, UserPlus, BookOpen, Calendar, Sparkles, BellRing, Film, Quote, Trash2 } from 'lucide-react-native';

interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    data: string | null;
    is_read: boolean;
    created_at: string;
    sender_username?: string;
    sender_avatar?: string;
}

export const NotificationScreen = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const { fetchUnreadCount, decrementUnreadCount } = useNotification();

    const [activeFilter, setActiveFilter] = useState<'Tümü' | 'Beğeniler' | 'Yorumlar' | 'Takip' | 'Öneriler' | 'Bahsetmeler'>('Tümü');

    const fetchNotifications = async () => {
        if (!user) return;
        if (!refreshing && notifications.length === 0) setIsLoading(true);

        try {
            const data = await notificationService.getNotifications(user.id);
            const validData = Array.isArray(data) ? data : [];
            const mappedData = validData.map((n: any) => ({
                ...n,
                is_read: n.is_read == 1 || n.is_read === '1' || n.is_read === true
            }));
            // Filter out direct messages if they are handled elsewhere
            const filteredData = mappedData.filter((n: any) => n.type !== 'message');
            setNotifications(filteredData);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
            fetchUnreadCount(); // Sync global badge count
        }
    };

    const getFilteredNotifications = () => {
        switch (activeFilter) {
            case 'Beğeniler':
                return notifications.filter(n => n.type === 'like');
            case 'Yorumlar':
                return notifications.filter(n => n.type === 'comment' || n.type === 'reply');
            case 'Takip':
                return notifications.filter(n => n.type === 'follow');
            case 'Bahsetmeler':
                return notifications.filter(n => n.type === 'quote' || n.type === 'repost');
            case 'Öneriler':
                return notifications.filter(n => n.type === 'recommendation' || n.type === 'event' || n.type === 'system');
            default:
                return notifications;
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, []);

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('focus', () => {
            fetchNotifications();
        });

        const subscription = DeviceEventEmitter.addListener('notificationReceived', () => {
            fetchNotifications();
        });

        return () => {
            unsubscribeFocus();
            subscription.remove();
        };
    }, [navigation, user]);

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Az önce';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk önce`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s önce`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g önce`;
        return past.toLocaleDateString('tr-TR');
    };

    const handleNotificationPress = async (item: Notification) => {
        if (!item.is_read && user) {
            try {
                await notificationService.markAsRead(user.id, item.id);
                setNotifications(prev =>
                    prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
                );
                decrementUnreadCount();
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        try {
            let data: any = null;
            if (typeof item.data === 'string') {
                try {
                    data = JSON.parse(item.data);
                } catch (e) { }
            } else {
                data = item.data;
            }

            if (item.type === 'like' || item.type === 'comment' || item.type === 'reply' || item.type === 'repost' || item.type === 'quote') {
                const targetPostId = data?.post_id || data?.id; // Handle possible data structures
                if (targetPostId) {
                    (navigation as any).navigate('PostDetail', {
                        postId: targetPostId,
                        autoFocusComment: false
                    });
                }
            } else if (item.type === 'follow') {
                if (data && data.sender_id) {
                    (navigation as any).navigate('OtherProfile', { userId: data.sender_id });
                }
            }
        } catch (e) {
            console.error('Error handling notification press:', e);
        }
    };

    const handleDelete = async (id: number) => {
        const previousNotifications = [...notifications];
        const notificationToDelete = notifications.find(n => n.id === id);

        setNotifications(prev => prev.filter(n => n.id !== id));

        // If deleting an unread notification, decrement global count
        if (notificationToDelete && !notificationToDelete.is_read) {
            decrementUnreadCount();
        }

        try {
            if (user) {
                await notificationService.deleteNotification(user.id, id);
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            setNotifications(previousNotifications);
        }
    };

    const getNotificationIcon = (type: string) => {
        const isDark = theme.dark;
        switch (type) {
            case 'like': return <Heart size={16} color={isDark ? "#f87171" : "#e11d48"} fill={isDark ? "#f87171" : "#e11d48"} />;
            case 'comment': return <MessageCircle size={16} color={isDark ? "#60a5fa" : "#2563eb"} fill={isDark ? "#60a5fa" : "#2563eb"} />;
            case 'reply': return <MessageCircle size={16} color={isDark ? "#60a5fa" : "#2563eb"} fill={isDark ? "#60a5fa" : "#2563eb"} />;
            case 'follow': return <UserPlus size={16} color={isDark ? "#4ade80" : "#16a34a"} fill={isDark ? "#4ade80" : "#16a34a"} />;
            case 'quote': return <Quote size={16} color={isDark ? "#c084fc" : "#9333ea"} fill={isDark ? "#c084fc" : "#9333ea"} />;
            case 'repost': return <Quote size={16} color={isDark ? "#c084fc" : "#9333ea"} fill={isDark ? "#c084fc" : "#9333ea"} />;
            case 'recommendation': return <Sparkles size={16} color={isDark ? "#fbbf24" : "#d97706"} fill={isDark ? "#fbbf24" : "#d97706"} />;
            case 'event': return <Calendar size={16} color={isDark ? "#2dd4bf" : "#0d9488"} fill={isDark ? "#2dd4bf" : "#0d9488"} />;
            case 'system': return <BellRing size={16} color={isDark ? "#fb923c" : "#ea580c"} fill={isDark ? "#fb923c" : "#ea580c"} />;
            default: return <BellRing size={16} color={theme.colors.textSecondary} />;
        }
    };

    const getIconBgColor = (type: string) => {
        if (theme.dark) {
            switch (type) {
                case 'like': return 'rgba(248, 113, 113, 0.2)';
                case 'comment':
                case 'reply': return 'rgba(96, 165, 250, 0.2)';
                case 'follow': return 'rgba(74, 222, 128, 0.2)';
                case 'quote':
                case 'repost': return 'rgba(192, 132, 252, 0.2)';
                case 'recommendation': return 'rgba(251, 191, 36, 0.2)';
                case 'event': return 'rgba(45, 212, 191, 0.2)';
                default: return theme.colors.surface;
            }
        }
        switch (type) {
            case 'like': return '#fef2f2';
            case 'comment':
            case 'reply': return '#eff6ff';
            case 'follow': return '#f0fdf4';
            case 'quote':
            case 'repost': return '#faf5ff';
            case 'recommendation': return '#fffbeb';
            case 'event': return '#f0fdfa';
            default: return '#f4f4f5';
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: Platform.OS === 'ios' ? 60 : 30, // Safe area
            paddingBottom: 16,
            paddingHorizontal: 16,
        },
        headerTitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text,
            fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
        },
        badge: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        badgeText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '600',
        },
        subtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        filtersContainer: {
            paddingHorizontal: 16,
            paddingBottom: 16,
        },
        filterChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        activeFilterChip: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        filterText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeFilterText: {
            color: '#fff',
        },
        list: {
            paddingHorizontal: 16,
            paddingBottom: 100,
        },
        card: {
            flexDirection: 'row',
            padding: 16,
            borderRadius: 16,
            marginBottom: 12,
            borderWidth: 1,
            alignItems: 'flex-start',
        },
        cardUnread: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary + '30',
        },
        cardRead: {
            backgroundColor: theme.colors.background, // or theme.colors.card
            borderColor: theme.colors.border,
        },
        avatarContainer: {
            position: 'relative',
            marginRight: 12,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.border,
        },
        iconBadge: {
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.colors.surface,
        },
        contentContainer: {
            flex: 1,
            marginRight: 8,
        },
        messageText: {
            fontSize: 14,
            lineHeight: 20,
            color: theme.colors.text,
            marginBottom: 4,
        },
        senderName: {
            fontWeight: '700',
        },
        timeText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.primary,
            marginTop: 6,
        },
        deleteButtonContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            marginBottom: 12,
            borderRadius: 16,
        },
        deleteButton: {
            backgroundColor: theme.colors.error,
            justifyContent: 'center',
            alignItems: 'center',
            width: 50,
            height: 50,
            borderRadius: 25,
        },
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 80,
        },
        emptyIcon: {
            marginBottom: 16,
            color: theme.colors.textSecondary,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
    }), [theme]);

    const renderRightActions = (progress: any, dragX: any, id: number) => {
        return (
            <TouchableOpacity onPress={() => handleDelete(id)} style={styles.deleteButtonContainer}>
                <View style={styles.deleteButton}>
                    <Trash2 size={24} color="#fff" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const iconBg = getIconBgColor(item.type);

        const cardStyle = item.is_read ? styles.cardRead : styles.cardUnread;
        const bgStyle = item.is_read ? { backgroundColor: theme.colors.background } : { backgroundColor: theme.colors.surface };

        return (
            <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
                overshootRight={false}
            >
                <TouchableOpacity
                    style={[styles.card, cardStyle, bgStyle]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        {item.sender_avatar ? (
                            <Image source={{ uri: item.sender_avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                                <UserPlus size={24} color={theme.colors.textSecondary} />
                            </View>
                        )}
                        <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
                            {getNotificationIcon(item.type)}
                        </View>
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.messageText} numberOfLines={3}>
                            {item.sender_username && <Text style={styles.senderName}>{item.sender_username} </Text>}
                            <Text style={{ color: theme.colors.textSecondary }}>{item.message}</Text>
                        </Text>
                        <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
                    </View>

                    {!item.is_read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>Bildirimler</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount} yeni</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.subtitle}>Son aktivitelerinizi ve güncellemeleri takip edin</Text>
            </View>

            <View style={{ height: 60 }}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                    data={[
                        { label: 'Tümü', key: 'Tümü' },
                        { label: 'Beğeniler', key: 'Beğeniler' },
                        { label: 'Yorumlar', key: 'Yorumlar' },
                        { label: 'Bahsetmeler', key: 'Bahsetmeler' },
                        { label: 'Takip', key: 'Takip' },
                        { label: 'Öneriler', key: 'Öneriler' },
                    ]}
                    keyExtractor={item => item.key}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                activeFilter === item.key && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(item.key as any)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === item.key && styles.activeFilterText
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {isLoading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={getFilteredNotifications()}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <BellRing size={64} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <Text style={styles.emptyTitle}>Bildirim Yok</Text>
                            <Text style={styles.emptyText}>
                                {activeFilter === 'Tümü'
                                    ? 'Henüz size ulaşan bir bildirim bulunmuyor.'
                                    : 'Bu filtreye uygun bildirim bulunmuyor.'}
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                />
            )}
        </View>
    );
};
