import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, FlatList } from 'react-native';
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
            paddingTop: 60,
            paddingBottom: 20,
            backgroundColor: theme.colors.surface, // Was glass
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border, // Was glassBorder
        },
        closeButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        shareButton: {
            backgroundColor: theme.colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            ...theme.shadows.soft,
        },
        shareButtonText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 14,
        },
        content: {
            padding: 20,
        },
        previewContainer: {
            marginBottom: 24,
            ...theme.shadows.soft,
        },
        form: {
            gap: 16,
        },
        input: {
            backgroundColor: theme.colors.surface, // Was glass
            color: theme.colors.text,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
            fontSize: 16,
        },
        textArea: {
            minHeight: 100,
            textAlignVertical: 'top',
        },
        commentInput: {
            minHeight: 60,
            marginBottom: 16,
        },
        sourceInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface, // Was glass
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
            paddingHorizontal: 16,
            zIndex: 10,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface, // Was glass
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
            paddingHorizontal: 16,
        },
        inputIcon: {
            marginRight: 12,
        },
        sourceInput: {
            flex: 1,
            paddingVertical: 16,
            color: theme.colors.text,
            fontSize: 15,
        },
        dropdown: {
            position: 'absolute',
            top: 200, // Adjust based on layout
            left: 20,
            right: 20,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
            zIndex: 100,
            maxHeight: 250,
            overflow: 'hidden',
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        dropdownImage: {
            width: 40,
            height: 60,
            borderRadius: 4,
            marginRight: 12,
        },
        dropdownImagePlaceholder: {
            width: 40,
            height: 60,
            borderRadius: 4,
            marginRight: 12,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        dropdownTitle: {
            color: theme.colors.text,
            fontWeight: 'bold',
            fontSize: 14,
            marginBottom: 2,
        },
        dropdownSubtitle: {
            color: theme.colors.textSecondary,
            fontSize: 12,
        },
        quotePreview: {
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 12,
        },
        previewText: {
            fontSize: 16,
            color: theme.colors.text,
            marginBottom: 12,
        },
        originalPostContainer: {
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            overflow: 'hidden',
        },
        statusContainer: {
            marginTop: 8,
        },
        statusLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginBottom: 12,
            marginLeft: 4,
        },
        statusScroll: {
            flexDirection: 'row',
        },
        statusButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: theme.colors.surface, // Was glass
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
            marginRight: 10,
        },
        activeStatusButton: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        statusButtonText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeStatusButtonText: {
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
        if (selectedType === 'book') {
            return [
                { label: 'Okudum', value: 'read', icon: 'check' },
                { label: 'Okuyorum', value: 'reading', icon: 'eyeglass' },
                { label: 'Okuyacağım', value: 'want_to_read', icon: 'clock' },
                { label: 'Yarım Bıraktım', value: 'dropped', icon: 'close' },
            ];
        } else if (selectedType === 'movie') {
            return [
                { label: 'İzledim', value: 'read', icon: 'check' }, // 'read' maps to 'watched' in backend logic usually, or keep consistent enum
                { label: 'İzliyorum', value: 'reading', icon: 'eyeglass' },
                { label: 'İzleyeceğim', value: 'want_to_read', icon: 'clock' },
                { label: 'Yarım Bıraktım', value: 'dropped', icon: 'close' },
            ];
        }
        else if (selectedType === 'music') {
            return [
                { label: 'Dinledim', value: 'read', icon: 'check' },
                { label: 'Dinliyorum', value: 'reading', icon: 'volume-2' },
                { label: 'Dinleyeceğim', value: 'want_to_read', icon: 'clock' },
                { label: 'Yarım Bıraktım', value: 'dropped', icon: 'close' },
            ];
        }
        return [];
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Icon name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {originalPost ? 'Alıntıla' : (mode === 'thought' ? 'Düşünceni Paylaş' : 'Yeni Alıntı')}
                </Text>
                <TouchableOpacity
                    style={[styles.shareButton, isSharing && { opacity: 0.7 }]}
                    onPress={handleShare}
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.shareButtonText}>Paylaş</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Comment Input - Always visible if it's a quote or repost */}
                {(mode === 'quote' || originalPost) && (
                    <TextInput
                        style={[styles.input, styles.commentInput]}
                        placeholder="Bu alıntı hakkında ne düşünüyorsunuz?"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                    />
                )}

                <View style={styles.previewContainer}>
                    {originalPost ? (
                        <View style={styles.quotePreview}>
                            <View style={styles.originalPostContainer}>
                                <QuoteCard
                                    text={originalPost.content}
                                    source={originalPost.source}
                                    author={originalPost.author !== originalPost.user.username ? originalPost.author : undefined}
                                    variant="compact"
                                />
                            </View>
                        </View>
                    ) : (
                        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                            <QuoteCard
                                text={quoteText || (mode === 'thought' ? 'Düşünceniz...' : 'Alıntınız buraya gelecek...')}
                                source={source || 'Kaynak'}
                                author={author}
                                imageUrl={selectedImage}
                            />
                        </ViewShot>
                    )}
                </View>

                <View style={styles.form}>
                    {/* Quote Text Input - Only for new quotes/thoughts */}
                    {!originalPost && (
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={mode === 'thought' ? "Aklınızdan geçenleri yazın..." : "Alıntı metnini giriniz..."}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={quoteText}
                            onChangeText={setQuoteText}
                            multiline
                            autoFocus={!originalPost && mode === 'thought'}
                        />
                    )}

                    {!originalPost && mode !== 'thought' && (
                        <>
                            <View style={styles.sourceInputContainer}>
                                <Icon name="magnifier" size={18} color={theme.colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.sourceInput}
                                    placeholder="Kitap, Film veya Müzik Ara..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={source}
                                    onChangeText={handleSearchSource}
                                />
                                {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 10 }} />}
                            </View>

                            {showResults && searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                                        {searchResults.map((item) => (
                                            <TouchableOpacity
                                                key={item.id + item.type}
                                                style={styles.dropdownItem}
                                                onPress={() => selectSource(item)}
                                            >
                                                {item.image ? (
                                                    <Image source={{ uri: item.image }} style={styles.dropdownImage} />
                                                ) : (
                                                    <View style={styles.dropdownImagePlaceholder}>
                                                        <Icon name={item.type === 'book' ? 'book-open' : (item.type === 'music' ? 'music-tone-alt' : 'camrecorder')} size={20} color="#fff" />
                                                    </View>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.dropdownTitle}>{item.title}</Text>
                                                    <Text style={styles.dropdownSubtitle}>{item.subtitle}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                <Icon name="user" size={18} color={theme.colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.sourceInput}
                                    placeholder="Yazar / Yönetmen"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={author}
                                    onChangeText={setAuthor}
                                />
                            </View>

                            {selectedType && (
                                <View style={styles.statusContainer}>
                                    <Text style={styles.statusLabel}>
                                        {selectedType === 'book' ? 'Bu kitabı ne yaptın?' : (selectedType === 'music' ? 'Bu şarkıyı ne yaptın?' : 'Bu filmi ne yaptın?')}
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
                                        {getStatusOptions().map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                    styles.statusButton,
                                                    status === option.value && styles.activeStatusButton
                                                ]}
                                                onPress={() => setStatus(option.value === status ? null : option.value)}
                                            >
                                                <Icon
                                                    name={option.icon}
                                                    size={14}
                                                    color={status === option.value ? '#fff' : theme.colors.textSecondary}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={[
                                                    styles.statusButtonText,
                                                    status === option.value && styles.activeStatusButtonText
                                                ]}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};
