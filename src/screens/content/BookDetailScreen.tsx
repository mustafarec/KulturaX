import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { googleBooksApi } from '../../services/googleBooksApi';
import { postService, reviewService } from '../../services/backendApi';
import { ReviewModal } from '../../components/ReviewModal';
import { QuoteModal } from '../../components/QuoteModal';
import { useAuth } from '../../context/AuthContext';
import { LibraryStatusButton } from '../../components/LibraryStatusButton';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

export const BookDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params as { bookId?: string; book?: any };
    const bookId = params.bookId || params.book?.id;
    const { user } = useAuth();
    const { theme } = useTheme();

    const [book, setBook] = useState<any>(params.book || null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await googleBooksApi.getBookDetails(bookId);
            setBook(data);
            await fetchPosts();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            // Fetch quotes (from posts table)
            const quotesResponse = await postService.getQuotesByContent('book', bookId);
            setQuotes(quotesResponse.filter((p: any) => p.type === 'quote'));

            // Fetch reviews (from reviews table)
            const reviewsResponse = await reviewService.getReviews('book', bookId);
            setReviews(reviewsResponse);
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    useEffect(() => {
        if (bookId) {
            fetchData();
        }
    }, [bookId]);

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
            paddingTop: 60, // Adjust for status bar
        },
        backButton: {
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10,
            padding: 8,
            backgroundColor: theme.colors.surface + 'CC', // Transparent surface
            borderRadius: 20,
        },
        coverImage: {
            width: 100,
            height: 150,
            borderRadius: theme.borderRadius.m,
            marginRight: theme.spacing.m,
            ...theme.shadows.soft,
        },
        placeholderImage: {
            backgroundColor: theme.colors.secondary,
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
        authorText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 8,
            fontWeight: '500',
        },
        dateText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginBottom: 8,
        },
        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        ratingText: {
            fontSize: 14,
            color: theme.colors.text,
            marginLeft: 8,
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface, // Was glass
            marginHorizontal: 20,
            marginTop: 20,
            borderRadius: 16,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
            // ...theme.shadows.glass, // Removed glass shadow
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
        authorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            backgroundColor: theme.colors.surface, // Was glass
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
        },
        authorLabel: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginRight: 8,
        },
        authorName: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: '600',
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
            backgroundColor: theme.colors.surface, // Was glass
            padding: 20,
            borderRadius: theme.borderRadius.liquid,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
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
            borderTopColor: theme.colors.border, // Was rgba(0,0,0,0.05)
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
            backgroundColor: theme.colors.surface, // Was glass
            padding: 16,
            borderRadius: theme.borderRadius.liquid,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border, // Was glassBorder
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
    }), [theme]);

    const renderTabContent = () => {
        if (!book) return null;

        switch (activeTab) {
            case 'overview':
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Özet</Text>
                        <Text style={styles.overview}>{book.volumeInfo?.description || book.description || 'Özet bulunamadı.'}</Text>

                        <View style={styles.authorContainer}>
                            <Text style={styles.authorLabel}>Yazar:</Text>
                            <Text style={styles.authorName}>{book.volumeInfo?.authors ? book.volumeInfo.authors.join(', ') : (book.authors ? book.authors.join(', ') : 'Bilinmiyor')}</Text>
                        </View>
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
                                        <Text style={styles.quoteUser}>@{quote.user.username}</Text>
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
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!book) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Kitap bulunamadı.</Text>
            </View>
        );
    }

    const coverUrl = (book.volumeInfo?.imageLinks?.thumbnail || book.imageLinks?.thumbnail || book.image || 'https://via.placeholder.com/150').replace(/^http:/, 'https:');

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                />
                <View style={styles.headerInfo}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.authorText}>
                        {book.volumeInfo?.authors ? book.volumeInfo.authors.join(', ') : (book.authors ? book.authors.join(', ') : 'Bilinmiyor')}
                    </Text>
                    <Text style={styles.dateText}>
                        {book.volumeInfo?.publishedDate || book.publishedDate || ''}
                    </Text>
                    <View style={{ marginTop: 8 }}>
                        <LibraryStatusButton
                            contentType="book"
                            contentId={bookId}
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
            </View >

            {
                isLoading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
                ) : (
                    renderTabContent()
                )
            }

            <ReviewModal
                visible={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                contentType="book"
                contentId={bookId}
                contentTitle={book.title}
                imageUrl={coverUrl}
                userId={user?.id || 0}
                onReviewAdded={fetchData}
            />

            <QuoteModal
                visible={showQuoteModal}
                onClose={() => setShowQuoteModal(false)}
                source={book.volumeInfo.title}
                author={book.volumeInfo.authors?.join(', ') || 'Bilinmiyor'}
                bookCover={coverUrl}
                userId={user?.id || 0}
                onQuoteAdded={fetchData}
                initialContentType="book"
                initialContentId={bookId}
            />
        </ScrollView>
    );
};


