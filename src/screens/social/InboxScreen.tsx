import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl, StatusBar, TextInput, Alert, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/backendApi';
import { ArrowRight, Mail, Search, MoreVertical, Trash2, Flag, Archive, UserCheck, X } from 'lucide-react-native';

// Request type from backend
interface MessageRequest {
    chat_partner_id: number;
    username: string;
    avatar_url: string | null;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    time_ago?: string;
}

export const InboxScreen = () => {
    const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
    const [searchQuery, setSearchQuery] = useState('');
    const [conversations, setConversations] = useState<any[]>([]);
    const [requests, setRequests] = useState<MessageRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [openMenuConvId, setOpenMenuConvId] = useState<number | null>(null);

    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingHorizontal: theme.spacing.m,
            paddingTop: Platform.OS === 'android' ? 40 : theme.spacing.xl,
            paddingBottom: theme.spacing.m,
        },
        headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        headerTitle: {
            fontSize: 32,
            fontFamily: theme.fonts.headings,
            color: theme.colors.text,
        },
        unreadBadge: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.borderRadius.pill,
        },
        unreadBadgeText: {
            color: '#fff', // Always white on primary
            fontSize: 12,
            fontWeight: 'bold',
        },
        headerSubtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        tabsContainer: {
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.m,
            marginBottom: theme.spacing.m,
            gap: 8,
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: theme.borderRadius.m,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        activeTab: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        inactiveTab: {
            backgroundColor: 'transparent',
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            fontFamily: theme.fonts.main,
        },
        activeTabText: {
            color: theme.colors.primary,
        },
        inactiveTabText: {
            color: theme.colors.textSecondary,
        },
        tabBadge: {
            marginLeft: 6,
            paddingHorizontal: 6,
            height: 20,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        searchContainer: {
            paddingHorizontal: theme.spacing.m,
            marginBottom: theme.spacing.m,
        },
        searchWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.inputBackground, // Use specific input background
            borderRadius: theme.borderRadius.m,
            paddingHorizontal: 12,
            height: 44,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        searchInput: {
            flex: 1,
            marginLeft: 8,
            fontSize: 15,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
        },
        list: {
            padding: theme.spacing.m,
            paddingTop: 0,
            paddingBottom: 100,
        },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.m,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.l,
            marginBottom: theme.spacing.s,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        itemUnread: {
            backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(139, 90, 43, 0.05)',
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.primary,
        },
        avatarContainer: {
            position: 'relative',
            marginRight: theme.spacing.m,
        },
        avatarWrapper: {
            width: 56,
            height: 56,
            borderRadius: 28,
            overflow: 'hidden',
        },
        avatar: {
            width: '100%',
            height: '100%',
        },
        avatarPlaceholder: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarLetter: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            fontFamily: theme.fonts.headings,
        },
        onlineIndicator: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            backgroundColor: theme.colors.success,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: theme.colors.surface,
        },
        itemContent: {
            flex: 1,
            marginRight: 8,
        },
        itemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
            alignItems: 'center',
        },
        username: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
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
        lastMessage: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        unreadMessage: {
            color: theme.colors.text,
            fontWeight: '600',
        },
        countBadge: {
            backgroundColor: theme.colors.error,
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
            marginLeft: 8,
        },
        countText: {
            color: '#fff',
            fontSize: 11,
            fontWeight: 'bold',
        },
        actionsButton: {
            padding: 4,
        },
        // Request Item Styles
        requestItem: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.l,
            marginBottom: theme.spacing.m,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
            overflow: 'hidden',
        },
        requestContent: {
            padding: theme.spacing.m,
            flexDirection: 'row',
        },
        requestActions: {
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        requestActionBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            gap: 6,
        },
        actionSeparator: {
            width: 1,
            backgroundColor: theme.colors.border,
        },
        btnAccept: {
            // backgroundColor: theme.colors.primary + '10', // 10% opacity
        },
        btnTextAccept: {
            color: theme.colors.primary,
            fontWeight: '600',
            fontSize: 14,
        },
        btnTextDecline: {
            color: theme.colors.textSecondary,
            fontWeight: '500',
            fontSize: 14,
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 60,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.colors.textSecondary,
            marginTop: 16,
            fontFamily: theme.fonts.main,
        },
        menuBackdrop: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        menu: {
            position: 'absolute',
            width: 200,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.m,
            padding: 8,
            ...theme.shadows.soft,
            // Simple positioning logic
        },
        menuOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.2)',
            justifyContent: 'flex-end',
        },
        bottomSheet: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
            padding: theme.spacing.m,
            paddingBottom: theme.spacing.xl,
        },
        menuOption: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        menuOptionText: {
            fontSize: 16,
            marginLeft: 12,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
        }
    }), [theme]);

    const fetchInbox = async () => {
        if (!user) return;
        if (!refreshing) setIsLoading(true);
        try {
            const data = await messageService.getInbox('inbox');
            setConversations(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchRequests = async () => {
        if (!user) return;
        setRequestsLoading(true);
        try {
            const data = await messageService.getInbox('requests');
            setRequests(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchInbox();
            fetchRequests();
        });
        return unsubscribe;
    }, [navigation, user]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchInbox();
        fetchRequests();
    }, []);

    // Action Handlers
    const deleteConversation = (id: number) => {
        // Implement delete API call
        setConversations(prev => prev.filter(c => c.chat_partner_id !== id));
        setOpenMenuConvId(null);
        Alert.alert('Başarılı', 'Konuşma silindi.');
    };

    const handleAcceptRequest = async (partnerId: number) => {
        if (!user) return;
        try {
            await messageService.acceptRequest(user.id, partnerId);
            setRequests(prev => prev.filter(r => r.chat_partner_id !== partnerId));
            Alert.alert('Kabul Edildi', 'İstek kabul edildi ve mesajlara eklendi.');
            fetchInbox();
        } catch (error) {
            Alert.alert('Hata', 'İstek kabul edilemedi.');
        }
    };

    const handleDeclineRequest = async (partnerId: number) => {
        if (!user) return;
        try {
            await messageService.declineRequest(user.id, partnerId);
            setRequests(prev => prev.filter(r => r.chat_partner_id !== partnerId));
            Alert.alert('Reddedildi', 'İstek reddedildi.');
        } catch (error) {
            Alert.alert('Hata', 'İstek reddedilemedi.');
        }
    };

    // Filter Logic
    const filteredConversations = conversations.filter(c =>
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredRequests = requests.filter(r =>
        r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.last_message && r.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalUnread = conversations.reduce((acc, curr) => acc + (parseInt(curr.unread_count) || 0), 0);

    const renderMessageItem = ({ item }: { item: any }) => {
        const unreadNum = parseInt(item.unread_count) || 0;
        const hasUnread = unreadNum > 0;

        return (
            <TouchableOpacity
                style={[styles.item, hasUnread && styles.itemUnread]}
                onPress={() => (navigation as any).navigate('Chat', {
                    otherUserId: item.chat_partner_id,
                    otherUserName: item.username,
                    avatarUrl: item.avatar_url
                })}
            >
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarLetter}>{item.username.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    {/* Unread indicator dot on avatar */}
                    {hasUnread && (
                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 14,
                            height: 14,
                            backgroundColor: theme.colors.error,
                            borderRadius: 7,
                            borderWidth: 2,
                            borderColor: theme.colors.surface,
                        }} />
                    )}
                </View>

                <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                        <Text style={[styles.username, hasUnread && styles.usernameUnread]}>{item.username}</Text>
                        <Text style={[styles.time, hasUnread && styles.timeUnread]}>{item.time_ago || 'Az önce'}</Text>
                    </View>
                    <Text style={[
                        styles.lastMessage,
                        hasUnread && styles.unreadMessage
                    ]}
                        numberOfLines={1}
                    >
                        {item.last_message || 'Sohbeti görüntüle'}
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    {hasUnread && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{unreadNum}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.actionsButton}
                        onPress={() => setOpenMenuConvId(item.chat_partner_id)}
                    >
                        <MoreVertical size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderRequestItem = ({ item }: { item: MessageRequest }) => (
        <View style={styles.requestItem}>
            <View style={styles.requestContent}>
                <View style={[styles.avatarWrapper, { marginRight: 12 }]}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarLetter}>{item.username.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.time}>{item.time_ago || 'Az önce'}</Text>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={2}>{item.last_message}</Text>
                </View>
            </View>
            <View style={styles.requestActions}>
                <TouchableOpacity
                    style={styles.requestActionBtn}
                    onPress={() => handleDeclineRequest(item.chat_partner_id)}
                >
                    <X size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.btnTextDecline}>Reddet</Text>
                </TouchableOpacity>
                <View style={styles.actionSeparator} />
                <TouchableOpacity
                    style={[styles.requestActionBtn, styles.btnAccept]}
                    onPress={() => handleAcceptRequest(item.chat_partner_id)}
                >
                    <UserCheck size={18} color={theme.colors.primary} />
                    <Text style={styles.btnTextAccept}>Kabul Et</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                    {totalUnread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{totalUnread} okunmamış</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.headerSubtitle}>Kültür ve sanat dostlarınla sohbet et</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' ? styles.activeTab : styles.inactiveTab]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={[styles.tabText, activeTab === 'messages' ? styles.activeTabText : styles.inactiveTabText]}>Mesajlar</Text>
                    {totalUnread > 0 && activeTab !== 'messages' && (
                        <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{totalUnread}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' ? styles.activeTab : styles.inactiveTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Text style={[styles.tabText, activeTab === 'requests' ? styles.activeTabText : styles.inactiveTabText]}>İstekler</Text>
                    {requests.length > 0 && activeTab !== 'requests' && (
                        <View style={[styles.tabBadge, { backgroundColor: '#F97316' }]}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{requests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Search size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'messages' ? "Mesajlarda ara..." : "İsteklerde ara..."}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Content for Tabs */}
            {isLoading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={activeTab === 'messages' ? filteredConversations : filteredRequests}
                    renderItem={activeTab === 'messages' ? renderMessageItem : renderRequestItem}
                    keyExtractor={(item: any) => (item.id || item.chat_partner_id).toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={{
                                width: 64, height: 64, borderRadius: 32,
                                backgroundColor: theme.colors.surface,
                                justifyContent: 'center', alignItems: 'center',
                                marginBottom: 16
                            }}>
                                {activeTab === 'messages' ? (
                                    <Mail size={32} color={theme.colors.textSecondary} />
                                ) : (
                                    <UserCheck size={32} color={theme.colors.textSecondary} />
                                )}
                            </View>
                            <Text style={styles.emptyText}>
                                {activeTab === 'messages' ? 'Henüz mesajınız yok.' : 'Yeni mesaj isteği yok.'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Context Menu Bottom Sheet */}
            <Modal
                visible={openMenuConvId !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setOpenMenuConvId(null)}
            >
                <View style={styles.menuOverlay}>
                    <TouchableOpacity style={styles.menuBackdrop} onPress={() => setOpenMenuConvId(null)} />
                    <View style={styles.bottomSheet}>
                        <View style={{ width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => openMenuConvId && deleteConversation(openMenuConvId)}
                        >
                            <Trash2 size={24} color={'#d4183d'} />
                            <Text style={[styles.menuOptionText, { color: '#d4183d' }]}>Konuşmayı Sil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuOption} onPress={() => setOpenMenuConvId(null)}>
                            <Flag size={24} color={theme.colors.warning} />
                            <Text style={styles.menuOptionText}>Şikayet Et</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 0 }]} onPress={() => setOpenMenuConvId(null)}>
                            <Archive size={24} color={theme.colors.primary} />
                            <Text style={styles.menuOptionText}>Arşivle</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
