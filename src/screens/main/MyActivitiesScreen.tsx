import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, BookOpen, Film, Music, Calendar, Ghost, Star, MoreVertical } from 'lucide-react-native';
import { libraryService } from '../../services/backendApi';
import { LibraryBottomSheet } from '../../components/LibraryBottomSheet';
import Toast from 'react-native-toast-message';

type TabType = 'book' | 'movie' | 'music' | 'event';
type StatusFilter = 'all' | 'read' | 'reading' | 'want_to_read' | 'dropped';

const STATUS_FILTERS = [
    { key: 'all' as StatusFilter, label: 'Tümü' },
    { key: 'read' as StatusFilter, label: 'Tamamladım' },
    { key: 'reading' as StatusFilter, label: 'Devam Ediyor' },
    { key: 'want_to_read' as StatusFilter, label: 'Listemdekiler' },
    { key: 'dropped' as StatusFilter, label: 'Bıraktım' },
];

const TABS = [
    { key: 'book' as TabType, label: 'Kitaplar', icon: BookOpen, emoji: '📚' },
    { key: 'movie' as TabType, label: 'Filmler', icon: Film, emoji: '🎬' },
    { key: 'music' as TabType, label: 'Müzik', icon: Music, emoji: '🎵' },
    { key: 'event' as TabType, label: 'Etkinlikler', icon: Calendar, emoji: '🎭' },
];

