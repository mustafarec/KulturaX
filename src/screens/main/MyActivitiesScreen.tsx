import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, BookOpen, Book, Film, Music, Calendar, Ghost, Star, MoreVertical, Search, X, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { libraryService } from '../../services/backendApi';
import { LibraryBottomSheet } from '../../components/LibraryBottomSheet';
import Toast from 'react-native-toast-message';
import { ensureHttps } from '../../utils/urlUtils';

type TabType = 'book' | 'movie' | 'music' | 'event';
type StatusFilter = 'all' | 'read' | 'reading' | 'want_to_read' | 'dropped';

const getStatusFilters = (type: TabType): { key: StatusFilter | 'loved', label: string }[] => {
    const base = [{ key: 'all' as StatusFilter, label: 'Tümü' }];

    switch (type) {
        case 'book':
            return [
                ...base,
                { key: 'read', label: 'Tamamladım' },
                { key: 'reading', label: 'Devam Ediyor' },
                { key: 'want_to_read', label: 'Listemdekiler' },
                { key: 'dropped', label: 'Bıraktım' },
            ];
        case 'movie':
            return [
                ...base,
                { key: 'read', label: 'İzlediklerim' },
                { key: 'want_to_read', label: 'İzleyeceklerim' },
            ];
        case 'music':
            return [
                ...base,
                { key: 'read', label: 'Dinlediklerim' },
                { key: 'loved', label: 'Favorilerim' },
                { key: 'want_to_read', label: 'Dinleyeceklerim' },
            ];
        case 'event':
            return [
                ...base,
                { key: 'read', label: 'Katıldıklarım' },
                { key: 'want_to_read', label: 'Katılacaklarım' },
            ];
        default:
            return base;
    }
};

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
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<any>(null);

    // Library status sheet state
    const [librarySheetVisible, setLibrarySheetVisible] = useState(false);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

    const fetchLibrary = useCallback(async () => {
        if (!user?.id) {
            return;
        }
        setIsLoading(true);
        setError(null);

        // Timeout ekle - 10 saniye içinde yanıt gelmezse loading'i kapat
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                console.log('Library fetch timeout - stopping loading state');
                setIsLoading(false);
                setRefreshing(false);
                setError('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
            }
        }, 10000);

        try {
            const libraryData = await libraryService.getUserLibrary(user.id);
            clearTimeout(timeoutId);
            setLibraryItems(libraryData || []);
            setError(null);

            // Stats
            try {
                const statsData = await libraryService.getStats(user.id);
                setStats(statsData);
            } catch (statsError) {
                console.warn('Error fetching stats:', statsError);
            }

            // Loved reminder
            if (libraryData && libraryData.length > 0) {
                const lovedItems = libraryData.filter((i: any) => i.status === 'loved');
                if (lovedItems.length > 0 && Math.random() > 0.7) {
                    const randomLoved = lovedItems[Math.floor(Math.random() * lovedItems.length)];
                    setTimeout(() => {
                        Toast.show({
                            type: 'info',
                            text1: 'Tekrar dinlemek ister misiniz?',
                            text2: `${randomLoved.content_title} içeriğini çok beğenmiştiniz.`,
                            position: 'bottom',
                            visibilityTime: 5000,
                        });
                    }, 1500);
                }
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            console.error('Error fetching library:', err);
            setError(err?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Kütüphane bilgileri alınamadı.',
            });
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    // useFocusEffect ile ekran her odaklandığında veri çek
    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                fetchLibrary();
            }
        }, [fetchLibrary, user?.id])
    );

    useEffect(() => {
        setStatusFilter('all');
    }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLibrary();
    }, [fetchLibrary]);

    const getStatusLabel = (status: string, type: string) => {
        switch (status) {
            case 'read': return type === 'movie' ? 'İzledim' : type === 'music' ? 'Dinledim' : type === 'event' ? 'Katıldım' : 'Okudum';
            case 'loved': return 'Çok Beğendim';
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
            case 'read': return theme.colors.success;
            case 'loved': return theme.colors.accent;
            case 'reading': return theme.colors.primary;
            case 'want_to_read':
            case 'want_to_watch':
            case 'want_to_listen':
            case 'want_to_attend': return theme.colors.warning;
            case 'dropped': return theme.colors.error;
            default: return theme.colors.textSecondary;
        }
    };

    const getCategoryColor = (type: string) => {
        switch (type) {
            case 'movie': return theme.colors.secondary;
            case 'music': return theme.colors.accent;
            case 'event': return theme.colors.textSecondary;
            default: return theme.colors.primary;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return '';
        }
    };

    const filteredItems = libraryItems.filter(item => {
        const matchesTab = item.content_type === activeTab;
        if (!matchesTab) return false;

        const matchesSearch = searchQuery === '' ||
            (item.content_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.creator?.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (statusFilter === 'all') return true;

        // Map status filter to actual status values
        if (statusFilter === 'want_to_read') {
            return ['want_to_read', 'want_to_watch', 'want_to_listen', 'want_to_attend'].includes(item.status);
        }

        // Special case for 'loved' filter in music
        if (statusFilter === 'loved' as any) {
            return item.status === 'loved';
        }

        return item.status === statusFilter;
    });

    const handleItemPress = (item: any) => {
        (navigation as any).navigate('ContentDetail', {
            id: item.content_id,
            type: item.content_type
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

    const styles = useMemo(() => StyleSheet.create({
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
            color: theme.colors.text,
        },
        tabContainer: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        tab: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: theme.colors.background,
            gap: 6,
            marginRight: 8,
        },
        tabActive: {
            borderWidth: 1,
        },
        tabText: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        filterContainer: {
            paddingVertical: 10,
            paddingHorizontal: 16,
        },
        filterChip: {
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginRight: 8,
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
        searchContainer: {
            paddingHorizontal: 16,
            paddingTop: 12,
        },
        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            gap: 8,
        },
        searchInput: {
            flex: 1,
            fontSize: 14,
            paddingVertical: 8,
        },
        statsContainer: {
            padding: 16,
        },
        statsCard: {
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
        },
        statsTitle: {
            fontSize: 14,
            marginBottom: 16,
            textAlign: 'center',
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
        },
        statItem: {
            alignItems: 'center',
            gap: 6,
        },
        statIconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
        },
        statValue: {
            fontSize: 18,
            fontWeight: '800',
        },
        statLabel: {
            fontSize: 11,
            fontWeight: '500',
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
            marginBottom: 4,
        },
        dateText: {
            fontSize: 11,
            marginTop: 4,
            fontStyle: 'italic',
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
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        errorIcon: {
            marginBottom: 16,
        },
        errorText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 20,
            paddingHorizontal: 32,
        },
        retryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.primary,
            gap: 8,
        },
        retryButtonText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
        },
    }), [theme, insets]);

    // Memoized item renderer with image error handling
    const ItemRenderer = useMemo(() => {
        return function RenderItem({ item }: { item: any }) {
            const [imgError, setImgError] = useState(false);
            const TabIcon = TABS.find(t => t.key === item.content_type)?.icon || BookOpen;

            return (
                <View style={[styles.listItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <TouchableOpacity
                        style={styles.itemContent}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.posterContainer}>
                            {item.image_url && !imgError ? (
                                <Image
                                    source={{ uri: ensureHttps(item.image_url) }}
                                    style={styles.poster}
                                    resizeMode="cover"
                                    onError={() => setImgError(true)}
                                />
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
                                    <View style={[styles.statusBadge, {
                                        backgroundColor: (item.status === 'loved' ? theme.colors.accent : getStatusColor(item.status)) + '15'
                                    }]}>
                                        <Text style={[styles.statusText, {
                                            color: item.status === 'loved' ? theme.colors.accent : getStatusColor(item.status)
                                        }]}>
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
                            {item.updated_at && (
                                <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                                    {formatDate(item.updated_at)}
                                </Text>
                            )}
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
    }, [theme, styles, handleItemPress]);

    const renderItem = useCallback(({ item }: { item: any }) => <ItemRenderer item={item} />, [ItemRenderer]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, theme.typography.h2]}>Etkinliklerim</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 0 }}
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const tabColor = tab.key === 'movie' ? theme.colors.secondary :
                            tab.key === 'music' ? theme.colors.accent :
                                tab.key === 'event' ? theme.colors.textSecondary :
                                    theme.colors.primary;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.tab,
                                    isActive && { backgroundColor: tabColor + '15', borderColor: tabColor },
                                    isActive && styles.tabActive
                                ]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Text style={{ fontSize: 16 }}>{tab.emoji}</Text>
                                <Text style={[styles.tabText, isActive && { color: tabColor }]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Search size={18} color={theme.colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text }]}
                        placeholder="Ara..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Stats Summary */}
            {stats && (
                <View style={styles.statsContainer}>
                    <View style={[styles.statsCard, {
                        backgroundColor: theme.colors.surface,
                        borderColor: getCategoryColor(activeTab) + '40'
                    }]}>
                        <Text style={[styles.statsTitle, { color: theme.colors.text }, theme.typography.h3]}>
                            Bu Yılki {TABS.find(t => t.key === activeTab)?.label || 'Etkinlik'} Özetin
                        </Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconContainer, { backgroundColor: getCategoryColor(activeTab) + '10' }]}>
                                    <Star size={18} color={getCategoryColor(activeTab)} fill={getCategoryColor(activeTab)} />
                                </View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                    {stats[activeTab]?.avg_rating > 0 ? stats[activeTab].avg_rating : '-'}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Ortalama</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '10' }]}>
                                    <BookOpen size={18} color={theme.colors.success} />
                                </View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                    {(stats[activeTab]?.counts?.read || 0) + (stats[activeTab]?.counts?.loved || 0)}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Bitti</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
                                    <Calendar size={18} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                    {stats[activeTab]?.counts?.reading || 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Devam</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '10' }]}>
                                    <Book size={18} color={theme.colors.warning} />
                                </View>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                    {stats[activeTab]?.counts?.want_to_read || 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Listem</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Status Filters */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 0 }}
                >
                    {getStatusFilters(activeTab).map((filter) => {
                        const isActive = statusFilter === filter.key;
                        const activeColor = getCategoryColor(activeTab);
                        return (
                            <TouchableOpacity
                                key={filter.key}
                                style={[
                                    styles.filterChip,
                                    isActive && { backgroundColor: activeColor + '15', borderColor: activeColor }
                                ]}
                                onPress={() => setStatusFilter(filter.key as any)}
                            >
                                <Text style={[styles.filterChipText, isActive && { color: activeColor }]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <TouchableOpacity style={styles.errorIcon} onPress={() => fetchLibrary()} activeOpacity={0.7}>
                        <AlertTriangle size={48} color={theme.colors.error} />
                    </TouchableOpacity>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchLibrary()} activeOpacity={0.7}>
                        <RefreshCw size={18} color="#FFFFFF" />
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
