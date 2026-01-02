import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { QuoteCard } from '../../components/QuoteCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { postService, libraryService, spotifyService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { googleBooksApi } from '../../services/googleBooksApi';
import { tmdbApi } from '../../services/tmdbApi';
import { X, Tag, XCircle, Search, User, FileText } from 'lucide-react-native';
import { TopicSelectionModal } from '../../components/TopicSelectionModal';

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
    const [selectedTopic, setSelectedTopic] = useState<any>(null);
    const [topicModalVisible, setTopicModalVisible] = useState(false);

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const viewShotRef = useRef<any>(null);
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const isDark = theme.dark;

    const handleSearchSource = async (query: string) => {
        setSource(query);
        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const [books, movies, people, tracks] = await Promise.all([
                googleBooksApi.searchBooks(query),
                tmdbApi.searchMovies(query),
                tmdbApi.searchPerson(query),
                spotifyService.searchTracks(query)
            ]);

            let allResults: any[] = [];

            if (people && people.length > 0) {
                const person = people[0];
                const credits = await tmdbApi.getPersonCredits(person.id);
                const personMovies = credits.slice(0, 10).map((movie: any) => ({
                    id: movie.id.toString(),
                    title: movie.title,
                    subtitle: `Film (${movie.release_date ? new Date(movie.release_date).getFullYear() : '?'}) • ${person.name}`,
                    type: 'movie',
                    author: person.name,
                    image: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : undefined
                }));
                allResults = [...allResults, ...personMovies];
            }

            const formattedMovies = movies.slice(0, 5).map((movie: any) => ({
                id: movie.id.toString(),
                title: movie.title,
                subtitle: `Film (${movie.release_date ? new Date(movie.release_date).getFullYear() : '?'})`,
                type: 'movie',
                author: 'Film',
                image: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : undefined
            }));

            const formattedBooks = books.slice(0, 5).map((book: any) => ({
                id: book.id,
                title: book.volumeInfo.title,
                subtitle: book.volumeInfo.authors?.join(', ') || 'Kitap',
                type: 'book',
                author: book.volumeInfo.authors?.[0] || '',
                image: book.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:')
            }));

            const formattedTracks = tracks.map((track: any) => ({
                id: track.id,
                title: track.title,
                subtitle: `Müzik • ${track.artist}`,
                type: 'music',
                author: track.artist,
                image: track.image
            }));

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
        if (item.author) setAuthor(item.author);
        if (item.image) setSelectedImage(item.image);
        setSelectedType(item.type);
        setSelectedId(item.id);
        setShowResults(false);
        setStatus(null);

        if (item.type === 'movie' && item.author === 'Film') {
            try {
                const credits = await tmdbApi.getMovieCredits(item.id);
                if (credits && credits.crew) {
                    const director = credits.crew.find((person: any) => person.job === 'Director');
                    if (director) setAuthor(director.name);
                }
            } catch (error) {
                console.error(error);
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
                    await postService.create(user.id, '', comment || '', 'Paylaşım', originalPost.user.username, originalPost.id);
                } else {
                    const finalSource = mode === 'thought' ? 'Düşünce' : source;
                    const finalAuthor = mode === 'thought' ? user.username : author;
                    const quotePayload = mode === 'thought' ? '' : (quoteText || '');
                    const commentPayload = mode === 'thought' ? (quoteText || '') : (comment || '');

                    await postService.create(
                        user.id,
                        quotePayload,
                        commentPayload,
                        finalSource,
                        finalAuthor,
                        undefined,
                        selectedType || initialType || undefined,
                        selectedId || initialId || undefined,
                        selectedImage || initialImage,
                        selectedTopic?.id
                    );

                    if (status && selectedType && selectedId) {
                        await libraryService.updateStatus(selectedType, selectedId, status);
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
            paddingTop: insets.top + 10,
            paddingBottom: 16,
        },
        headerTitle: {
            fontSize: 20,
            fontFamily: theme.fonts.headings,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        scrollContent: {
            padding: 24,
            paddingBottom: 100, // Extra space for keyboard
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.textSecondary,
            marginBottom: 8,
            marginTop: 24,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        textInputContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        textInput: {
            fontSize: 16,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
            minHeight: 100,
            textAlignVertical: 'top',
        },
        singleInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 56,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 12,
        },
        singleInput: {
            flex: 1,
            fontSize: 15,
            color: theme.colors.text,
            marginLeft: 12,
        },
        dropdown: {
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            maxHeight: 250,
            zIndex: 1000,
            elevation: 10,
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border + '50',
        },
        dropdownImage: {
            width: 40,
            height: 60,
            borderRadius: 4,
            backgroundColor: theme.colors.border,
            marginRight: 12,
        },
        chip: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginRight: 8,
            backgroundColor: theme.colors.surface,
        },
        chipActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        chipText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontWeight: '600'
        },
        chipTextActive: {
            color: '#fff',
        },
    }), [theme, insets.top]);

    const getStatusOptions = () => {
        const opts: any = {
            book: [
                { label: 'Okudum', value: 'read' },
                { label: 'Okuyorum', value: 'reading' },
                { label: 'İstek', value: 'want_to_read' },
            ],
            movie: [
                { label: 'İzledim', value: 'read' },
                { label: 'İzliyorum', value: 'reading' },
                { label: 'İstek', value: 'want_to_read' },
            ],
            music: [
                { label: 'Dinledim', value: 'read' },
                { label: 'Dinliyorum', value: 'reading' },
                { label: 'İstek', value: 'want_to_read' },
            ]
        };
        return selectedType ? opts[selectedType] || [] : [];
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <X size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {originalPost ? 'Alıntıyı Paylaş' : (mode === 'thought' ? 'Düşünceni Paylaş' : 'Yeni Paylaşım')}
                </Text>
                <View style={{ width: 80 }}>
                    <Button
                        onPress={handleShare}
                        loading={isSharing}
                        size="sm"
                    >
                        Paylaş
                    </Button>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Preview / Quote Card */}
                    <View style={{ marginBottom: 24, alignItems: 'center' }}>
                        {originalPost ? (
                            <Card variant="glass" style={{ padding: 16, width: '100%' }}>
                                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                                    "{originalPost.content}"
                                </Text>
                                <Text style={{ marginTop: 8, fontWeight: 'bold', color: theme.colors.text }}>
                                    — {originalPost.user.username}
                                </Text>
                            </Card>
                        ) : (
                            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                                <QuoteCard
                                    text={quoteText || (mode === 'thought' ? 'Aklından geçenler...' : 'Alıntı metni...')}
                                    source={source || (mode === 'thought' ? 'Düşünce' : 'Kaynak')}
                                    author={author || user?.username}
                                    imageUrl={selectedImage}
                                    variant="default" // Using default visual style
                                />
                            </ViewShot>
                        )}
                    </View>

                    {/* Main Input */}
                    {!originalPost && (
                        <View style={styles.textInputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder={mode === 'thought' ? "Ne düşünüyorsun?" : "Alıntıyı buraya yaz..."}
                                placeholderTextColor={theme.colors.textSecondary}
                                value={quoteText}
                                onChangeText={setQuoteText}
                                multiline
                                autoFocus={mode === 'thought'}
                            />
                        </View>
                    )}

                    {/* Comment Input */}
                    {(mode === 'quote' || originalPost) && (
                        <>
                            <Text style={styles.sectionTitle}>Yorumun</Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={[styles.textInput, { minHeight: 80 }]}
                                    placeholder="Bu konuda eklemek istediklerin..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                />
                            </View>
                        </>
                    )}

                    {/* Topic Selector */}
                    <TouchableOpacity
                        style={[styles.singleInputContainer, { marginTop: 16 }]}
                        onPress={() => setTopicModalVisible(true)}
                    >
                        <Tag size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                        <Text style={[styles.singleInput, { color: selectedTopic ? theme.colors.primary : theme.colors.textSecondary }]}>
                            {selectedTopic ? `#${selectedTopic.name}` : 'Konu Etiketi Ekle (İsteğe Bağlı)'}
                        </Text>
                        {selectedTopic && (
                            <TouchableOpacity onPress={() => setSelectedTopic(null)}>
                                <XCircle size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {/* Metadata Section (Search + Status) */}
                    {!originalPost && mode !== 'thought' && (
                        <View style={{ marginTop: 24, zIndex: 100 }}>
                            <Text style={styles.sectionTitle}>Detaylar</Text>

                            <View style={{ zIndex: 200 }}>
                                <View style={styles.singleInputContainer}>
                                    <Search size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
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
                                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 250 }}>
                                            {searchResults.map((item) => (
                                                <TouchableOpacity key={item.id + item.type} style={styles.dropdownItem} onPress={() => selectSource(item)}>
                                                    {item.image ? (
                                                        <Image source={{ uri: item.image }} style={styles.dropdownImage} resizeMode="cover" />
                                                    ) : (
                                                        <View style={[styles.dropdownImage, { alignItems: 'center', justifyContent: 'center' }]}>
                                                            <FileText size={20} color={theme.colors.textSecondary} />
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ color: theme.colors.text, fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
                                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{item.subtitle}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <View style={styles.singleInputContainer}>
                                <User size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                <TextInput
                                    style={styles.singleInput}
                                    placeholder="Yazar / Yönetmen / Sanatçı"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={author}
                                    onChangeText={setAuthor}
                                />
                            </View>

                            {selectedType && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                    {getStatusOptions().map((opt: any) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[styles.chip, status === opt.value && styles.chipActive]}
                                            onPress={() => setStatus(status === opt.value ? null : opt.value)}
                                        >
                                            <Text style={[styles.chipText, status === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            <TopicSelectionModal
                visible={topicModalVisible}
                onClose={() => setTopicModalVisible(false)}
                onSelect={(topic) => setSelectedTopic(topic)}
            />
        </View>
    );
};
