import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, RefreshControl, Platform, Linking, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Removed SimpleLineIcons import
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { tmdbApi } from '../../services/tmdbApi';
import { googleBooksApi } from '../../services/googleBooksApi';
import backendApi, { spotifyService, ticketmasterService, topicService, clickTrackingService } from '../../services/backendApi';
import { Search, ArrowUp, ArrowDown, Check } from 'lucide-react-native';
import { SectionHeader } from '../../components/SectionHeader';
import { HorizontalList } from '../../components/HorizontalList';
import { EventCard } from '../../components/EventCard';
import { theme } from '../../theme/theme';
import { SkeletonDiscovery } from '../../components/ui/SkeletonDiscovery';

// Responsive card dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOPIC_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.38);
const TOPIC_CARD_HEIGHT = Math.round(TOPIC_CARD_WIDTH * 0.48);

export const DiscoveryScreen = () => {
    // Helper for event images
    const getBestEventImage = (images: any[]) => {
        if (!images || images.length === 0) return null;

        // 1. Filter out fallback images (generic venue images) if possible
        const specificImages = images.filter(img => img.fallback === false);
        const candidateImages = specificImages.length > 0 ? specificImages : images;

        // 2. Prioritize 16_9 images (standard event cards)
        const wideImages = candidateImages.filter(img => img.ratio === '16_9');
        if (wideImages.length > 0) {
            return wideImages.sort((a, b) => b.width - a.width)[0].url;
        }

        // 3. Fallback: 4_3 or 3_2
        const standardImages = candidateImages.filter(img => img.ratio === '4_3' || img.ratio === '3_2');
        if (standardImages.length > 0) {
            return standardImages.sort((a, b) => b.width - a.width)[0].url;
        }

        // 4. Final fallback: just the largest image available
        return candidateImages.slice().sort((a, b) => b.width - a.width)[0].url;
    };

    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'movies' | 'books' | 'music' | 'events'>('dashboard');

    const [filterCity, setFilterCity] = useState<string | null>(null);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // Dashboard Data State
    interface DashboardData {
        movies: any[];
        music: any[];
        books: any[];
        events: any[];
        topics: any[];
    }

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        movies: [],
        music: [],
        books: [],
        events: [],
        topics: []
    });

    // Category Specific Data State (for grid views)
    const [categoryData, setCategoryData] = useState<any[]>([]);

    const { theme } = useTheme();
    const navigation = useNavigation();
    const chipsListRef = useRef<FlatList>(null);

    useEffect(() => {
        const index = chips.findIndex(c => c.id === activeTab);
        if (index !== -1 && chipsListRef.current) {
            // Basic wait to ensure layout is ready if switching quickly
            setTimeout(() => {
                chipsListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
            }, 100);
        }
    }, [activeTab]);

    // Trend kitaplar için günlük stabil sorgu seçici
    // Hem dashboard hem de kategori sayfasında aynısı kullanılmalı
    const getDailyBookQuery = () => {
        const queries = [
            'çok satanlar', 'roman', 'edebiyat', 'tarih', 'bilim kurgu',
            'kişisel gelişim', 'psikoloji', 'felsefe', 'şiir', 'biyografi',
            'klasikler', 'macera', 'polisiye', 'korku', 'fantastik',
            'nobel prize', 'booker prize', 'new york times bestseller',
            'subject:fiction', 'subject:history'
        ];
        const dayOfMonth = new Date().getDate();
        const index = dayOfMonth % queries.length;
        return queries[index];
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // 1. Trending Movies
            const moviesPromise = tmdbApi.getTrendingMovies().then(async (movies: any[]) => {
                const filteredMovies = movies.filter((movie: any) => !/[\u4e00-\u9fa5]/.test(movie.title));
                return filteredMovies.slice(0, 10).map((movie: any) => ({
                    id: movie.id.toString(),
                    title: movie.title,
                    type: 'movie',
                    image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                    subtitle: movie.release_date ? movie.release_date.split('-')[0] : ''
                }));
            }).catch(e => {
                console.error('Movies error', e);
                return [];
            });

            // 2. Trending Music (Search fallback)
            const musicPromise = spotifyService.searchTracks('year:2025 genre:pop').then((tracks: any[]) => {
                return (tracks || []).slice(0, 10).map((track: any) => ({
                    id: track.id,
                    title: track.title,
                    type: 'music',
                    image: track.image, // Ensure image is mapped correctly in searchTracks response
                    subtitle: track.artist
                }));
            }).catch(e => {
                console.error('Music error', e);
                return [];
            });

            // 3. Trend Kitaplar (Günlük Stabil Trend)
            const dailyQuery = getDailyBookQuery();

            const booksPromise = googleBooksApi.searchBooks(dailyQuery, {
                langRestrict: 'tr',
                orderBy: 'relevance',
                maxResults: 10,
                printType: 'books'
            }).then((books: any[]) => {
                return books.map((book: any) => ({
                    id: book.id,
                    title: book.volumeInfo.title,
                    type: 'book',
                    image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:'),
                    subtitle: book.volumeInfo.authors ? book.volumeInfo.authors[0] : (book.volumeInfo.publisher || '')
                }));
            }).catch(e => {
                console.error('Books error', e);
                return [];
            });



            // 4. Upcoming Events
            const eventsPromise = ticketmasterService.searchEvents('', 'Istanbul').then((data: any) => { // Defaulting to Istanbul for now
                if (data?._embedded?.events) {
                    return data._embedded.events.map((event: any) => ({
                        id: event.id,
                        title: event.name,
                        date: event.dates?.start?.localDate,
                        location: event._embedded?.venues ? event._embedded.venues[0].name : 'Unknown Location',
                        image: getBestEventImage(event.images),
                        type: 'event',
                        rawDate: event.dates?.start?.localDate,
                        city: event._embedded?.venues?.[0]?.city?.name, // Add city
                        url: event.url
                    }));
                }
                return [];
            }).catch(e => {
                console.error('Events error', e);
                return [];
            });

            // 5. Popular Topics
            const topicsPromise = topicService.getPopular()
                .then((topics: any[]) => topics || [])
                .catch(e => {
                    console.error('Topics error', e);
                    return [];
                });

            const [movies, music, books, events, topics] = await Promise.all([
                moviesPromise,
                musicPromise,
                booksPromise,
                eventsPromise,
                topicsPromise
            ]);

            setDashboardData({
                movies,
                music,
                books,
                events,
                topics
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCategoryData = async (category: string, searchQuery: string) => {
        setIsLoading(true);
        setCategoryData([]);
        // Reset filters when switching categories or searching
        if (!searchQuery && category === 'events') {
            // Keep current filter if just refining? Or reset? 
            // Let's NOT reset availableCities here to avoid flickering, but maybe reset filterCity if tab changed?
            // Actually, if we are fetching new data, we should probably reset availableCities unless we want to accumulate.
            // Let's reset availableCities only if we are doing a fresh category load, handled by setAvailableCities([]) below if needed.
        } else if (category !== 'events') {
            setFilterCity(null);
            setAvailableCities([]);
        }

        try {
            let data: any[] = [];

            if (category === 'movies') {
                let movies = searchQuery ? await tmdbApi.searchMovies(searchQuery) : await tmdbApi.getPopularMovies();
                const filteredMovies = movies.filter((movie: any) => !/[\u4e00-\u9fa5]/.test(movie.title));
                data = filteredMovies.map((movie: any) => ({
                    id: movie.id.toString(),
                    title: movie.title,
                    type: 'movie',
                    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                    subtitle: movie.release_date?.split('-')[0]
                }));
            } else if (category === 'books') {
                let books;
                if (searchQuery) {
                    books = await googleBooksApi.searchBooks(searchQuery, {
                        langRestrict: 'tr',
                        orderBy: 'relevance',
                        maxResults: 20,
                        printType: 'books'
                    });
                } else {
                    // Kategori sekmesinde de aynı "Günlük Trend" mantığını kullan
                    const dailyQuery = getDailyBookQuery();

                    books = await googleBooksApi.searchBooks(dailyQuery, {
                        langRestrict: 'tr',
                        orderBy: 'relevance',
                        maxResults: 20,
                        printType: 'books'
                    });
                }

                data = books.map((book: any) => ({
                    id: book.id,
                    title: book.volumeInfo.title,
                    type: 'book',
                    image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:'),
                    subtitle: book.volumeInfo.authors ? book.volumeInfo.authors[0] : (book.volumeInfo.publisher || '')
                }));
            } else if (category === 'music') {
                // If searching, searching tracks. If just category listing, maybe show top 50 full list?
                // Let's assume search behavior or just listing top 50 for now if no query
                if (searchQuery) {
                    const tracks = await spotifyService.searchTracks(searchQuery);
                    data = tracks.map((track: any) => ({
                        id: track.id,
                        title: track.title,
                        type: 'music',
                        image: track.image,
                        subtitle: track.artist
                    }));
                } else {
                    // Fallback to trending search if no query
                    const tracks = await spotifyService.searchTracks('year:2025 genre:pop');
                    data = (tracks || []).map((track: any) => ({
                        id: track.id,
                        title: track.title,
                        type: 'music',
                        image: track.image,
                        subtitle: track.artist
                    }));
                }
            } else if (category === 'events') {
                const events = await ticketmasterService.searchEvents(searchQuery, ''); // Search broadly (no city constraint)
                if (events?._embedded?.events) {
                    // Reusing logic: sort by width desc
                    data = events._embedded.events.map((event: any) => ({
                        id: event.id,
                        title: event.name,
                        date: event.dates?.start?.localDate,
                        location: event._embedded?.venues ? event._embedded.venues[0].name : 'Unknown Location',
                        image: getBestEventImage(event.images),
                        type: 'event',
                        rawDate: event.dates?.start?.localDate,
                        city: event._embedded?.venues?.[0]?.city?.name, // Add city
                        url: event.url
                    }));

                    // Extract unique cities
                    const cities = Array.from(new Set(data.map(item => item.city).filter(Boolean))).sort();
                    setAvailableCities(cities as string[]);
                }
            }

            setCategoryData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchDashboardData();
        } else {
            fetchCategoryData(activeTab, query);
        }
    }, [activeTab]);

    const handleSearch = () => {
        if (activeTab === 'dashboard') {
            // If on dashboard and searching, maybe switch to a "Results" tab or determine type?
            // For simplicity, let's switch to Movies as default or stay on dashboard but filter? 
            // Better UX: Switch to 'movies' generic search or show all? 
            // Let's switch to 'movies' as a fallback for now or maybe 'books' based on simple heuristic?
            // User requested redesign mainly for dashboard. 
            setActiveTab('movies'); // Simple transition
            fetchCategoryData('movies', query);
        } else {
            fetchCategoryData(activeTab, query);
        }
    };

    const handleItemPress = (item: any) => {
        // Track click for analytics
        if (item.type && item.id) {
            clickTrackingService.trackClick(item.type, item.id.toString(), item.title, 'discovery');
        }

        if (item.type === 'event') {
            // Navigate to event detail? Or maybe webview for ticketmaster?
            // For now just console log or basic alert if no detail screen exists
            if (item.url) {
                Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err));
            }
            return;
        }

        (navigation as any).navigate('ContentDetail', {
            id: item.id,
            type: item.type,
            initialData: {
                ...item,
                author: item.subtitle // Mapping subtitle back to author for detail screen compatibility
            }
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (activeTab === 'dashboard') fetchDashboardData();
        else fetchCategoryData(activeTab, query);
    };

    const chips = [
        { id: 'dashboard', label: 'Tümü' },
        { id: 'movies', label: 'Filmler' },
        { id: 'music', label: 'Müzik' },
        { id: 'books', label: 'Kitaplar' },
        { id: 'events', label: 'Etkinlikler' },
    ];

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.background,
            zIndex: 10,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            paddingHorizontal: 16,
            height: 52,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        searchIcon: {
            marginRight: 12,
        },
        searchInput: {
            flex: 1,
            fontSize: 15,
            color: theme.colors.text,
            height: '100%',
        },
        categoryContainer: {
            paddingVertical: 12,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            marginBottom: 8,
        },
        chip: {
            paddingHorizontal: 20,
            paddingVertical: 8,
            backgroundColor: theme.colors.background,
            borderRadius: 20,
            marginRight: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        activeChip: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        chipText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeChipText: {
            color: '#FFFFFF',
        },
        dashboardContent: {
            paddingBottom: 40,
        },
        gridList: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 100,
        },
        gridRow: {
            justifyContent: 'space-between',
        },
        gridCard: {
            width: '48%',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        gridImage: {
            width: '100%',
            height: 220,
        },
        gridInfo: {
            padding: 12,
        },
        gridTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 4,
        },
        gridSubtitle: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        topicGradientCard: {
            width: TOPIC_CARD_WIDTH,
            height: TOPIC_CARD_HEIGHT,
            borderRadius: 16,
            marginRight: 5,
            overflow: 'hidden',
            ...theme.shadows.soft,
        },
        topicContent: {
            flex: 1,
            paddingVertical: Platform.OS === 'ios' ? 14 : 16,
            paddingHorizontal: Math.round(SCREEN_WIDTH * 0.04),
            justifyContent: 'flex-start',
        },
        topicNameLight: {
            fontSize: Platform.OS === 'ios' ? 14 : 15,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 4,
            fontFamily: theme.fonts.main,
        },
        topicStatsLight: {
            fontSize: Platform.OS === 'ios' ? 10 : 11,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: theme.fonts.main,
        },
        topicCard: {
            // Deprecated
            width: 140,
            height: 100,
        },
        topicName: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
        },
        topicStats: {
            fontSize: 11,
            color: theme.colors.textSecondary,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
        },

        dropdownButton: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        dropdownButtonText: {
            fontSize: 14,
            color: theme.colors.text,
            fontWeight: '600',
        },
        dropdownList: {
            position: 'absolute',
            top: 50, // Height of button + minimal margin
            left: 16,
            right: 16,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
            zIndex: 1000, // Ensure it sits on top
            paddingVertical: 4,
        },
        dropdownItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: theme.colors.border,
        },
        dropdownItemText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        activeDropdownText: {
            color: theme.colors.primary,
            fontWeight: '700',
        }
    }), [theme]);



    const getTopicGradient = (index: number) => {
        const gradients = [
            ['#3D2817', '#8B7355'], // Primary -> Secondary
            ['#8B7355', '#D4C5B0'], // Secondary -> Accent
            ['#D4C5B0', '#3D2817'], // Accent -> Primary
            ['#3D2817', '#D4C5B0'], // Primary -> Accent
        ];
        return gradients[index % gradients.length];
    };

    const renderDashboard = () => (
        <ScrollView
            contentContainerStyle={styles.dashboardContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
            {/* 0. Popular Topics (Gradient Pills) */}
            <SectionHeader title="Trend Konular" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                {dashboardData.topics && dashboardData.topics.slice(0, 10).map((topic: any, index: number) => (
                    <TouchableOpacity
                        key={topic.id}
                        onPress={() => (navigation as any).navigate('TopicDetail', { topic })}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={getTopicGradient(index)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.topicGradientCard}
                        >
                            <View style={styles.topicContent}>
                                <Text style={styles.topicNameLight} numberOfLines={1} ellipsizeMode="tail">{topic.name}</Text>
                                <Text style={styles.topicStatsLight}>{topic.post_count} gönderi</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 1. Trend Filmler */}
            <SectionHeader title="Trend Filmler" onViewAll={() => setActiveTab('movies')} />
            <HorizontalList
                data={dashboardData.movies}
                onItemPress={handleItemPress}
                variant="portrait"
            />

            {/* 2. Trend Müzikler (Top 50) */}
            <SectionHeader title="Trend Müzikler" onViewAll={() => setActiveTab('music')} />
            <HorizontalList
                data={dashboardData.music}
                onItemPress={handleItemPress}
                variant="square"
            />

            {/* 3. Trend Kitaplar */}
            <SectionHeader title="Trend Kitaplar" onViewAll={() => setActiveTab('books')} />
            <HorizontalList
                data={dashboardData.books}
                onItemPress={handleItemPress}
                variant="portrait"
            />

            {/* 4. Yaklaşan Etkinlikler */}
            <SectionHeader title="Güncel Etkinlikler" onViewAll={() => setActiveTab('events')} />
            <View style={{ marginBottom: 20 }}>
                {dashboardData.events.length > 0 ? (
                    dashboardData.events.slice(0, 5).map((event: any) => (
                        <EventCard key={event.id} event={event} onPress={handleItemPress} />
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, padding: 20 }}>
                        Etkinlik bulunamadı.
                    </Text>
                )}
            </View>
        </ScrollView>
    );

    const renderCategoryContent = () => {
        // Filter content based on active filters
        const filteredData = activeTab === 'events' && filterCity
            ? categoryData.filter(item => item.city === filterCity)
            : categoryData;

        return (
            <View style={{ flex: 1 }}>
                {activeTab === 'events' && availableCities.length > 0 && (
                    <View style={{ paddingHorizontal: 16, marginBottom: 8, zIndex: 100 }}>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setDropdownVisible(!dropdownVisible)}
                        >
                            <Text style={styles.dropdownButtonText}>
                                {filterCity ? filterCity : 'Tüm Şehirler'}
                            </Text>
                            <ArrowDown size={16} color={theme.colors.text} />
                        </TouchableOpacity>

                        {dropdownVisible && (
                            <View style={styles.dropdownList}>
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setFilterCity(null);
                                        setDropdownVisible(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText, !filterCity && styles.activeDropdownText]}>Tüm Şehirler</Text>
                                    {!filterCity && <Check size={16} color={theme.colors.primary} />}
                                </TouchableOpacity>
                                {availableCities.map(city => (
                                    <TouchableOpacity
                                        key={city}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setFilterCity(city);
                                            setDropdownVisible(false);
                                        }}
                                    >
                                        <Text style={[styles.dropdownItemText, filterCity === city && styles.activeDropdownText]}>{city}</Text>
                                        {filterCity === city && <Check size={16} color={theme.colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                )
                }
                <FlatList
                    key={activeTab === 'events' ? 'list' : 'grid'} // Force re-render when switching structure
                    data={filteredData}
                    renderItem={({ item }) => (
                        item.type === 'event' ? (
                            <EventCard event={item} onPress={handleItemPress} />
                        ) : (
                            <TouchableOpacity style={styles.gridCard} onPress={() => handleItemPress(item)}>
                                <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
                                <View style={styles.gridInfo}>
                                    <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.gridSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    )}
                    keyExtractor={item => item.id}
                    numColumns={activeTab === 'events' ? 1 : 2}
                    columnWrapperStyle={activeTab === 'events' ? undefined : styles.gridRow}
                    contentContainerStyle={styles.gridList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                    ListEmptyComponent={
                        !isLoading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>Sonuç bulunamadı.</Text>
                            </View>
                        ) : null
                    }
                />
            </View >
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={18} color={theme.colors.primary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kitap, film, müzik veya etkinlik ara..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                    />
                </View>
            </View>

            <View style={{ height: 70 }}>
                <FlatList
                    ref={chipsListRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContainer}
                    data={chips}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.chip, activeChipFilter(item.id)]}
                            onPress={() => setActiveTab(item.id as any)}
                        >
                            <Text style={[styles.chipText, activeChipText(item.id)]}>{item.label}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item.id}
                    onScrollToIndexFailed={info => {
                        const wait = new Promise(resolve => setTimeout(() => resolve(true), 500));
                        wait.then(() => {
                            chipsListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                        });
                    }}
                />
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <SkeletonDiscovery />
                </View>
            ) : (
                activeTab === 'dashboard' ? renderDashboard() : renderCategoryContent()
            )}
        </View>
    );

    function activeChipFilter(id: string) {
        return activeTab === id ? styles.activeChip : {};
    }

    function activeChipText(id: string) {
        return activeTab === id ? styles.activeChipText : {};
    }
};
