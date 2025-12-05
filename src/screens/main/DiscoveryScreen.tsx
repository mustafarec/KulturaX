import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { tmdbApi } from '../../services/tmdbApi';
import { googleBooksApi } from '../../services/googleBooksApi';
import backendApi, { spotifyService, ticketmasterService } from '../../services/backendApi';
import { SectionHeader } from '../../components/SectionHeader';
import { HorizontalList } from '../../components/HorizontalList';
import { EventCard } from '../../components/EventCard';

export const DiscoveryScreen = () => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'movies' | 'books' | 'music' | 'events'>('dashboard');

    // Dashboard Data State
    interface DashboardData {
        movies: any[];
        music: any[];
        books: any[];
        events: any[];
    }

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        movies: [],
        music: [],
        books: [],
        events: []
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
            });

            // 3. Trending Books
            const booksPromise = googleBooksApi.searchBooks('subject:fiction', 'newest').then((books: any[]) => {
                return books.slice(0, 10).map((book: any) => ({
                    id: book.id,
                    title: book.volumeInfo.title,
                    type: 'book',
                    image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:'),
                    subtitle: book.volumeInfo.authors ? book.volumeInfo.authors[0] : ''
                }));
            });

            // 4. Upcoming Events
            const eventsPromise = ticketmasterService.searchEvents('', 'Istanbul').then((data: any) => { // Defaulting to Istanbul for now
                if (data?._embedded?.events) {
                    return data._embedded.events.map((event: any) => ({
                        id: event.id,
                        title: event.name,
                        date: event.dates?.start?.localDate,
                        location: event._embedded?.venues ? event._embedded.venues[0].name : 'Unknown Location',
                        image: event.images ? event.images.find((img: any) => img.ratio === '16_9' && img.width > 600)?.url || event.images[0].url : null,
                        type: 'event',
                        rawDate: event.dates?.start?.localDate
                    }));
                }
                return [];
            });

            const [movies, music, books, events] = await Promise.all([
                moviesPromise,
                musicPromise,
                booksPromise,
                eventsPromise
            ]);

            setDashboardData({
                movies,
                music,
                books,
                events
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
                let books = searchQuery ? await googleBooksApi.searchBooks(searchQuery) : await googleBooksApi.searchBooks('subject:fiction', 'newest');
                data = books.map((book: any) => ({
                    id: book.id,
                    title: book.volumeInfo.title,
                    type: 'book',
                    image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:'),
                    subtitle: book.volumeInfo.authors ? book.volumeInfo.authors[0] : ''
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
                const events = await ticketmasterService.searchEvents(searchQuery, 'Istanbul');
                if (events?._embedded?.events) {
                    data = events._embedded.events.map((event: any) => ({
                        id: event.id,
                        title: event.name,
                        date: event.dates?.start?.localDate,
                        location: event._embedded?.venues ? event._embedded.venues[0].name : 'Unknown Location',
                        image: event.images ? event.images.find((img: any) => img.ratio === '16_9' && img.width > 600)?.url || event.images[0].url : null,
                        type: 'event',
                        rawDate: event.dates?.start?.localDate
                    }));
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
        if (item.type === 'event') {
            // Navigate to event detail? Or maybe webview for ticketmaster?
            // For now just console log or basic alert if no detail screen exists
            console.log("Event pressed:", item.title);
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
            paddingTop: 40,
            paddingBottom: 10,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 24, // Softer roundness
            paddingHorizontal: 16,
            height: 48,
            borderWidth: 1,
            borderColor: 'transparent', // Cleaner look
        },
        searchIcon: {
            fontSize: 18,
            marginRight: 10,
            color: theme.colors.textSecondary,
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
            // shadowColor: theme.shadows.default.shadowColor,
            // shadowOffset: { width: 0, height: 2 },
            // shadowOpacity: 0.05,
            // shadowRadius: 4,
            // elevation: 2,
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
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
        }
    }), [theme]);

    const renderDashboard = () => (
        <ScrollView
            contentContainerStyle={styles.dashboardContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
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
            <SectionHeader title="Yaklaşan Etkinlikler" onViewAll={() => setActiveTab('events')} />
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

    const renderCategoryContent = () => (
        <FlatList
            key={activeTab === 'events' ? 'list' : 'grid'} // Force re-render when switching structure
            data={categoryData}
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
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Ara..."
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
                    <ActivityIndicator size="large" color={theme.colors.primary} />
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
