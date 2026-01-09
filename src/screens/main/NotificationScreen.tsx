import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, Image, DeviceEventEmitter, Animated, Alert, ViewToken } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService, userService } from '../../services/backendApi';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';
import { Heart, MessageCircle, UserPlus, BookOpen, Calendar, Sparkles, BellRing, Film, Quote, Trash2, MoreVertical, CheckCheck, Clock, Check, X } from 'lucide-react-native';
import { DropdownMenu } from '../../components/DropdownMenu';
import { ThemedDialog } from '../../components/ThemedDialog';
import Toast from 'react-native-toast-message';

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
    const { fetchUnreadCount, decrementUnreadCount, setUnreadCount } = useNotification();

    const [activeFilter, setActiveFilter] = useState<'Tümü' | 'Beğeniler' | 'Yorumlar' | 'Takip' | 'İstekler' | 'Öneriler' | 'Bahsetmeler'>('Tümü');

    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const moreButtonRef = useRef<View>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    // Auto-mark visible notifications as read after 3 seconds
    const visibleTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const notificationsRef = useRef(notifications);
    notificationsRef.current = notifications;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 0,
    }).current;

    const markNotificationAsReadWithDelay = useCallback(async (notificationId: number) => {
        const notification = notificationsRef.current.find(n => n.id === notificationId);
        if (!notification || notification.is_read || !user) return;

        try {
            await notificationService.markAsRead(user.id, notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            decrementUnreadCount();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [user, decrementUnreadCount]);

    const onViewableItemsChanged = useCallback(({ viewableItems, changed }: { viewableItems: ViewToken[], changed: ViewToken[] }) => {
        const currentlyVisible = new Set(viewableItems.map(item => (item.item as Notification).id));

        // Start timers for newly visible unread notifications
        for (const item of viewableItems) {
            const notification = item.item as Notification;
            if (!notification.is_read && !visibleTimersRef.current.has(notification.id)) {
                const timer = setTimeout(() => {
                    markNotificationAsReadWithDelay(notification.id);
                    visibleTimersRef.current.delete(notification.id);
                }, 3000);
                visibleTimersRef.current.set(notification.id, timer);
            }
        }

        // Clear timers for items that are no longer visible
        for (const [id, timer] of visibleTimersRef.current.entries()) {
            if (!currentlyVisible.has(id)) {
                clearTimeout(timer);
                visibleTimersRef.current.delete(id);
            }
        }
    }, [markNotificationAsReadWithDelay]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            for (const timer of visibleTimersRef.current.values()) {
                clearTimeout(timer);
            }
            visibleTimersRef.current.clear();
        };
    }, []);

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
                return notifications.filter(n => n.type === 'follow' || n.type === 'follow_accepted');
            case 'İstekler':
                return notifications.filter(n => n.type === 'follow_request');
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

    const handleMorePress = () => {
        if (moreButtonRef.current) {
            moreButtonRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                setMenuPosition({ x: px, y: py, width, height });
                setMenuVisible(true);
            });
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            await notificationService.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0); // Update global context immediately
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Tüm bildirimler okundu olarak işaretlendi.' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem gerçekleştirilemedi.' });
        }
    };

    const handleDeleteAll = () => {
        if (!user) return;
        setMenuVisible(false); // Close menu
        setDeleteDialogVisible(true);
    };

    const confirmDeleteAll = async () => {
        if (!user) return;
        setDeleteDialogVisible(false); // Close dialog

        try {
            await notificationService.deleteAllNotifications(user.id);
            setNotifications([]);
            setUnreadCount(0);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Tüm bildirimler silindi.' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Silme işlemi başarısız oldu.' });
        }
    };

    const getNotificationIcon = (type: string) => {
        const isDark = theme.dark;
        switch (type) {
            case 'like': return <Heart size={16} color={isDark ? "#f87171" : "#e11d48"} fill={isDark ? "#f87171" : "#e11d48"} />;
            case 'comment': return <MessageCircle size={16} color={isDark ? "#60a5fa" : "#2563eb"} fill={isDark ? "#60a5fa" : "#2563eb"} />;
            case 'reply': return <MessageCircle size={16} color={isDark ? "#60a5fa" : "#2563eb"} fill={isDark ? "#60a5fa" : "#2563eb"} />;
            case 'follow': return <UserPlus size={16} color={isDark ? "#4ade80" : "#16a34a"} fill={isDark ? "#4ade80" : "#16a34a"} />;
            case 'follow_request': return <Clock size={16} color={isDark ? "#fbbf24" : "#d97706"} />;
            case 'follow_accepted': return <Check size={16} color={isDark ? "#4ade80" : "#16a34a"} />;
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
                case 'follow':
                case 'follow_accepted': return 'rgba(74, 222, 128, 0.2)';
                case 'follow_request': return 'rgba(251, 191, 36, 0.2)';
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
            case 'follow':
            case 'follow_accepted': return '#f0fdf4';
            case 'follow_request': return '#fffbeb';
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
            fontSize: 23,
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

    const handleAcceptRequest = async (item: Notification) => {
        try {
            const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            const requestId = data?.request_id;

            if (!requestId) {
                // If no request_id, use sender_id to find request
                Toast.show({ type: 'error', text1: 'Hata', text2: 'İstek bulunamadı.' });
                return;
            }

            await userService.acceptFollowRequest(requestId);
            setNotifications(prev => prev.filter(n => n.id !== item.id));
            decrementUnreadCount();
            Toast.show({ type: 'success', text1: 'Kabul Edildi', text2: 'Takip isteği kabul edildi.' });
        } catch (error) {
            console.error('Accept request error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem gerçekleştirilemedi.' });
        }
    };

    const handleRejectRequest = async (item: Notification) => {
        try {
            const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            const requestId = data?.request_id;

            if (!requestId) {
                Toast.show({ type: 'error', text1: 'Hata', text2: 'İstek bulunamadı.' });
                return;
            }

            await userService.rejectFollowRequest(requestId);
            setNotifications(prev => prev.filter(n => n.id !== item.id));
            decrementUnreadCount();
            Toast.show({ type: 'info', text1: 'Reddedildi', text2: 'Takip isteği reddedildi.' });
        } catch (error) {
            console.error('Reject request error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem gerçekleştirilemedi.' });
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const iconBg = getIconBgColor(item.type);

        const cardStyle = item.is_read ? styles.cardRead : styles.cardUnread;
        const bgStyle = item.is_read ? { backgroundColor: theme.colors.background } : { backgroundColor: theme.colors.surface };

        const isFollowRequest = item.type === 'follow_request';

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

                        {/* Accept/Reject buttons for follow requests */}
                        {isFollowRequest && (
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        paddingHorizontal: 16,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                    onPress={() => handleAcceptRequest(item)}
                                >
                                    <Check size={14} color="#FFF" />
                                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>Kabul Et</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: theme.colors.surface,
                                        paddingHorizontal: 16,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: theme.colors.border,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                    onPress={() => handleRejectRequest(item)}
                                >
                                    <X size={14} color={theme.colors.text} />
                                    <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 12 }}>Reddet</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.headerTitle}>Bildirimler</Text>
                        {unreadCount > 0 && (
                            <View style={[styles.badge, { marginLeft: 8 }]}>
                                <Text style={styles.badgeText}>{unreadCount} yeni</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        ref={moreButtonRef}
                        onPress={handleMorePress}
                        style={{ padding: 4 }}
                    >
                        <MoreVertical size={24} color={theme.colors.text} />
                    </TouchableOpacity>
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
                        { label: 'İstekler', key: 'İstekler' },
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
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
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

            <DropdownMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                targetPosition={menuPosition}
                options={[
                    {
                        label: 'Tümünü okundu işaretle',
                        icon: CheckCheck,
                        onPress: handleMarkAllRead
                    },
                    {
                        label: 'Tüm bildirimleri sil',
                        icon: Trash2,
                        color: theme.colors.error,
                        onPress: handleDeleteAll
                    }
                ]}
            />

            <ThemedDialog
                visible={deleteDialogVisible}
                title="Tüm Bildirimleri Sil"
                message="Tüm bildirimlerinizi kalıcı olarak silmek istediğinizden emin misiniz?"
                onClose={() => setDeleteDialogVisible(false)}
                actions={[
                    {
                        text: 'İptal',
                        style: 'cancel',
                        onPress: () => setDeleteDialogVisible(false)
                    },
                    {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: confirmDeleteAll
                    }
                ]}
            />
        </View>
    );
};

