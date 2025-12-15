import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { QuoteCard } from '../../components/QuoteCard';
import { postService, libraryService, spotifyService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { googleBooksApi } from '../../services/googleBooksApi';
import { tmdbApi } from '../../services/tmdbApi';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const CreateQuoteScreen = () => {
    const route = useRoute<any>();
    const originalPost = route.params?.originalPost;
    const mode = route.params?.mode || 'quote'; // 'quote' | 'thought'
    const initialText = route.params?.initialText || '';
    const initialSource = route.params?.initialSource || '';
    const initialAuthor = route.params?.initialAuthor || '';
    const initialImage = route.params?.initialImage || undefined;
    const initialType = route.params?.initialType || null;
    const initialId = route.params?.initialId || null;

    const [quoteText, setQuoteText] = useState(initialText);
    const [comment, setComment] = useState('');
    const [source, setSource] = useState(initialSource);
    const [author, setAuthor] = useState(initialAuthor);
    const [selectedImage, setSelectedImage] = useState<string | undefined>(initialImage);
    const [selectedType, setSelectedType] = useState<'book' | 'movie' | 'music' | null>(initialType);
    const [selectedId, setSelectedId] = useState<string | null>(initialId);
    const [status, setStatus] = useState<string | null>(null);

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const viewShotRef = useRef<any>(null);
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();

    // Theme check
    const isDark = theme.dark;

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingBottom: 16,
            backgroundColor: theme.colors.background,
            zIndex: 10,
        },
        closeButton: {
            padding: 8,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        },
        headerTitle: {
            fontSize: 17,
            fontWeight: '600',
            color: theme.colors.text,
            letterSpacing: -0.5,
        },
        shareButton: {
            backgroundColor: theme.colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 24,
            elevation: 4,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
        },
        shareButtonText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: 14,
        },
        content: {
            padding: 24,
            gap: 24,
        },
        mainCardContainer: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        section: {
            gap: 12,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginLeft: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        cleanInputContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 16,
            ...theme.shadows.soft,
        },
        cleanInput: {
            fontSize: 16,
            color: theme.colors.text,
            minHeight: 120,
            textAlignVertical: 'top',
        },
        singleInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 56,
            ...theme.shadows.soft,
        },
        singleInput: {
            flex: 1,
            fontSize: 15,
            color: theme.colors.text,
            marginLeft: 12,
        },
        dropdown: {
            position: 'absolute',
            top: 70, // Below source input
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            ...theme.shadows.soft,
            zIndex: 100,
            maxHeight: 240,
        },
        originalPostContainer: {
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 12,
            overflow: 'hidden',
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: theme.colors.border,
        },
        dropdownImage: {
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: theme.colors.border,
            marginRight: 12,
        },
        statusScroll: {
            paddingLeft: 4,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginRight: 8,
        },
        chipActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        chipText: {
            fontSize: 13,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        chipTextActive: {
            color: '#fff',
        },
    }), [theme]);

    const handleSearchSource = async (query: string) => {
        setSource(query);
        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            // 1. Kitap, Film, Kişi ve Müzik araması yap
            const [books, movies, people, tracks] = await Promise.all([
                googleBooksApi.searchBooks(query),
                tmdbApi.searchMovies(query),
                tmdbApi.searchPerson(query),
                spotifyService.searchTracks(query)
            ]);

            let allResults: any[] = [];

            // 2. Kişi sonuçlarını işle (Yönetmen/Oyuncu)
            if (people && people.length > 0) {
                const person = people[0]; // En iyi eşleşen kişiyi al
                const credits = await tmdbApi.getPersonCredits(person.id);

                // Kişinin filmlerini formatla
                const personMovies = credits.slice(0, 10).map((movie: any) => ({
                    id: movie.id.toString(),
                    title: movie.title,
                    subtitle: `Film (${movie.release_date ? new Date(movie.release_date).getFullYear() : 'Tarih Yok'}) • ${person.name}`,
                    type: 'movie',
                    author: person.name, // Yazar/Yönetmen kısmına aranan kişiyi koyuyoruz
                    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined
                }));
                allResults = [...allResults, ...personMovies];
            }

            // 3. Normal film sonuçlarını formatla
            const formattedMovies = movies.slice(0, 5).map((movie: any) => ({
                id: movie.id.toString(),
                title: movie.title,
                subtitle: `Film (${movie.release_date ? new Date(movie.release_date).getFullYear() : 'Tarih Yok'})`,
                type: 'movie',
                author: 'Film',
                image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined
            }));

            // 4. Kitap sonuçlarını formatla
            const formattedBooks = books.slice(0, 5).map((book: any) => ({
                id: book.id,
                title: book.volumeInfo.title,
                subtitle: book.volumeInfo.authors?.join(', ') || 'Kitap',
                type: 'book',
                author: book.volumeInfo.authors?.[0] || '',
                image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:')
            }));

            // 5. Müzik sonuçlarını formatla
            const formattedTracks = tracks.map((track: any) => ({
                id: track.id,
                title: track.title,
                subtitle: `Müzik • ${track.artist}`,
                type: 'music',
                author: track.artist,
                image: track.image
            }));

            // 6. Hepsini birleştir ve ID'ye göre tekrar edenleri kaldır
            allResults = [...allResults, ...formattedMovies, ...formattedBooks, ...formattedTracks];

            const uniqueResults = Array.from(new Map(allResults.map(item => [item.id + item.type, item])).values());

            setSearchResults(uniqueResults);
            setShowResults(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSource = async (item: any) => {
        setSource(item.title);

        // Set initial author (might be 'Film' for movies found via general search)
        if (item.author) {
            setAuthor(item.author);
        }

        if (item.image) {
            setSelectedImage(item.image);
        }
        setSelectedType(item.type);
        setSelectedId(item.id);
        setShowResults(false);
        setStatus(null);

        // If it's a movie and we don't have a specific author (it's just 'Film'), try to fetch the director
        if (item.type === 'movie' && item.author === 'Film') {
            try {
                const credits = await tmdbApi.getMovieCredits(item.id);
                if (credits && credits.crew) {
                    const director = credits.crew.find((person: any) => person.job === 'Director');
                    if (director) {
                        setAuthor(director.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching director:', error);
            }
        }
    };

    const handleShare = async () => {
        if (!quoteText && !originalPost && mode !== 'thought') {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir alıntı yazın.' });
            return;
        }

        if (!originalPost && mode !== 'thought' && (!source)) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen kaynak belirtin.' });
            return;
        }

        setIsSharing(true);
        try {
            if (user) {
                if (originalPost) {
                    await postService.create(
                        user.id,
                        '', // Quote is empty for reposts
                        comment || '', // Comment
                        'Paylaşım',
                        originalPost.user.username,
                        originalPost.id
                    );
                } else {
                    // Thought mode defaults
                    const finalSource = mode === 'thought' ? 'Düşünce' : source;
                    const finalAuthor = mode === 'thought' ? user.username : author;

                    // Thought mode: quote is empty, text goes to comment
                    // Quote mode: quote is quoteText, comment is comment
                    const quotePayload = mode === 'thought' ? '' : (quoteText || '');
                    const commentPayload = mode === 'thought' ? (quoteText || '') : (comment || '');

                    console.log('DEBUG: handleShare', {
                        selectedType,
                        initialType,
                        finalSource,
                        finalAuthor,
                        quotePayload,
                        commentPayload
                    });

                    await postService.create(
                        user.id,
                        quotePayload,
                        commentPayload,
                        finalSource,
                        finalAuthor,
                        undefined,
                        selectedType || initialType || undefined,
                        selectedId || initialId || undefined,
                        selectedImage || initialImage // Use the cover image directly
                    );

                    // Update library status if selected
                    if (status && selectedType && selectedId) {
                        await libraryService.updateStatus(user.id, selectedType, selectedId, status);
                    }
                }

                Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Paylaşıldı!' });
                navigation.goBack();
            } else {
                Toast.show({ type: 'error', text1: 'Hata', text2: 'Oturum açmanız gerekiyor.' });
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Paylaşılamadı.' });
        } finally {
            setIsSharing(false);
        }
    };

    const getStatusOptions = () => {
        const opts = {
            book: [
                { label: 'Okudum', value: 'read', icon: 'checkmark-circle-outline' },
                { label: 'Okuyorum', value: 'reading', icon: 'glasses-outline' },
                { label: 'İstek', value: 'want_to_read', icon: 'bookmark-outline' },
                { label: 'Yarım', value: 'dropped', icon: 'close-circle-outline' },
            ],
            movie: [
                { label: 'İzledim', value: 'read', icon: 'checkmark-circle-outline' },
                { label: 'İzliyorum', value: 'reading', icon: 'glasses-outline' },
                { label: 'İstek', value: 'want_to_read', icon: 'bookmark-outline' },
                { label: 'Yarım', value: 'dropped', icon: 'close-circle-outline' },
            ],
            music: [
                { label: 'Dinledim', value: 'read', icon: 'musical-notes-outline' },
                { label: 'Dinliyorum', value: 'reading', icon: 'headset-outline' },
                { label: 'İstek', value: 'want_to_read', icon: 'bookmark-outline' },
                { label: 'Yarım', value: 'dropped', icon: 'close-circle-outline' },
            ]
        };
        return selectedType ? (opts as any)[selectedType] || [] : [];
    };

    return (
        <View style={styles.container}>
            {/* Minimal Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {originalPost ? 'Alıntıyı Paylaş' : (mode === 'thought' ? 'Düşünceni Paylaş' : 'Yeni Paylaşım')}
                </Text>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={isSharing}>
                    {isSharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.shareButtonText}>Paylaş</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* 1. Preview Card Area */}
                    <View style={styles.mainCardContainer}>
                        {/* TODO: If originalPost, render repost preview here cleanly */}
                        {originalPost ? (
                            <View style={[styles.cleanInputContainer, { width: '100%', padding: 0, overflow: 'hidden' }]}>
                                <View style={styles.originalPostContainer}>
                                    {/* Simplified Original Post Display for Preview */}
                                    <Text style={{ padding: 16, color: theme.colors.textSecondary }}>Alıntılanan içerik...</Text>
                                    {/* In a real scenario, reuse PostCard logic or extract a component */}
                                </View>
                            </View>
                        ) : (
                            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                                <QuoteCard
                                    text={quoteText || (mode === 'thought' ? 'Aklından geçenler...' : 'Alıntı metni...')}
                                    source={source || (mode === 'thought' ? 'Düşünce' : 'Kaynak')}
                                    author={author || user?.username}
                                    imageUrl={selectedImage}
                                    variant="default" // Use default for big impact
                                    status={status === 'reading' ? 'Okuyor' : undefined}
                                />
                            </ViewShot>
                        )}
                    </View>

                    {/* 2. Form Inputs */}
                    <View style={styles.section}>
                        {/* Main Text Input */}
                        {!originalPost && (
                            <View style={styles.cleanInputContainer}>
                                <TextInput
                                    style={styles.cleanInput}
                                    placeholder={mode === 'thought' ? "Ne düşünüyorsun?" : "Alıntıyı buraya yaz..."}
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={quoteText}
                                    onChangeText={setQuoteText}
                                    multiline
                                    autoFocus={mode === 'thought'}
                                />
                            </View>
                        )}

                        {/* Extra Comment for Quote Mode */}
                        {(mode === 'quote' || originalPost) && (
                            <View style={styles.cleanInputContainer}>
                                <TextInput
                                    style={[styles.cleanInput, { minHeight: 80 }]}
                                    placeholder="Bu konuda eklemek istediklerin..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                />
                            </View>
                        )}
                    </View>

                    {/* 3. Metadata Inputs (Source/Author) - Only for Quotes/Reviews */}
                    {!originalPost && mode !== 'thought' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Detaylar</Text>

                            {/* Source Search */}
                            <View style={{ zIndex: 200 }}>
                                <View style={styles.singleInputContainer}>
                                    <Icon name="magnifier" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={styles.singleInput}
                                        placeholder="Kitap, Film veya Müzik Ara..."
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={source}
                                        onChangeText={handleSearchSource}
                                    />
                                    {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} />}
                                </View>

                                {showResults && searchResults.length > 0 && (
                                    <View style={styles.dropdown}>
                                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                                            {searchResults.map((item) => (
                                                <TouchableOpacity key={item.id + item.type} style={styles.dropdownItem} onPress={() => selectSource(item)}>
                                                    {item.image ? (
                                                        <Image source={{ uri: item.image }} style={styles.dropdownImage} />
                                                    ) : (
                                                        <View style={[styles.dropdownImage, { alignItems: 'center', justifyContent: 'center' }]}>
                                                            <Icon name="doc" size={20} color={theme.colors.textSecondary} />
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ color: theme.colors.text, fontWeight: '600' }} numberOfLines={1}>{item.title}</Text>
                                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{item.subtitle}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Author Input */}
                            <View style={styles.singleInputContainer}>
                                <Icon name="user" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                <TextInput
                                    style={styles.singleInput}
                                    placeholder="Yazar / Yönetmen / Sanatçı"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={author}
                                    onChangeText={setAuthor}
                                />
                            </View>

                            {/* Status Chips */}
                            {selectedType && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
                                    {getStatusOptions().map((opt: any) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[styles.chip, status === opt.value && styles.chipActive]}
                                            onPress={() => setStatus(status === opt.value ? null : opt.value)}
                                        >
                                            <Ionicons name={opt.icon} size={16} color={status === opt.value ? '#fff' : theme.colors.textSecondary} style={{ marginRight: 6 }} />
                                            <Text style={[styles.chipText, status === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};
