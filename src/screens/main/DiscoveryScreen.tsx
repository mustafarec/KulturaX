import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { tmdbApi } from '../../services/tmdbApi';
import { googleBooksApi } from '../../services/googleBooksApi';
import backendApi, { spotifyService } from '../../services/backendApi';

export const DiscoveryScreen = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'trending' | 'movies' | 'books' | 'music'>('trending');
    const { theme } = useTheme();
    const navigation = useNavigation();

    const fetchData = async (tab: string, searchQuery: string) => {
        setIsLoading(true);
        setResults([]);
        try {
            let data: any[] = [];

            if (tab === 'trending') {
                const movies = await tmdbApi.getTrendingMovies();

                // Filter out movies with Chinese characters in title
                const filteredMovies = movies.filter((movie: any) => !/[\u4e00-\u9fa5]/.test(movie.title));

                // Fetch directors for movies in parallel
                const moviesWithDirectors = await Promise.all(filteredMovies.map(async (movie: any) => {
                    let director = '';
                    try {
                        const credits = await tmdbApi.getMovieCredits(movie.id);
                        const directorInfo = credits?.crew?.find((person: any) => person.job === 'Director');
                        director = directorInfo ? directorInfo.name : '';
                    } catch (e) {
                        console.log('Error fetching director for movie', movie.id);
                    }

                    return {
                        id: movie.id.toString(),
                        title: movie.title,
                        type: 'Film',
                        image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                        overview: movie.overview,
                        author: director
                    };
                }));

                data = moviesWithDirectors;
            } else if (tab === 'movies') {
                let movies = [];
                if (searchQuery) {
                    movies = await tmdbApi.searchMovies(searchQuery);
                } else {
                    movies = await tmdbApi.getPopularMovies();
                }

                // Filter out movies with Chinese characters in title
                const filteredMovies = movies.filter((movie: any) => !/[\u4e00-\u9fa5]/.test(movie.title));

                // Fetch directors for movies in parallel
                const moviesWithDirectors = await Promise.all(filteredMovies.map(async (movie: any) => {
                    let director = '';
                    try {
                        const credits = await tmdbApi.getMovieCredits(movie.id);
                        const directorInfo = credits?.crew?.find((person: any) => person.job === 'Director');
                        director = directorInfo ? directorInfo.name : '';
                    } catch (e) {
                        console.log('Error fetching director for movie', movie.id);
                    }

                    return {
                        id: movie.id.toString(),
                        title: movie.title,
                        type: 'Film',
                        image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                        overview: movie.overview,
                        author: director
                    };
                }));

                data = moviesWithDirectors;
            } else if (tab === 'books') {
                let books = [];
                if (searchQuery) {
                    books = await googleBooksApi.searchBooks(searchQuery);
                } else {
                    books = await googleBooksApi.searchBooks('subject:fiction', 'newest');
                }

                data = books.map((book: any) => ({
                    id: book.id,
                    title: book.volumeInfo.title,
                    type: 'Kitap',
                    image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:'),
                    author: book.volumeInfo.authors?.join(', '),
                    description: book.volumeInfo.description
                }));
            } else if (tab === 'music') {
                let tracks = [];
                // Default search if query is empty, e.g., 'Top 50' or a popular artist
                const query = searchQuery || 'pop';
                tracks = await spotifyService.searchTracks(query);

                data = tracks.map((track: any) => ({
                    id: track.id,
                    title: track.title,
                    type: 'Müzik',
                    image: track.image,
                    author: track.artist,
                    description: track.album
                }));
            }

            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab, query);
    }, [activeTab]);

    const handleSearch = () => {
        if (!query.trim()) {
            fetchData(activeTab, '');
            return;
        }

        if (activeTab === 'trending') {
            setActiveTab('movies');
        } else {
            fetchData(activeTab, query);
        }
    };

    const handleItemPress = (item: any) => {
        let type = '';
        if (item.type === 'Kitap') type = 'book';
        else if (item.type === 'Film') type = 'movie';
        else if (item.type === 'Müzik') type = 'music';

        if (type) {
            (navigation as any).navigate('ContentDetail', { id: item.id, type, initialData: item });
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background, // Was #F8F9FA
        },
        header: {
            paddingTop: 40,
            paddingBottom: 10,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.background, // Was #FFFFFF
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border, // Was rgba(0,0,0,0.05)
        },
        headerTitle: {
            fontSize: 32,
            fontWeight: '800',
            color: theme.colors.text, // Was #1A1A1A
            marginBottom: 16,
            letterSpacing: -0.5,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface, // Was #F8F9FA
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 50,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        searchIcon: {
            fontSize: 18,
            marginRight: 10,
            opacity: 0.5,
            color: theme.colors.textSecondary,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            color: theme.colors.text, // Was #2C3E50
            height: '100%',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            flex: 1,
        },
        tabs: {
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.colors.background, // Was #fff
            marginBottom: 8,
        },
        tab: {
            marginRight: 24,
            paddingBottom: 8,
        },
        activeTab: {
            borderBottomWidth: 3,
            borderBottomColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 16,
            color: theme.colors.textSecondary, // Was #95A5A6
            fontWeight: '600',
        },
        activeTabText: {
            color: theme.colors.text, // Was #2C3E50
            fontWeight: '700',
        },
        list: {
            paddingHorizontal: 16,
            paddingBottom: 120,
            paddingTop: 8,
        },
        row: {
            justifyContent: 'space-between',
        },
        card: {
            width: '48%',
            backgroundColor: theme.colors.surface, // Was #FFFFFF
            borderRadius: 16,
            marginBottom: 16,
            shadowColor: theme.shadows.default.shadowColor, // Was #000
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        imageContainer: {
            height: 220,
            width: '100%',
            backgroundColor: theme.colors.background, // Was #F0F2F5
        },
        cardImage: {
            height: '100%',
            width: '100%',
        },
        placeholderImage: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholderText: {
            fontSize: 40,
            fontWeight: 'bold',
            color: theme.colors.textSecondary, // Was #BDC3C7
        },
        typeTag: {
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
        },
        typeText: {
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        cardInfo: {
            padding: 12,
        },
        cardTitle: {
            fontWeight: '700',
            color: theme.colors.text, // Was #2C3E50
            fontSize: 14,
            marginBottom: 4,
            lineHeight: 20,
        },
        cardSubtitle: {
            fontSize: 12,
            color: theme.colors.textSecondary, // Was #95A5A6
            fontWeight: '500',
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
            color: theme.colors.text, // Was #2C3E50
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 15,
            color: theme.colors.textSecondary, // Was #95A5A6
        },
    }), [theme]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.cardImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>{item.title?.charAt(0)}</Text>
                    </View>
                )}
                <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{item.type}</Text>
                </View>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.author ? <Text style={styles.cardSubtitle} numberOfLines={1}>{item.author}</Text> : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Keşfet</Text>
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kitap veya film ara..."
                        placeholderTextColor="#95A5A6"
                        value={query}
                        onChangeText={(text) => {
                            setQuery(text);
                            if (!text) fetchData(activeTab, '');
                        }}
                        onSubmitEditing={handleSearch}
                    />
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    onPress={() => setActiveTab('trending')}
                    style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>Trendler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('movies')}
                    style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>Film</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('books')}
                    style={[styles.tab, activeTab === 'books' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'books' && styles.activeTabText]}>Kitap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('music')}
                    style={[styles.tab, activeTab === 'music' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'music' && styles.activeTabText]}>Müzik</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <View style={styles.content}>
                    <FlatList
                        data={results}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🔍</Text>
                                <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
                                <Text style={styles.emptyText}>Farklı bir arama yapmayı deneyin.</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
};