export const MyActivitiesScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('book');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Library status sheet state
    const [librarySheetVisible, setLibrarySheetVisible] = useState(false);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

    const fetchLibrary = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await libraryService.getUserLibrary(user.id);
            setLibraryItems(data || []);
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLibrary();
    }, [fetchLibrary]);

    const getStatusLabel = (status: string, type: string) => {
        switch (status) {
            case 'read': return type === 'movie' ? 'İzledim' : type === 'music' ? 'Dinledim' : type === 'event' ? 'Katıldım' : 'Okudum';
            case 'reading': return type === 'movie' ? 'İzliyorum' : type === 'music' ? 'Dinliyorum' : type === 'event' ? 'Katılıyorum' : 'Okuyorum';
            case 'want_to_read':
            case 'want_to_watch':
            case 'want_to_listen':
            case 'want_to_attend':
                return type === 'movie' ? 'İzleyeceğim' : type === 'music' ? 'Dinleyeceğim' : type === 'event' ? 'Katılacağım' : 'Okuyacağım';
            case 'dropped': return 'Bıraktım';
            default: return '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'read': return '#10B981';
            case 'reading': return '#3B82F6';
            case 'want_to_read':
            case 'want_to_watch':
            case 'want_to_listen':
            case 'want_to_attend': return '#F59E0B';
            case 'dropped': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const filteredItems = libraryItems.filter(item => {
        const matchesTab = item.content_type === activeTab;
        if (!matchesTab) return false;

        if (statusFilter === 'all') return true;

        // Map status filter to actual status values
        if (statusFilter === 'want_to_read') {
            return ['want_to_read', 'want_to_watch', 'want_to_listen', 'want_to_attend'].includes(item.status);
        }
        return item.status === statusFilter;
    });

    const handleItemPress = (item: any) => {
        (navigation as any).navigate('ContentDetail', {
            contentId: item.content_id,
            contentType: item.content_type
        });
    };

    const handleStatusUpdate = async (status: string) => {
        if (!selectedLibraryItem || !user?.id) return;
        try {
            await libraryService.updateStatus(
                selectedLibraryItem.content_type,
                selectedLibraryItem.content_id,
                status,
                0,
                selectedLibraryItem.content_title,
                selectedLibraryItem.image_url,
                selectedLibraryItem.creator,
                undefined,
                undefined,
                undefined,
                user.id
            );
            await fetchLibrary();
            Toast.show({
                type: 'success',
                text1: 'Güncellendi',
                text2: 'Durum güncellendi.',
            });
        } catch (error) {
            console.error('Error updating status:', error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Durum güncellenemedi.',
            });
        }
        setLibrarySheetVisible(false);
        setSelectedLibraryItem(null);
    };

    const renderItem = ({ item }: { item: any }) => {
        const TabIcon = TABS.find(t => t.key === item.content_type)?.icon || BookOpen;

        return (
            <View style={[styles.listItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.posterContainer}>
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={styles.poster} resizeMode="cover" />
                        ) : (
                            <View style={[styles.poster, { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <TabIcon size={24} color={theme.colors.textSecondary} />
                            </View>
                        )}
                    </View>
                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={1}>
                            {item.content_title || 'Başlık Yok'}
                        </Text>
                        {item.creator && (
                            <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                {item.creator}
                            </Text>
                        )}
                        <View style={styles.metaRow}>
                            {item.status && (
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                        {getStatusLabel(item.status, item.content_type)}
                                    </Text>
                                </View>
                            )}
                            {item.rating > 0 && (
                                <View style={styles.ratingContainer}>
                                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.ratingText}>{item.rating}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => {
                        setSelectedLibraryItem(item);
                        setLibrarySheetVisible(true);
                    }}
                >
                    <MoreVertical size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
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
            paddingHorizontal: 16,
            paddingTop: insets.top + 10,
            paddingBottom: 16,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        backButton: {
            padding: 8,
            marginRight: 12,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.text,
        },
        tabContainer: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            gap: 8,
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: theme.colors.background,
            gap: 6,
        },
        tabActive: {
            backgroundColor: theme.colors.primary + '20',
        },
        tabText: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        tabTextActive: {
            color: theme.colors.primary,
        },
        filterContainer: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
        },
        filterChip: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        filterChipActive: {
            backgroundColor: theme.colors.primary + '15',
            borderColor: theme.colors.primary,
        },
        filterChipText: {
            fontSize: 12,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        filterChipTextActive: {
            color: theme.colors.primary,
        },
        listContent: {
            padding: 16,
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 12,
            marginBottom: 10,
            borderWidth: 1,
        },
        itemContent: {
            flexDirection: 'row',
            flex: 1,
        },
        posterContainer: {
            width: 56,
            height: 80,
            borderRadius: 8,
            overflow: 'hidden',
            marginRight: 12,
        },
        poster: {
            width: '100%',
            height: '100%',
        },
        itemInfo: {
            flex: 1,
            justifyContent: 'center',
        },
        itemTitle: {
            fontSize: 15,
            fontWeight: '600',
            marginBottom: 4,
        },
        itemSubtitle: {
            fontSize: 13,
            marginBottom: 8,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        statusText: {
            fontSize: 11,
            fontWeight: '600',
        },
        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        ratingText: {
            fontSize: 12,
            fontWeight: '700',
            color: '#F59E0B',
        },
        moreButton: {
            padding: 8,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        emptyText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginTop: 12,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Etkinliklerim</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={{ fontSize: 16 }}>{tab.emoji}</Text>
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Status Filters */}
            <View style={styles.filterContainer}>
                {STATUS_FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[styles.filterChip, statusFilter === filter.key && styles.filterChipActive]}
                        onPress={() => setStatusFilter(filter.key)}
                    >
                        <Text style={[styles.filterChipText, statusFilter === filter.key && styles.filterChipTextActive]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ghost size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>Bu kategoride içerik yok.</Text>
                        </View>
                    }
                />
            )}

            {/* Library Status Bottom Sheet */}
            <LibraryBottomSheet
                visible={librarySheetVisible}
                onClose={() => {
                    setLibrarySheetVisible(false);
                    setSelectedLibraryItem(null);
                }}
                contentType={selectedLibraryItem?.content_type || 'book'}
                currentStatus={selectedLibraryItem?.status || null}
                onSelectStatus={handleStatusUpdate}
            />
        </View>
    );
};
