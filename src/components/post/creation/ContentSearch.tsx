import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Search, XCircle, ChevronRight } from 'lucide-react-native';
import { googleBooksApi } from '../../../services/googleBooksApi';
import { tmdbApi } from '../../../services/tmdbApi';
import { spotifyService, ticketmasterService } from '../../../services/backendApi';
import { Card } from '../../ui/Card';
import { ensureHttps } from '../../../utils/urlUtils';

export type SearchType = 'book' | 'film' | 'music' | 'event' | 'concert' | 'theater';

interface ContentSearchProps {
    type: SearchType;
    onSelect: (item: any) => void;
    placeholder?: string;
    initialValue?: string;
}

export const ContentSearch: React.FC<ContentSearchProps> = ({ type, onSelect, placeholder, initialValue }) => {
    const { theme } = useTheme();
    const [query, setQuery] = useState(initialValue || '');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                performSearch(query);
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (text: string) => {
        setLoading(true);
        setShowResults(true);
        try {
            let data: any[] = [];
            switch (type) {
                case 'book':
                    data = await googleBooksApi.searchBooks(text);
                    break;
                case 'film':
                    data = await tmdbApi.searchMovies(text);
                    break;
                case 'music':
                    // Spotify returns tracks
                    data = await spotifyService.searchTracks(text);
                    break;
                case 'event':
                case 'concert':
                case 'theater':
                    // Ticketmaster returns events
                    const tmData = await ticketmasterService.searchEvents(text);
                    data = tmData._embedded?.events || [];
                    break;
            }
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        setQuery(getItemTitle(item));
        setShowResults(false);
        onSelect(item);
    };

    const getItemTitle = (item: any) => {
        if (!item) return '';
        switch (type) {
            case 'book': return item.volumeInfo?.title;
            case 'film': return item.title;
            case 'music': return `${item.name} - ${item.artists?.[0]?.name}`;
            case 'event':
            case 'concert':
            case 'theater': return item.name;
            default: return '';
        }
    };

    const getItemImage = (item: any) => {
        let url = null;
        switch (type) {
            case 'book':
                url = item.volumeInfo?.imageLinks?.thumbnail;
                break;
            case 'film':
                url = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null;
                break;
            case 'music':
                url = item.album?.images?.[0]?.url;
                break;
            case 'event':
            case 'concert':
            case 'theater':
                url = item.images?.[0]?.url;
                break;
        }
        return ensureHttps(url);
    };

    const getItemSubtitle = (item: any) => {
        switch (type) {
            case 'book': return item.volumeInfo?.authors?.join(', ');
            case 'film': return item.release_date?.split('-')[0];
            case 'music': return item.album?.name;
            case 'event':
            case 'concert':
            case 'theater': return item.dates?.start?.localDate;
            default: return '';
        }
    };

    return (
        <View style={{ zIndex: 1000 }}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }]}>
                <Search size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={placeholder || "Ara..."}
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[styles.input, { color: theme.colors.text }]}
                />
                {loading && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />}
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setShowResults(false); }}>
                        <XCircle size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {showResults && results.length > 0 && (
                <View style={[styles.resultsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: 240 }}
                        nestedScrollEnabled={true}
                    >
                        {results.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
                                onPress={() => handleSelect(item)}
                            >
                                <Image
                                    source={{ uri: getItemImage(item) || 'https://via.placeholder.com/60' }}
                                    style={styles.thumbnail}
                                    resizeMode="cover"
                                />
                                <View style={styles.textContainer}>
                                    <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                                        {getItemTitle(item)}
                                    </Text>
                                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                        {getItemSubtitle(item)}
                                    </Text>
                                </View>
                                <ChevronRight size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56, // Taller input
        borderRadius: 16,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
        fontFamily: 'Inter-Medium', // Assuming font exists or falls back
    },
    resultsContainer: {
        marginTop: 8,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
        zIndex: 2000,
        elevation: 0, // Remove elevation to avoid shadow artifacts in relative flow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 }, // Remove shadow for flat list feel
        shadowOpacity: 0,
        shadowRadius: 0,
    },
    resultItem: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 0.5,
    },
    thumbnail: {
        width: 48,
        height: 72, // Portrait aspect ratio for books/movies
        borderRadius: 6,
        marginRight: 12,
        backgroundColor: '#eee'
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
    },
});
