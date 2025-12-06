import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, Image, DeviceEventEmitter, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/backendApi';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';

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

    const fetchNotifications = async () => {
        if (!user) return;
        // Sadece manuel yenileme veya ilk yüklemede loading göster, 
        // otomatik yenilemede (socket/event) kullanıcıyı rahatsız etme
        if (!refreshing && notifications.length === 0) setIsLoading(true);

        try {
            const data = await notificationService.getNotifications(user.id);
            // Ensure data is an array and filter out message notifications
            const validData = Array.isArray(data) ? data : [];
            const mappedData = validData.map((n: any) => ({
                ...n,
                is_read: n.is_read == 1 || n.is_read === '1' || n.is_read === true
            }));
            const filteredData = mappedData.filter(n => n.type !== 'message');
            setNotifications(filteredData);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
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

        // OneSignal'dan bildirim geldiğinde listeyi güncelle
        const subscription = DeviceEventEmitter.addListener('notificationReceived', () => {
            console.log('Notification received event, refreshing list...');
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
                // Update local state
                setNotifications(prev =>
                    prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
                );
                // Update global unread count
                decrementUnreadCount();
                // Also fetch to be sure (optional, maybe delayed)
                // fetchUnreadCount();
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Navigate based on type
        try {
            let data: any = null;
            if (typeof item.data === 'string') {
                try {
                    data = JSON.parse(item.data);
                } catch (e) {
                    // console.error('JSON parse error:', e);
                }
            } else {
                data = item.data;
            }

            if (item.type === 'like' || item.type === 'comment' || item.type === 'reply' || item.type === 'repost' || item.type === 'quote') {
                if (data && data.post_id) {
                    (navigation as any).navigate('PostDetail', {
                        postId: data.post_id,
                        autoFocusComment: false
                    });
                }
            } else if (item.type === 'message') {
                if (data && data.sender_id) {
                    (navigation as any).navigate('Chat', {
                        otherUserId: data.sender_id,
                        otherUserName: item.sender_username,
                        avatarUrl: item.sender_avatar
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


    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background, // Was #F8F9FA
        },
        header: {
            paddingTop: 30,
            paddingBottom: 10,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.background, // Was #FFFFFF
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border, // Was rgba(0,0,0,0.05)
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text, // Was #1A1A1A
            letterSpacing: 0.5,
        },
        list: {
            padding: 16,
            paddingBottom: 120,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.colors.surface, // Was #FFFFFF
            borderRadius: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was rgba(0,0,0,0.03)
        },
        shadowIOS: {
            shadowColor: theme.shadows.default.shadowColor,
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.05,
            shadowRadius: 12,
        },
        shadowAndroid: {
            elevation: 3,
        },
        unreadItem: {
            backgroundColor: theme.colors.surface, // Was #FFFFFF
            borderColor: theme.colors.primary + '30',
            borderWidth: 1,
        },
        iconContainer: {
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        contentContainer: {
            flex: 1,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
        },
        title: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text, // Was #2C3E50
            flex: 1,
            marginRight: 8,
        },
        unreadText: {
            color: theme.colors.text, // Was #000000
            fontWeight: '700',
        },
        message: {
            fontSize: 14,
            color: theme.colors.textSecondary, // Was #7F8C8D
            lineHeight: 20,
        },
        unreadMessage: {
            color: theme.colors.text, // Was #34495E
            fontWeight: '500',
        },
        time: {
            fontSize: 12,
            color: theme.colors.textSecondary, // Was #95A5A6
            fontWeight: '500',
        },
        dot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.primary,
            marginLeft: 12,
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
        },
        emptyIcon: {
            fontSize: 64,
            marginBottom: 16,
            opacity: 0.8,
            color: theme.colors.textSecondary,
        },
        emptyTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text, // Was #2C3E50
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 15,
            color: theme.colors.textSecondary, // Was #95A5A6
            textAlign: 'center',
            maxWidth: '70%',
            lineHeight: 22,
        },
        avatar: {
            width: 50,
            height: 50,
            borderRadius: 25,
        },
        deleteButtonContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            marginBottom: 12,
            marginRight: 16, // Match list padding/margin
            borderRadius: 16,
            overflow: 'hidden',
        },
        deleteButton: {
            backgroundColor: theme.colors.error,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            borderRadius: 16,
        },
        deleteButtonText: {
            color: 'white',
            fontWeight: 'bold',
        },
    }), [theme]);

    const handleDelete = async (id: number) => {
        // Optimistic update
        const previousNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            if (user) {
                await notificationService.deleteNotification(user.id, id);
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            // Revert on error
            setNotifications(previousNotifications);
        }
    };

    const renderRightActions = (progress: any, dragX: any, id: number) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity onPress={() => handleDelete(id)} style={styles.deleteButtonContainer}>
                <View style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Sil</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Notification }) => {
        let icon = '🔔';
        let bgColor: string = theme.colors.primary;

        switch (item.type) {
            case 'like':
                icon = '❤️';
                bgColor = '#FF6B6B';
                break;
            case 'comment':
                icon = '💬';
                bgColor = '#4ECDC4';
                break;
            case 'follow':
                icon = '👤';
                bgColor = '#45B7D1';
                break;
            case 'message':
                icon = '✉️';
                bgColor = '#96CEB4';
                break;
            case 'system':
                icon = '📢';
                bgColor = '#FFEEAD';
                break;
        }

        return (
            <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
                overshootRight={false}
            >
                <TouchableOpacity
                    style={[
                        styles.item,
                        !item.is_read && styles.unreadItem,
                        Platform.OS === 'ios' ? styles.shadowIOS : styles.shadowAndroid
                    ]}
                    activeOpacity={0.7}
                    delayPressIn={150} // Prevent accidental opacity change during swipe
                    onPress={() => handleNotificationPress(item)}
                >
                    <View style={[styles.iconContainer, { backgroundColor: item.is_read ? '#f0f0f0' : bgColor + '20' }]}>
                        {item.sender_avatar ? (
                            <Image source={{ uri: item.sender_avatar }} style={styles.avatar} />
                        ) : (
                            <Text style={{ fontSize: 24 }}>{icon}</Text>
                        )}
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, !item.is_read && styles.unreadText]}>
                                {item.sender_username ? (
                                    <Text style={{ fontWeight: 'bold' }}>{item.sender_username} </Text>
                                ) : null}
                                {item.title}
                            </Text>
                            <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
                        </View>

                        <Text style={[styles.message, !item.is_read && styles.unreadMessage]} numberOfLines={2}>
                            {item.message}
                        </Text>
                    </View>

                    {!item.is_read && <View style={styles.dot} />}
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bildirimler</Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyTitle}>Bildirim Yok</Text>
                            <Text style={styles.emptyText}>Henüz size ulaşan bir bildirim bulunmuyor.</Text>
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
