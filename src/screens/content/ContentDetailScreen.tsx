import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { BookLoader } from '../../components/BookLoader';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { tmdbApi } from '../../services/tmdbApi';
import { googleBooksApi } from '../../services/googleBooksApi';
import { postService, reviewService, spotifyService, lyricsService, libraryService } from '../../services/backendApi';
import { ReviewModal } from '../../components/ReviewModal';
import { QuoteModal } from '../../components/QuoteModal';
import { useAuth } from '../../context/AuthContext';
import { LibraryStatusButton } from '../../components/LibraryStatusButton';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

type ContentType = 'book' | 'movie' | 'music';

export const ContentDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params as { id: string | number; type: ContentType; initialData?: any };
    const { id, type, initialData } = params;
    const { user } = useAuth();
    const { theme } = useTheme();

    const [content, setContent] = useState<any>(initialData || null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [lyrics, setLyrics] = useState<string | null>(null);
    const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let data = null;
            if (type === 'book') {
                data = await googleBooksApi.getBookDetails(id as string);
            } else if (type === 'movie') {
                const movieData = await tmdbApi.getMovieDetails(id as number);
                const credits = await tmdbApi.getMovieCredits(id as number);
                data = { ...movieData, credits };
            } else if (type === 'music') {
                if (!content && initialData) {
                    data = initialData;
                } else if (!content) {
                    // Fetch from Spotify if no initial data
                    data = await spotifyService.getTrack(id as string);
                }
            }

            if (data) {
                setContent(data);
                // Fetch lyrics if it's music
                if (type === 'music') {
                    const artist = data.artist || data.author || data.artists?.[0]?.name;
                    const title = data.title || data.name;
                    if (artist && title) {
                        const lyricsData = await lyricsService.getLyrics(artist, title);
                        setLyrics(lyricsData);
                    }
                }
            } else if (content && type === 'music') {
                // If content was already set (e.g. from params), fetch lyrics
                const artist = content.artist || content.author || content.artists?.[0]?.name;
                const title = content.title || content.name;
                if (artist && title) {
                    const lyricsData = await lyricsService.getLyrics(artist, title);
                    setLyrics(lyricsData);
                }
            }

            await fetchPosts();
        } catch (error) {
            console.error('Error fetching content details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            const quotesResponse = await postService.getQuotesByContent(type, id.toString());
            setQuotes(quotesResponse);

            const reviewsResponse = await reviewService.getReviews(type, id.toString());
            setReviews(reviewsResponse);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, type]);



    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            padding: theme.spacing.l,
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: theme.borderRadius.xl,
            borderBottomRightRadius: theme.borderRadius.xl,
            ...theme.shadows.soft,
            paddingTop: 110,
        },
        backButton: {
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 10,
            padding: 8,
            backgroundColor: theme.colors.surface + 'CC',
            borderRadius: 20,
        },
        coverImage: {
            width: 100,
            height: 150,
            borderRadius: theme.borderRadius.m,
            marginRight: theme.spacing.m,
            ...theme.shadows.soft,
        },
        headerInfo: {
            flex: 1,
            justifyContent: 'center',
        },
        title: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.colors.text,
            marginBottom: 8,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 8,
            fontWeight: '500',
        },
        metaText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginBottom: 8,
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            marginHorizontal: 20,
            marginTop: 20,
            borderRadius: 16,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        tab: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 12,
        },
        activeTab: {
            backgroundColor: theme.colors.primary + '15',
        },
        tabText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        activeTabText: {
            color: theme.colors.primary,
            fontWeight: '700',
        },
        tabContent: {
            padding: theme.spacing.l,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: theme.colors.text,
            marginBottom: 12,
            letterSpacing: -0.5,
        },
        overview: {
            fontSize: 15,
            color: theme.colors.text,
            lineHeight: 24,
            marginBottom: 20,
        },
        infoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            backgroundColor: theme.colors.surface,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        infoLabel: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginRight: 8,
        },
        infoValue: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: '600',
        },
        castContainer: {
            marginTop: 10,
        },
        actorCard: {
            marginRight: 16,
            width: 80,
            alignItems: 'center',
        },
        actorImage: {
            width: 80,
            height: 120,
            borderRadius: 12,
            marginBottom: 8,
        },
        placeholderActor: {
            backgroundColor: theme.colors.secondary,
        },
        actorName: {
            fontSize: 12,
            color: theme.colors.text,
            textAlign: 'center',
            fontWeight: '500',
        },
        quotesHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        addQuoteButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.primary,
            borderRadius: 20,
            ...theme.shadows.soft,
        },
        addQuoteButtonText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
        },
        quoteCard: {
            backgroundColor: theme.colors.surface,
            padding: 20,
            borderRadius: theme.borderRadius.liquid,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        quoteIcon: {
            marginBottom: 12,
            opacity: 0.8,
        },
        quoteText: {
            fontSize: 16,
            fontStyle: 'italic',
            color: theme.colors.text,
            marginBottom: 16,
            lineHeight: 24,
            fontWeight: '500',
        },
        quoteFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: 12,
        },
        quoteUser: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        quoteDate: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        reviewsHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        addReviewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.primary,
            borderRadius: 20,
            ...theme.shadows.soft,
        },
        addReviewButtonText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
        },
        reviewCard: {
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: theme.borderRadius.liquid,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        reviewHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        reviewUsername: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        reviewText: {
            fontSize: 14,
            color: theme.colors.text,
            marginBottom: 8,
            lineHeight: 22,
        },
        reviewDate: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        emptyContainer: {
            alignItems: 'center',
            padding: 40,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.colors.textSecondary,
            marginTop: 8,
            fontSize: 16,
        },
        userInfoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        userAvatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            marginRight: 8,
        },
        userAvatarPlaceholder: {
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            width: 24,
            height: 24,
            borderRadius: 12,
            marginRight: 8,
        },
        userAvatarText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
        },
    }), [theme]);

    const getCoverUrl = () => {
        if (!content) return 'https://via.placeholder.com/150';
        if (type === 'book') {
            return (content.volumeInfo?.imageLinks?.thumbnail || content.imageLinks?.thumbnail || content.image || 'https://via.placeholder.com/150').replace(/^http:/, 'https:');
        } else if (type === 'movie') {
            return content.poster_path
                ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
                : (content.image || 'https://via.placeholder.com/150');
        } else if (type === 'music') {
            return content.image || content.album?.images?.[0]?.url || 'https://via.placeholder.com/150';
        }
        return 'https://via.placeholder.com/150';
    };

    const getTitle = () => {
        if (!content) return '';
        if (type === 'book') return content.title || content.volumeInfo?.title;
        if (type === 'movie') return content.title;
        if (type === 'music') return content.title || content.name;
        return '';
    };

    const getSubtitle = () => {
        if (!content) return '';
        if (type === 'book') {
            return content.volumeInfo?.authors ? content.volumeInfo.authors.join(', ') : (content.authors ? content.authors.join(', ') : 'Bilinmiyor');
        } else if (type === 'movie') {
            // Director
            return content.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Yönetmen Bilinmiyor';
        } else if (type === 'music') {
            return content.artist || content.author || content.artists?.[0]?.name || 'Sanatçı Bilinmiyor';
        }
        return '';
    };

    const getDirector = () => {
        if (type === 'movie' && content?.credits?.crew) {
            return content.credits.crew.find((c: any) => c.job === 'Director');
        }
        return null;
    };

    const getMetaText = () => {
        if (!content) return '';
        if (type === 'book') {
            return content.volumeInfo?.publishedDate || content.publishedDate || '';
        } else if (type === 'movie') {
            return `${content.release_date ? new Date(content.release_date).toLocaleDateString('tr-TR') : ''} • ${content.runtime ? content.runtime + ' dk' : ''}`;
        } else if (type === 'music') {
            return content.album?.name || content.album || '';
        }
        return '';
    };

    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    const cleanLyrics = (text: string) => {
        if (!text) return '';
        // Remove lines that look like metadata (e.g. "6 ContributorsTranslationsEnglish...")
        // Also remove text inside brackets like [Song Name Lyrics] which often appears at start
        let cleaned = text;

        // Remove the specific pattern seen in the screenshot: Number + Contributors + Translations + ...
        cleaned = cleaned.replace(/^\d+\s*Contributors.*Lyrics(\[.*?\])?/s, '');

        // Remove generic "Lyrics" header if it appears at the start
        cleaned = cleaned.replace(/^.*Lyrics(\[.*?\])?\s*/, '');

        // Remove "TranslationsEnglish" or similar if it remains
        cleaned = cleaned.replace(/Translations.*English/g, '');

        // Clean up extra whitespace at the start
        return cleaned.trim();
    };

    const renderTabContent = () => {
        if (!content) return null;

        switch (activeTab) {
            case 'overview':
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Özet</Text>
                        <Text style={styles.overview}>
                            {type === 'book' ? stripHtml(content.volumeInfo?.description || content.description || 'Özet bulunamadı.') :
                                type === 'movie' ? (content.overview || 'Özet bulunamadı.') :
                                    type === 'music' ? 'Bu şarkı hakkında henüz bir bilgi yok.' : ''}
                        </Text>

                        {type === 'movie' && content.credits?.cast && (
                            <>
                                <Text style={styles.sectionTitle}>Oyuncular</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castContainer}>
                                    {content.credits.cast.slice(0, 10).map((actor: any) => (
                                        <View key={actor.id} style={styles.actorCard}>
                                            {actor.profile_path ? (
                                                <Image
                                                    source={{ uri: `https://image.tmdb.org/t/p/w200${actor.profile_path}` }}
                                                    style={styles.actorImage}
                                                />
                                            ) : (
                                                <View style={[styles.actorImage, styles.placeholderActor]} />
                                            )}
                                            <Text style={styles.actorName} numberOfLines={2}>{actor.name}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </View>
                );
            case 'quotes':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.quotesHeader}>
                            <Text style={styles.sectionTitle}>Alıntılar</Text>
                            <TouchableOpacity
                                style={styles.addQuoteButton}
                                onPress={() => setShowQuoteModal(true)}
                            >
                                <Icon name="plus" size={12} color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.addQuoteButtonText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                        {quotes.length > 0 ? (
                            quotes.map((quote) => (
                                <View key={quote.id} style={styles.quoteCard}>
                                    <Icon name="speech" size={24} color={theme.colors.primary} style={styles.quoteIcon} />
                                    <Text style={styles.quoteText}>"{quote.content}"</Text>
                                    <View style={styles.quoteFooter}>
                                        <TouchableOpacity
                                            style={styles.userInfoContainer}
                                            onPress={() => {
                                                const targetUserId = quote.user_id || quote.user?.id;
                                                if (targetUserId) {
                                                    (navigation as any).navigate('OtherProfile', { userId: targetUserId });
                                                }
                                            }}
                                        >
                                            {quote.user.avatar_url ? (
                                                <Image source={{ uri: quote.user.avatar_url }} style={styles.userAvatar} />
                                            ) : (
                                                <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                                                    <Text style={styles.userAvatarText}>{quote.user.username.charAt(0).toUpperCase()}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.quoteUser}>@{quote.user.username}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.quoteDate}>{new Date(quote.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="speech" size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                                <Text style={styles.emptyText}>Henüz alıntı yok.</Text>
                            </View>
                        )}
                    </View>
                );
            case 'reviews':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.reviewsHeader}>
                            <Text style={styles.sectionTitle}>Yorumlar</Text>
                            <TouchableOpacity
                                style={styles.addReviewButton}
                                onPress={() => setShowReviewModal(true)}
                            >
                                <Icon name="pencil" size={12} color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.addReviewButtonText}>Yorum Yap</Text>
                            </TouchableOpacity>
                        </View>
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <TouchableOpacity
                                            style={styles.userInfoContainer}
                                            onPress={() => {
                                                const targetUserId = review.user_id || review.user?.id;
                                                if (targetUserId) {
                                                    (navigation as any).navigate('OtherProfile', { userId: targetUserId });
                                                }
                                            }}
                                        >
                                            {review.user.avatar_url ? (
                                                <Image source={{ uri: review.user.avatar_url }} style={styles.userAvatar} />
                                            ) : (
                                                <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                                                    <Text style={styles.userAvatarText}>{review.user.username.charAt(0).toUpperCase()}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.reviewUsername}>@{review.user.username}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={styles.reviewText}>{review.review_text || review.content}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="pencil" size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                                <Text style={styles.emptyText}>Henüz yorum yok.</Text>
                            </View>
                        )}
                    </View>
                );
            case 'lyrics':
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Şarkı Sözleri</Text>
                        {lyrics ? (
                            <View>
                                <Text style={[styles.metaText, { marginBottom: 16, fontStyle: 'italic' }]}>
                                    Alıntı yapmak istediğiniz satıra dokunun.
                                </Text>
                                {cleanLyrics(lyrics).split('\n').map((line, index) => {
                                    if (!line.trim()) return <View key={index} style={{ height: 16 }} />;

                                    const isSelected = selectedLineIndex === index;
                                    const isHeader = line.trim().startsWith('[') && line.trim().endsWith(']');

                                    if (isHeader) {
                                        return (
                                            <View key={index} style={{ marginBottom: 12, marginTop: 8 }}>
                                                <Text style={[
                                                    styles.overview,
                                                    {
                                                        marginBottom: 0,
                                                        fontWeight: 'bold',
                                                        color: theme.colors.primary
                                                    }
                                                ]}>
                                                    {line}
                                                </Text>
                                            </View>
                                        );
                                    }

                                    return (
                                        <View key={index} style={{ marginBottom: 8, alignItems: 'flex-start' }}>
                                            <TouchableOpacity
                                                onPress={() => setSelectedLineIndex(isSelected ? null : index)}
                                                style={{
                                                    backgroundColor: isSelected ? theme.colors.primary + '20' : 'transparent',
                                                    borderRadius: 8,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4
                                                }}
                                            >
                                                <Text style={[
                                                    styles.overview,
                                                    {
                                                        marginBottom: 0,
                                                        color: isSelected ? theme.colors.primary : theme.colors.text
                                                    }
                                                ]}>
                                                    {line}
                                                </Text>
                                            </TouchableOpacity>

                                            {isSelected && (
                                                <TouchableOpacity
                                                    style={{
                                                        position: 'absolute',
                                                        top: -40,
                                                        left: 0,
                                                        backgroundColor: theme.colors.primary,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 8,
                                                        borderRadius: 20,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        zIndex: 100,
                                                        ...theme.shadows.soft
                                                    }}
                                                    onPress={() => {
                                                        setSelectedLineIndex(null);
                                                        (navigation as any).navigate('CreateQuote', {
                                                            initialText: line.trim(),
                                                            initialSource: getTitle(),
                                                            initialAuthor: getSubtitle(),
                                                            initialImage: getCoverUrl(),
                                                            initialType: 'music',
                                                            initialId: id.toString()
                                                        });
                                                    }}
                                                >
                                                    <Icon name="bubble" size={14} color="#fff" style={{ marginRight: 6 }} />
                                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Alıntı Yap</Text>
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: -6,
                                                        left: 20,
                                                        width: 0,
                                                        height: 0,
                                                        borderLeftWidth: 6,
                                                        borderRightWidth: 6,
                                                        borderTopWidth: 6,
                                                        borderStyle: 'solid',
                                                        backgroundColor: 'transparent',
                                                        borderLeftColor: 'transparent',
                                                        borderRightColor: 'transparent',
                                                        borderTopColor: theme.colors.primary,
                                                    }} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="music-tone-alt" size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                                <Text style={styles.emptyText}>Şarkı sözleri bulunamadı.</Text>
                            </View>
                        )}
                        <Text style={[styles.metaText, { marginTop: 20, textAlign: 'center' }]}>
                            Lyrics provided by Genius
                        </Text>
                    </View>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <BookLoader />
            </View>
        );
    }

    if (!content) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>İçerik bulunamadı.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Image
                    source={{ uri: getCoverUrl() }}
                    style={styles.coverImage}
                />
                <View style={styles.headerInfo}>
                    <Text style={styles.title}>{getTitle()}</Text>
                    {type === 'movie' ? (
                        <TouchableOpacity onPress={() => {
                            const director = getDirector();
                            if (director) {
                                (navigation as any).push('CreatorDetail', { id: director.id, name: director.name, type: 'person' });
                            }
                        }}>
                            <Text style={[styles.subtitle, { textDecorationLine: 'underline' }]}>{getSubtitle()}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.subtitle}>{getSubtitle()}</Text>
                    )}
                    <Text style={styles.metaText}>{getMetaText()}</Text>
                    <View style={{ marginTop: 8 }}>
                        <LibraryStatusButton
                            contentType={type as 'book' | 'movie' | 'music'}
                            contentId={id.toString()}
                            contentTitle={getTitle()}
                            imageUrl={getCoverUrl()}
                            author={getSubtitle()}
                            summary={type === 'book' ? stripHtml(content.volumeInfo?.description || content.description || '') : type === 'movie' ? (content.overview || '') : ''}
                            lyrics={type === 'music' ? lyrics || undefined : undefined}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Hakkında</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'quotes' && styles.activeTab]}
                    onPress={() => setActiveTab('quotes')}
                >
                    <Text style={[styles.tabText, activeTab === 'quotes' && styles.activeTabText]}>Alıntılar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                    onPress={() => setActiveTab('reviews')}
                >
                    <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Yorumlar</Text>
                </TouchableOpacity>
                {type === 'music' && (
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'lyrics' && styles.activeTab]}
                        onPress={() => setActiveTab('lyrics')}
                    >
                        <Text style={[styles.tabText, activeTab === 'lyrics' && styles.activeTabText]}>Sözler</Text>
                    </TouchableOpacity>
                )}
            </View>

            {renderTabContent()}

            <ReviewModal
                visible={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                contentType={type}
                contentId={id.toString()}
                contentTitle={getTitle()}
                userId={user?.id || 0}
                onReviewAdded={fetchData}
            />

            <QuoteModal
                visible={showQuoteModal}
                onClose={() => setShowQuoteModal(false)}
                source={getTitle()}
                author={getSubtitle()}
                bookCover={getCoverUrl()}
                userId={user?.id || 0}
                onQuoteAdded={fetchPosts}
                initialContentType={type}
                initialContentId={id.toString()}
            />
        </ScrollView>
    );
};
