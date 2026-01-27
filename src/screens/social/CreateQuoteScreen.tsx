import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { QuoteCard } from '../../components/QuoteCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { postService } from '../../services/api/postApi';
import { libraryService } from '../../services/api/libraryApi';
import { spotifyService } from '../../services/api/integrationApi';
import { useAuth } from '../../context/AuthContext';
import { googleBooksApi } from '../../services/googleBooksApi';
import { tmdbApi } from '../../services/tmdbApi';
import { Avatar } from '../../components/ui/Avatar';
import { X, Search, FileText, Tag, XCircle, Book, Music, Film, Check, BookOpen, Quote, ArrowLeft, Layers } from 'lucide-react-native';
import { TopicSelectionModal } from '../../components/TopicSelectionModal';
import { draftService } from '../../services/DraftService';
import { ThemedDialog } from '../../components/ThemedDialog';

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
    const draft = route.params?.draft;

    const [quoteText, setQuoteText] = useState(draft?.data?.quoteText || initialText);
    const [title, setTitle] = useState(draft?.data?.title || '');
    const [comment, setComment] = useState(draft?.data?.comment || '');
    const [source, setSource] = useState(draft?.data?.source || initialSource);
    const [author, setAuthor] = useState(draft?.data?.author || initialAuthor);
    const [selectedImage, setSelectedImage] = useState<string | undefined>(draft?.data?.selectedImage || initialImage);
    const [selectedType, setSelectedType] = useState<'book' | 'movie' | 'music' | null>(draft?.data?.selectedType || initialType);
    const [selectedId, setSelectedId] = useState<string | null>(draft?.data?.selectedId || initialId);

    const [status, setStatus] = useState<string | null>(draft?.data?.status || null);
    const [selectedTopic, setSelectedTopic] = useState<any>(draft?.data?.selectedTopic || null);
    const [topicModalVisible, setTopicModalVisible] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [searchType, setSearchType] = useState<'book' | 'movie' | 'music'>('book');

    // Re-search when tab changes
    React.useEffect(() => {
        if (source.length >= 3) {
            handleSearchSource(source);
        }
    }, [searchType]);

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

    const hasUnsavedChanges = quoteText.trim().length > 0 || title.trim().length > 0 || comment.trim().length > 0 || !!selectedId;

    useFocusEffect(
        React.useCallback(() => {
            const backAction = () => {
                if (hasUnsavedChanges) {
                    setDialogVisible(true);
                    return true;
                }
                return false;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }, [hasUnsavedChanges])
    );

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setDialogVisible(true);
        } else {
            navigation.goBack();
        }
    };

    const handleSaveDraft = async () => {
        try {
            const draftData = {
                quoteText,
                title,
                comment,
                source,
                author,
                selectedImage,
                selectedType,
                selectedId,
                status,
                selectedTopic
            };

            if (draft) {
                await draftService.updateDraft(draft.id, draftData);
            } else {
                await draftService.saveDraft({ type: 'quote', data: draftData });
            }
            Toast.show({ type: 'info', text1: 'Taslak Kaydedildi' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Taslak kaydedilemedi.' });
        }
        setDialogVisible(false);
    };

    const handleSearchSource = async (query: string) => {
        setSource(query);
        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            // Filter API calls based on searchType
            const promises = [];

            if (searchType === 'book') {
                promises.push(googleBooksApi.searchBooks(query));
            } else {
                promises.push(Promise.resolve([]));
            }

            if (searchType === 'movie') {
                promises.push(tmdbApi.searchMovies(query));
                promises.push(tmdbApi.searchPerson(query)); // Person search usually relates to movies/cast
            } else {
                promises.push(Promise.resolve([]));
                promises.push(Promise.resolve([]));
            }

            if (searchType === 'music') {
                promises.push(spotifyService.searchTracks(query));
            } else {
                promises.push(Promise.resolve([]));
            }

            const results = await Promise.allSettled(promises);

            const books = results[0].status === 'fulfilled' ? results[0].value : [];
            const movies = results[1].status === 'fulfilled' ? results[1].value : [];
            const people = results[2].status === 'fulfilled' ? results[2].value : [];
            const tracks = results[3].status === 'fulfilled' ? results[3].value : [];

            let allResults: any[] = [];

            if (people && people.length > 0) {
                const person = people[0];
                try {
                    const credits = await tmdbApi.getPersonCredits(person.id);
                    const allCastCrew = [...(credits?.cast || []), ...(credits?.crew || [])];
                    const personMovies = allCastCrew.slice(0, 10).map((movie: any) => ({
                        id: movie.id.toString(),
                        title: movie.title || movie.name,
                        subtitle: `${movie.title ? 'Film' : 'Dizi'} (${movie.release_date || movie.first_air_date ? new Date(movie.release_date || movie.first_air_date).getFullYear() : '?'}) • ${person.name}`,
                        type: 'movie',
                        author: person.name,
                        image: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : undefined
                    }));
                    allResults = [...allResults, ...personMovies];
                } catch (creditsError) {
                    console.error('Person credits fetch failed:', creditsError);
                }
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
            console.error('Search error:', error);
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

        if (item.type === 'movie' && (item.author === 'Film' || !item.author)) {
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
                        title,
                        undefined,
                        selectedType || initialType || undefined,
                        selectedId || initialId || undefined,
                        selectedImage || initialImage,
                        selectedTopic?.id
                    );

                    if (status && selectedType && selectedId) {
                        await libraryService.updateStatus(selectedType, selectedId, status);
                    }

                    if (draft) {
                        await draftService.deleteDraft(draft.id);
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
        topicBadgePreview: {
            backgroundColor: theme.colors.secondary + '30',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
            marginLeft: 4,
        },
        topicBadgeTextPreview: {
            fontSize: 10,
            color: theme.colors.primary,
            fontWeight: '600',
        },
        // --- Preview Specific Styles (matching PostCard) ---
        previewCard: {
            width: '100%',
            marginBottom: theme.spacing.m,
            borderBottomWidth: 0,
        },
        previewHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.s,
            paddingRight: 20,
        },
        userInfo: {
            flex: 1,
            marginLeft: theme.spacing.s,
        },
        name: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        meta: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 2,
            flexWrap: 'wrap',
        },
        username: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        dot: {
            marginHorizontal: 4,
            color: theme.colors.textSecondary,
            fontSize: 10,
        },
        time: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        content: {
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
        },
        bookCard: {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            flexDirection: 'row',
            marginBottom: theme.spacing.m,
        },
        bookCover: {
            width: 60,
            height: 90,
            borderRadius: theme.borderRadius.s,
            backgroundColor: theme.colors.secondary,
        },
        bookInfo: {
            flex: 1,
            marginLeft: theme.spacing.m,
            justifyContent: 'center',
        },
        bookTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.primary,
            marginBottom: 4,
        },
        bookAuthor: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        quoteBox: {
            backgroundColor: theme.colors.background,
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.primary,
            padding: theme.spacing.m,
            borderRadius: theme.borderRadius.s,
            marginBottom: theme.spacing.m,
        },
        quoteText: {
            fontSize: 16,
            fontStyle: 'italic',
            color: theme.colors.text,
            lineHeight: 24,
        },
        // --- End Preview Styles ---
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
            marginTop: 12,
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
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            maxHeight: 350,
            zIndex: 1000,
            elevation: 10,
            marginTop: 4,
            overflow: 'hidden',
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border + '30',
        },
        categoryHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface + '80',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border + '50',
        },
        categoryTitle: {
            fontSize: 10,
            fontWeight: '800',
            color: theme.colors.textSecondary,
            marginLeft: 6,
            letterSpacing: 0.5,
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
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
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

            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={20}
            >
                {/* Preview / Quote Card */}
                <View style={{ marginBottom: 16 }}>
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
                            {/* Realistic Post Preview */}
                            <View style={{ marginBottom: 0, width: '100%' }}>
                                <Card style={styles.previewCard} variant="default" padding="md">
                                    {/* Header */}
                                    <View style={styles.previewHeader}>
                                        <Avatar
                                            src={user?.avatar_url}
                                            alt={user?.username || 'User'}
                                            size="md"
                                        />
                                        <View style={styles.userInfo}>
                                            <Text style={styles.name}>{user?.full_name || user?.username || 'Kullanıcı'}</Text>
                                            <View style={styles.meta}>
                                                <Text style={styles.username}>@{user?.username || 'username'}</Text>
                                                <Text style={styles.dot}>•</Text>
                                                <Text style={styles.time}>Şimdi</Text>
                                                {selectedTopic && (
                                                    <>
                                                        <Text style={styles.dot}>•</Text>
                                                        <View style={styles.topicBadgePreview}>
                                                            <Text style={styles.topicBadgeTextPreview}>{selectedTopic.name.replace(/^#/, '')}</Text>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Post Title */}
                                    {title.trim() ? (
                                        <Text style={[styles.content, { fontWeight: 'bold', marginBottom: 4, fontSize: 17 }]}>
                                            {title}
                                        </Text>
                                    ) : null}

                                    {/* Content Text (Comment) */}
                                    {comment.trim() ? (
                                        <Text style={styles.content}>{comment}</Text>
                                    ) : null}

                                    {/* Book/Movie/Music Card */}
                                    {(selectedType === 'book' || selectedType === 'movie' || selectedType === 'music') && (
                                        <View style={{ marginBottom: theme.spacing.m }}>
                                            <View style={styles.bookCard}>
                                                <Image
                                                    source={{ uri: selectedImage || 'https://via.placeholder.com/150' }}
                                                    style={styles.bookCover}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.bookInfo}>
                                                    <Text style={styles.bookTitle} numberOfLines={1}>{source || (selectedType === 'book' ? 'Kitap Seçilmedi' : selectedType === 'movie' ? 'Film Seçilmedi' : 'Müzik Seçilmedi')}</Text>
                                                    <Text style={styles.bookAuthor} numberOfLines={1}>{author || 'Bilinmeyen'}</Text>
                                                    {selectedType === 'book' && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                            <BookOpen size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                                                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Şu an okuyor</Text>
                                                        </View>
                                                    )}
                                                    {selectedType === 'movie' && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                            <Film size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                                                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>İzliyor</Text>
                                                        </View>
                                                    )}
                                                    {selectedType === 'music' && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                            <Music size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                                                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Dinliyor</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Quote Box */}
                                            {quoteText.trim() ? (
                                                <View style={[styles.quoteBox, { marginTop: 0 }]}>
                                                    <Quote size={32} color={theme.colors.primary} style={{ opacity: 0.2, position: 'absolute', top: 12, right: 12 }} />
                                                    <Text style={styles.quoteText}>"{quoteText}"</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    )}

                                    {/* Quote Only (if no book/movie/music) */}
                                    {!selectedType && quoteText.trim() ? (
                                        <View style={styles.quoteBox}>
                                            <Text style={styles.quoteText}>"{quoteText}"</Text>
                                        </View>
                                    ) : null}
                                </Card>
                            </View>
                        </ViewShot>
                    )}
                </View>

                {/* Metadata Section (Search + Status) - Moved Above Title */}
                {!originalPost && mode !== 'thought' && (
                    <View style={{ marginTop: 0, zIndex: 100, marginBottom: 24 }}>
                        <Text style={styles.sectionTitle}>Detaylar</Text>

                        {/* Search Type Tabs - Styled like CreateReviewScreen */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                            {[
                                { id: 'book', label: 'Kitap', icon: Book },
                                { id: 'movie', label: 'Film', icon: Film },
                                { id: 'music', label: 'Müzik', icon: Music }
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => {
                                        setSearchType(tab.id as any);
                                        if (source.length >= 3) {
                                            // Trigger search (useEffect handles it)
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        gap: 6,
                                        borderColor: searchType === tab.id ? theme.colors.primary : theme.colors.border,
                                        backgroundColor: searchType === tab.id ? theme.colors.primary + '15' : 'transparent',
                                    }}
                                >
                                    <tab.icon size={16} color={searchType === tab.id ? theme.colors.primary : theme.colors.textSecondary} />
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: searchType === tab.id ? theme.colors.primary : theme.colors.textSecondary
                                    }}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ zIndex: 200 }}>
                            <View style={styles.singleInputContainer}>
                                <Search size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                <TextInput
                                    style={styles.singleInput}
                                    placeholder={
                                        searchType === 'book' ? "Kitap Ara..." :
                                            searchType === 'movie' ? "Film veya Dizi Ara..." :
                                                searchType === 'music' ? "Müzik Ara..." :
                                                    "Kitap, Film veya Müzik Ara..."
                                    }
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={source}
                                    onChangeText={handleSearchSource}
                                />
                                {isSearching && <ActivityIndicator size="small" color={theme.colors.primary} />}
                            </View>

                            {showResults && searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 350 }}>
                                        {['book', 'movie', 'music'].map((type) => {
                                            const filtered = searchResults.filter(r => r.type === type);
                                            if (filtered.length === 0) return null;

                                            return (
                                                <View key={type}>
                                                    <View style={styles.categoryHeader}>
                                                        {type === 'book' && <Book size={14} color={theme.colors.textSecondary} />}
                                                        {type === 'movie' && <Film size={14} color={theme.colors.textSecondary} />}
                                                        {type === 'music' && <Music size={14} color={theme.colors.textSecondary} />}
                                                        <Text style={styles.categoryTitle}>
                                                            {type === 'book' ? 'KİTAPLAR' : type === 'movie' ? 'FİLMLER / DİZİLER' : 'MÜZİKLER'}
                                                        </Text>
                                                    </View>
                                                    {filtered.map((item) => (
                                                        <TouchableOpacity key={item.id + item.type} style={styles.dropdownItem} onPress={() => selectSource(item)}>
                                                            {item.image ? (
                                                                <Image source={{ uri: item.image }} style={styles.dropdownImage} resizeMode="cover" />
                                                            ) : (
                                                                <View style={[styles.dropdownImage, { alignItems: 'center', justifyContent: 'center' }]}>
                                                                    {item.type === 'book' && <Book size={20} color={theme.colors.textSecondary} />}
                                                                    {item.type === 'movie' && <Film size={20} color={theme.colors.textSecondary} />}
                                                                    {item.type === 'music' && <Music size={20} color={theme.colors.textSecondary} />}
                                                                </View>
                                                            )}
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
                                                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{item.subtitle}</Text>
                                                            </View>
                                                            {selectedId === item.id && <Check size={18} color={theme.colors.primary} />}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}
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

                {/* Title Input */}
                {!originalPost && (
                    <View style={[styles.singleInputContainer, { marginBottom: 16 }]}>
                        <FileText size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                        <TextInput
                            style={styles.singleInput}
                            placeholder="Başlık Yazın (Opsiyonel)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={60}
                        />
                        {title.length > 0 && (
                            <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>{title.length}/60</Text>
                        )}
                    </View>
                )}

                {/* Main Input (Quote/Thought) */}
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



                {/* Topic Selector - Moved to Bottom */}
                <TouchableOpacity
                    style={[styles.singleInputContainer, { marginTop: 24 }]}
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

            </KeyboardAwareScrollView>

            <TopicSelectionModal
                visible={topicModalVisible}
                onClose={() => setTopicModalVisible(false)}
                onSelect={(topic) => setSelectedTopic(topic)}
            />

            <ThemedDialog
                visible={dialogVisible}
                title="Taslak Kaydedilsin mi?"
                message="Yaptığınız değişiklikleri taslak olarak kaydetmek ister misiniz?"
                onClose={() => setDialogVisible(false)}
                actions={[
                    { text: 'Kaydetme', onPress: () => { setDialogVisible(false); navigation.goBack(); }, style: 'cancel' },
                    { text: 'Kaydet', onPress: handleSaveDraft, style: 'default' },
                ]}
            />
        </View>
    );
};
