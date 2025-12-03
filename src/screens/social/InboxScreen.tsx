import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/backendApi';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

export const InboxScreen = () => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            padding: theme.spacing.l,
            paddingTop: 30, // Adjust for status bar
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: theme.borderRadius.xl,
            borderBottomRightRadius: theme.borderRadius.xl,
            ...theme.shadows.soft,
            marginBottom: 10,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '800',
            color: theme.colors.text,
            letterSpacing: -1,
        },
        list: {
            padding: theme.spacing.m,
            paddingBottom: 120,
        },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.m,
            backgroundColor: theme.colors.surface, // Was glass
            borderRadius: theme.borderRadius.liquid,
            marginBottom: theme.spacing.s,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
            ...theme.shadows.soft,
        },
        avatarPlaceholder: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing.m,
            overflow: 'hidden',
            ...theme.shadows.soft,
        },
        avatar: {
            width: '100%',
            height: '100%',
        },
        avatarText: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
        },
        info: {
            flex: 1,
        },
        username: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 4,
        },
        lastMessage: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 60,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.colors.textSecondary,
            fontSize: 16,
        },
        unreadItem: {
            backgroundColor: theme.colors.surface, // Slightly lighter/different bg
            borderColor: theme.colors.primary,
            borderWidth: 1,
        },
        unreadText: {
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        unreadBadge: {
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
            marginLeft: 8,
        },
        unreadBadgeText: {
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
        },
    }), [theme]);

    const fetchInbox = async () => {
        if (!user) return;
        if (!refreshing) setIsLoading(true);
        try {
            const data = await messageService.getInbox(user.id);
            console.log('Inbox data:', JSON.stringify(data, null, 2));
            setConversations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchInbox();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchInbox();
        });
        return unsubscribe;
    }, [navigation, user]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.item, item.unread_count > 0 && styles.unreadItem]}
            onPress={() => (navigation as any).navigate('Chat', {
                otherUserId: item.chat_partner_id,
                otherUserName: item.username,
                avatarUrl: item.avatar_url
            })}
        >
            <View style={styles.avatarPlaceholder}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                    <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                )}
            </View>
            <View style={styles.info}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.username, item.unread_count > 0 && styles.unreadText]}>{item.username}</Text>
                    {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.lastMessage, item.unread_count > 0 && styles.unreadText]} numberOfLines={1}>
                    {item.last_message || item.content || 'Sohbeti görüntüle'}
                </Text>
            </View>
            <Icon name="arrow-right" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mesajlar</Text>
            </View>

            {isLoading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.chat_partner_id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="envelope" size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <Text style={styles.emptyText}>Henüz mesajınız yok.</Text>
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


