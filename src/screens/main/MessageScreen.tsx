import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
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
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            marginBottom: 10, // Add spacing below header
        },
        headerContent: {
            padding: 20,
            paddingBottom: 10, // Reduce internal padding slightly
        },
        headerTitle: {
            fontSize: 28,
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
            marginTop: 0, // Remove top margin as we have padding in headerContent
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
        list: {
            paddingBottom: 20,
        },
        item: {
            flexDirection: 'row',
            paddingVertical: 12, // Reduce vertical padding
            paddingHorizontal: 16,
            marginHorizontal: 16,
            backgroundColor: theme.colors.surface,
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
            color: theme.colors.text,
        },
        time: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        message: {
            fontSize: 14,
            color: theme.colors.textSecondary,
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
        },
    }), [theme]);

    const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');

    const fetchInbox = async () => {
        if (!user) return;
        if (!refreshing) setIsLoading(true);
        try {
            const data = await messageService.getInbox(user.id, activeTab);
            setConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch inbox:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInbox();
    }, [activeTab, user]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchInbox();
        });
        return unsubscribe;
    }, [navigation, user, activeTab]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchInbox();
    }, [activeTab]);

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
                avatarUrl: item.avatar_url,
                isRequest: activeTab === 'requests' // Pass flag to ChatDetail
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

    const renderHeader = () => (
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
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
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
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>💬</Text>
                            <Text style={styles.emptyTitle}>{activeTab === 'inbox' ? 'Mesaj Yok' : 'İstek Yok'}</Text>
                            <Text style={styles.emptyText}>
                                {activeTab === 'inbox'
                                    ? 'Henüz kimseyle mesajlaşmadınız.'
                                    : 'Bekleyen mesaj isteğiniz yok.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};


