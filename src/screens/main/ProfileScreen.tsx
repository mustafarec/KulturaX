import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, ImageBackground, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { postService, libraryService, userService, API_URL, reviewService } from '../../services/backendApi';
import { ReviewCard } from '../../components/ReviewCard';
import { PostCard } from '../../components/PostCard';
import { QuoteCard } from '../../components/QuoteCard';
import { useNavigation } from '@react-navigation/native';
import { ReadingGoalCard } from '../../components/ReadingGoalCard';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    console.log('ProfileScreen user:', user);
    console.log('ReviewCard status:', ReviewCard); // Debugging
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [userReviews, setUserReviews] = useState<any[]>([]);
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [libraryFilter, setLibraryFilter] = useState<'all' | 'book' | 'movie'>('all');
    const [subFilter, setSubFilter] = useState<'all' | 'read' | 'reading' | 'want_to_read' | 'dropped'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<any>(null);
    const [profileStats, setProfileStats] = useState({ follower_count: 0, following_count: 0 });

    // Mock Header Image (Random Library/Aesthetic)
    const headerImage = user?.header_image_url || 'https://images.unsplash.com/photo-1507842217121-9e96e4430330?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

    const fetchUserPosts = async () => {
        if (!refreshing) setIsLoading(true);
        try {
            const data = await postService.getFeed(user?.id);
            const myPosts = data.filter((post: any) => post.user.username === user?.username);
            setUserPosts(myPosts);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUserReviews = async () => {
        if (!user) return;
        try {
            const reviews = await reviewService.getUserReviews(user.id);
            setUserReviews(reviews);
        } catch (error) {
            console.error('Review fetch error:', error);
        }
    };

    const fetchLibraryItems = async () => {
        if (!user) return;
        try {
            const items = await libraryService.getUserLibrary(user.id);
            setLibraryItems(items);
        } catch (error) {
            console.error('Library fetch error:', error);
        }
    };

    const fetchNowPlaying = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/integrations/spotify_proxy.php?user_id=${user.id}`);
            const data = await response.json();
            if (data && data.is_playing) {
                setNowPlaying(data);
            } else {
                setNowPlaying(null);
            }
        } catch (error) {
            console.error('Spotify error:', error);
        }
    };

    const fetchProfileStats = async () => {
        if (!user) return;
        try {
            const data = await userService.getUserProfile(user.id);
            setProfileStats({
                follower_count: data.follower_count || 0,
                following_count: data.following_count || 0
            });
        } catch (error) {
            console.error('Stats fetch error:', error);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchUserPosts();
        fetchLibraryItems();
        fetchNowPlaying();
        fetchProfileStats();
        fetchUserReviews();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserPosts();
            fetchLibraryItems();
            fetchNowPlaying();
            fetchProfileStats();
            fetchUserReviews();
            const interval = setInterval(fetchNowPlaying, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (!user) return null;

    const handleContentPress = (type: 'book' | 'movie', id: string) => {
        if (type === 'book') {
            (navigation as any).navigate('BookDetail', { bookId: id });
        } else if (type === 'movie') {
            (navigation as any).navigate('MovieDetail', { movieId: parseInt(id, 10) });
        }
    };

    const getStatusText = (status: string, type: string) => {
        switch (status) {
            case 'read':
                return type === 'movie' ? 'İzlendi' : type === 'music' ? 'Dinlendi' : 'Okundu';
            case 'reading':
                return type === 'movie' ? 'İzleniyor' : type === 'music' ? 'Dinleniyor' : 'Okunuyor';
            case 'want_to_read':
                return type === 'movie' ? 'İzlenecek' : type === 'music' ? 'Dinlenecek' : 'Okunacak';
            case 'dropped':
                return 'Yarım Bırakıldı';
            default:
                return status;
        }
    };

    const renderTabContent = () => {
        if (isLoading && !refreshing) {
            return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />;
        }

        switch (activeTab) {
            case 'posts':
                return userPosts.filter(p => p.type !== 'quote').length > 0 ? (
                    userPosts.filter(p => p.type !== 'quote').map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onPress={() => { }}
                            currentUserId={user.id}
                            onUserPress={() => {
                                const targetUserId = post.original_post ? post.original_post.user.id : post.user.id;
                                if (targetUserId !== user.id) {
                                    (navigation as any).navigate('OtherProfile', { userId: targetUserId });
                                }
                            }}
                            onContentPress={handleContentPress}
                        />
                    ))
                ) : (
                    <EmptyState icon="social-dropbox" text="Henüz gönderi yok." />
                );
            case 'quotes':
                // Alıntı filtresi: (type 'quote' OLSUN) VEYA (quote_text boş OLMASIN) VEYA (content_type 'book'/'movie'/'music' OLSUN)
                // Not: create_post sırasında content_type atanıyor, quote_text atanıyor.
                const quotePosts = userPosts.filter(p =>
                    p.type === 'quote' ||
                    (p.quote_text && p.quote_text.length > 0) ||
                    (p.content_type && ['book', 'movie', 'music'].includes(p.content_type) && p.content) // Eski kayıtlar için fallback
                );

                return quotePosts.length > 0 ? (
                    quotePosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onPress={() => { }}
                            currentUserId={user.id}
                            onUserPress={() => {
                                const targetUserId = post.original_post ? post.original_post.user.id : post.user.id;
                                if (targetUserId !== user.id) {
                                    (navigation as any).navigate('OtherProfile', { userId: targetUserId });
                                }
                            }}
                            onContentPress={handleContentPress}
                        />
                    ))
                ) : (
                    <EmptyState icon="speech" text="Henüz alıntı yok." />
                );
            case 'library':
                const filteredLibrary = libraryItems.filter(item => {
                    const matchesType = libraryFilter === 'all' ? true : item.content_type === libraryFilter;
                    const matchesSub = subFilter === 'all' ? true : item.status === subFilter;
                    return matchesType && matchesSub;
                });

                const handleFilterChange = (filter: 'all' | 'book' | 'movie') => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setLibraryFilter(filter);
                    setSubFilter('all');
                };

                const getSubFilters = () => {
                    if (libraryFilter === 'book') {
                        return [
                            { label: 'Tümü', value: 'all' },
                            { label: 'Okudum', value: 'read' },
                            { label: 'Okuyorum', value: 'reading' },
                            { label: 'Okuyacağım', value: 'want_to_read' },
                            { label: 'Yarım Bıraktım', value: 'dropped' },
                        ];
                    } else if (libraryFilter === 'movie') {
                        return [
                            { label: 'Tümü', value: 'all' },
                            { label: 'İzledim', value: 'read' },
                            { label: 'İzliyorum', value: 'reading' },
                            { label: 'İzleyeceğim', value: 'want_to_read' },
                            { label: 'Yarım Bıraktım', value: 'dropped' },
                        ];
                    }
                    return [];
                };

                return (
                    <View>
                        {/* Ana Filtreler */}
                        <View style={[styles.filterContainer, { marginBottom: 8 }]}>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'all' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('all')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'all' && styles.activeFilterText]}>Tümü</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'book' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('book')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'book' && styles.activeFilterText]}>Kitaplar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, libraryFilter === 'movie' && styles.activeFilterChip]}
                                onPress={() => handleFilterChange('movie')}
                            >
                                <Text style={[styles.filterText, libraryFilter === 'movie' && styles.activeFilterText]}>Filmler</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Alt Filtreler (Animasyonlu) */}
                        {libraryFilter !== 'all' && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, paddingHorizontal: 4 }}>
                                {getSubFilters().map((sub) => (
                                    <TouchableOpacity
                                        key={sub.value}
                                        style={[
                                            styles.filterChip,
                                            { backgroundColor: subFilter === sub.value ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, marginRight: 6, paddingVertical: 4, paddingHorizontal: 12 }
                                        ]}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setSubFilter(sub.value as any);
                                        }}
                                    >
                                        <Text style={[styles.filterText, { fontSize: 11, color: subFilter === sub.value ? '#fff' : theme.colors.text }]}>{sub.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {filteredLibrary.length > 0 ? (
                            filteredLibrary.map((item) => (
                                <TouchableOpacity key={item.id} style={styles.libraryItemCard} onPress={() => handleContentPress(item.content_type, item.content_id)}>
                                    {item.image_url ? (
                                        <Image source={{ uri: item.image_url }} style={styles.libraryBookCover} />
                                    ) : (
                                        <View style={[styles.libraryBookCover, { justifyContent: 'center', alignItems: 'center', backgroundColor: item.content_type === 'movie' ? '#E50914' : theme.colors.secondary }]}>
                                            <Icon name={item.content_type === 'movie' ? 'film' : 'book-open'} size={24} color="#FFF" />
                                        </View>
                                    )}
                                    <View style={styles.libraryItemContent}>
                                        <View>
                                            <Text style={styles.libraryItemTitle} numberOfLines={2}>{item.content_title || 'İsimsiz Eser'}</Text>
                                            {item.author && <Text style={styles.libraryItemAuthor} numberOfLines={1}>{item.author}</Text>}
                                        </View>
                                        <View style={styles.libraryMetaRow}>
                                            <View style={[styles.statusBadge, { backgroundColor: item.status === 'read' ? '#4CAF50' : item.status === 'reading' ? '#2196F3' : '#FFC107' }]}>
                                                <Text style={styles.statusText}>
                                                    {getStatusText(item.status, item.content_type)}
                                                </Text>
                                            </View>
                                            <Text style={styles.libraryItemDate}>{new Date(item.updated_at).toLocaleDateString()} güncellendi</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <EmptyState icon="book-open" text={libraryFilter === 'all' ? "Kütüphaneniz boş." : "Bu kategoride içerik yok."} />
                        )}
                    </View>
                );
            case 'reviews':
                return userReviews.length > 0 ? (
                    userReviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onUserPress={() => { }} // Kendi profilimizde zaten
                        />
                    ))
                ) : (
                    <EmptyState icon="pencil" text="Henüz inceleme yok." />
                );
            default:
                return null;
        }
    };

    // Helper Components
    const StatItem = ({ number, label, onPress }: { number: number, label: string, onPress?: () => void }) => (
        <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
            <Text style={styles.statNumber}>{number}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const TabButton = ({ title, active, onPress }: { title: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
            <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
        </TouchableOpacity>
    );

    const EmptyState = ({ icon, text }: { icon: string, text: string }) => (
        <View style={styles.emptyContainer}>
            <Icon name={icon} size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        headerImageContainer: {
            height: 180,
            width: '100%',
            position: 'relative',
        },
        headerImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        headerGradient: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
        },
        settingsButton: {
            position: 'absolute',
            top: 45,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: 8,
            borderRadius: 20,
        },
        profileInfoContainer: {
            marginTop: -50, // Overlap header image
            paddingBottom: 10,
        },
        avatarRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingHorizontal: 20,
            marginBottom: 12,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 4,
            borderColor: theme.colors.background,
            ...theme.shadows.soft,
        },
        actionButtons: {
            flexDirection: 'row',
            marginBottom: 10,
        },
        editButton: {
            backgroundColor: theme.colors.surface,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            marginRight: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        editButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
        },
        shareButton: {
            backgroundColor: theme.colors.surface,
            padding: 8,
            borderRadius: 20,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        userInfo: {
            paddingHorizontal: 20,
            marginBottom: 20,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
        },
        name: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.colors.text,
            marginRight: 8,
        },
        badge: {
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '700',
            color: theme.colors.textSecondary,
        },
        username: {
            fontSize: 15,
            color: theme.colors.textSecondary,
            fontWeight: '500',
            marginBottom: 12,
        },
        bio: {
            fontSize: 15,
            color: theme.colors.text,
            lineHeight: 22,
            marginBottom: 12,
        },
        metaInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        metaText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginLeft: 4,
        },
        listeningContainer: {
            marginHorizontal: 20,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(29, 185, 84, 0.1)', // Spotify green tint
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(29, 185, 84, 0.2)',
        },
        listeningLabel: {
            fontSize: 10,
            color: '#1DB954',
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        listeningTrack: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
        },
        listeningArtist: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        albumArt: {
            width: 48,
            height: 48,
            borderRadius: 8,
        },
        statsScroll: {
            marginBottom: 20,
        },
        statsContent: {
            paddingHorizontal: 20,
        },
        statItem: {
            marginRight: 24,
            alignItems: 'center',
        },
        statNumber: {
            fontSize: 18,
            fontWeight: '800',
            color: theme.colors.text,
        },
        statLabel: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        tabsContainer: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            paddingHorizontal: 20,
        },
        tab: {
            marginRight: 24,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        activeTab: {
            borderBottomColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeTabText: {
            color: theme.colors.primary,
            fontWeight: '700',
        },
        filterContainer: {
            flexDirection: 'row',
            marginBottom: 16,
        },
        filterChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            marginRight: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        activeFilterChip: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        filterText: {
            fontSize: 13,
            color: theme.colors.text,
            fontWeight: '600',
        },
        activeFilterText: {
            color: '#FFFFFF',
        },
        contentContainer: {
            padding: 20,
        },
        libraryItemCard: {
            backgroundColor: theme.colors.surface,
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: 'row',
        },
        libraryBookCover: {
            width: 60,
            height: 90,
            borderRadius: 8,
            backgroundColor: theme.colors.secondary,
            marginRight: 12,
        },
        libraryItemContent: {
            flex: 1,
            justifyContent: 'space-between',
        },
        libraryItemHeader: {
            flexDirection: 'column',
            alignItems: 'flex-start',
        },
        libraryItemTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 2,
        },
        libraryItemAuthor: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 8,
        },
        libraryMetaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            alignSelf: 'flex-start',
        },
        statusText: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 'bold',
        },
        libraryItemDate: {
            fontSize: 11,
            color: theme.colors.textSecondary,
        },
        emptyContainer: {
            alignItems: 'center',
            padding: 40,
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontSize: 16,
        },
    }), [theme]);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Header Image Area */}
            <View style={styles.headerImageContainer}>
                <Image
                    key={headerImage}
                    source={{ uri: headerImage }}
                    style={styles.headerImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', theme.colors.background]}
                    style={styles.headerGradient}
                />
                <TouchableOpacity style={styles.settingsButton} onPress={() => (navigation as any).navigate('Settings')}>
                    <Icon name="settings" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Profile Info Area */}
            <View style={styles.profileInfoContainer}>
                <View style={styles.avatarRow}>
                    <Image
                        key={user.avatar_url}
                        source={{ uri: user.avatar_url || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => (navigation as any).navigate('EditProfile')}
                        >
                            <Text style={styles.editButtonText}>Profili Düzenle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton}>
                            <Icon name="share" size={18} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{user.full_name || user.username}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Okur</Text>
                        </View>
                    </View>
                    <Text style={styles.username}>@{user.username}</Text>

                    {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

                    <View style={styles.metaInfo}>
                        <Icon name="location-pin" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.metaText}>{user.location || 'İstanbul'}</Text>
                        <Icon name="calendar" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 12 }} />
                        <Text style={styles.metaText}>Katılım: Kasım 2025</Text>
                    </View>
                </View>

                {/* Now Playing */}
                {nowPlaying && (
                    <View style={styles.listeningContainer}>
                        <Image source={{ uri: nowPlaying.image }} style={styles.albumArt} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="music-tone-alt" size={12} color="#1DB954" style={{ marginRight: 4 }} />
                                <Text style={styles.listeningLabel}>Dinliyor</Text>
                            </View>
                            <Text style={styles.listeningTrack} numberOfLines={1}>{nowPlaying.track}</Text>
                            <Text style={styles.listeningArtist} numberOfLines={1}>{nowPlaying.artist}</Text>
                        </View>
                    </View>
                )}

                {/* Stats Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
                    <StatItem number={userPosts.length} label="Gönderi" />
                    <StatItem number={libraryItems.filter(i => i.status === 'read').length} label="Kitap" />
                    <StatItem
                        number={profileStats.follower_count}
                        label="Takipçi"
                        onPress={() => (navigation as any).navigate('FollowList', { userId: user.id, type: 'followers' })}
                    />
                    <StatItem
                        number={profileStats.following_count}
                        label="Takip"
                        onPress={() => (navigation as any).navigate('FollowList', { userId: user.id, type: 'following' })}
                    />
                    <StatItem number={userReviews.length} label="İnceleme" onPress={() => setActiveTab('reviews')} />
                </ScrollView>

                {/* Reading Goal */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <ReadingGoalCard />
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TabButton title="Gönderiler" active={activeTab === 'posts'} onPress={() => setActiveTab('posts')} />
                    <TabButton title="Alıntılar" active={activeTab === 'quotes'} onPress={() => setActiveTab('quotes')} />
                    <TabButton title="Kütüphane" active={activeTab === 'library'} onPress={() => setActiveTab('library')} />
                    <TabButton title="İncelemeler" active={activeTab === 'reviews'} onPress={() => setActiveTab('reviews')} />
                </View>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {renderTabContent()}
            </View>

            <View style={{ height: 120 }} />
        </ScrollView>
    );
};
