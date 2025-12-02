import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/backendApi';

interface Conversation {
    chat_partner_id: number;
    username: string;
    avatar_url: string | null;
    last_message: string;
    last_message_time: string;
    last_message_sender_id: number;
}

export const MessageScreen = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const navigation = useNavigation();

    const fetchInbox = async () => {
        if (!user) return;
        if (!refreshing) setIsLoading(true);
        try {
            const data = await messageService.getInbox(user.id);
            setConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch inbox:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchInbox();
        });
        return unsubscribe;
    }, [navigation, user]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchInbox();
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 86400000 && now.getDate() === date.getDate()) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const renderItem = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => (navigation as any).navigate('ChatDetail', {
                otherUserId: item.chat_partner_id,
                username: item.username,
                avatarUrl: item.avatar_url
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
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.time}>{formatTime(item.last_message_time)}</Text>
                </View>
                <Text style={styles.message} numberOfLines={1}>
                    {item.last_message_sender_id === user?.id ? 'Siz: ' : ''}{item.last_message}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mesajlar</Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.chat_partner_id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>💬</Text>
                            <Text style={styles.emptyTitle}>Mesaj Yok</Text>
                            <Text style={styles.emptyText}>Henüz kimseyle mesajlaşmadınız.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    placeholderAvatar: {
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
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
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    time: {
        fontSize: 12,
        color: '#95A5A6',
    },
    message: {
        fontSize: 14,
        color: '#7F8C8D',
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
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#95A5A6',
    },
});
