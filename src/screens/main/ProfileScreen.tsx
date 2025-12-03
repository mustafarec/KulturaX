import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, ImageBackground } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { postService, libraryService, API_URL } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { QuoteCard } from '../../components/QuoteCard';
import { ReviewCard } from '../../components/ReviewCard';
import { useNavigation } from '@react-navigation/native';
import { ReadingGoalCard } from '../../components/ReadingGoalCard';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    console.log('ProfileScreen user:', user);
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [userReviews, setUserReviews] = useState<any[]>([]);
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<any>(null);

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

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchUserPosts();
        fetchLibraryItems();
        fetchNowPlaying();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserPosts();
            fetchLibraryItems();
            fetchNowPlaying();
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
                return userPosts.filter(p => p.type === 'quote').length > 0 ? (
                    userPosts.filter(p => p.type === 'quote').map((post) => (
                        <QuoteCard
                            key={post.id}
                            text={post.content}
                            source={post.content_title || 'Bilinmeyen Kaynak'}
                            variant="compact"
                            onPress={() => post.content_id && post.content_type && handleContentPress(post.content_type, post.content_id)}
                        />
                    ))
                ) : (
                    <EmptyState icon="speech" text="Henüz alıntı yok." />
                );
            case 'library':
                return libraryItems.length > 0 ? (
                    libraryItems.map((item) => (
                        <View key={item.id} style={styles.libraryItemCard}>
                            <View style={styles.libraryItemHeader}>
                                <Text style={styles.libraryItemTitle}>{item.content_title}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: item.status === 'read' ? '#4CAF50' : item.status === 'reading' ? '#2196F3' : '#FFC107' }]}>
                                    <Text style={styles.statusText}>
                                        {item.status === 'read' ? 'Okundu' : item.status === 'reading' ? 'Okunuyor' : 'Okunacak'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.libraryItemDate}>{new Date(item.updated_at).toLocaleDateString()} tarihinde güncellendi</Text>
                        </View>
                    ))
                ) : (
                    <EmptyState icon="book-open" text="Kütüphaneniz boş." />
                );
            default:
                return null;
        }
    };

    // Helper Components
    const StatItem = ({ number, label }: { number: number, label: string }) => (
        <View style={styles.statItem}>
            <Text style={styles.statNumber}>{number}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
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
        contentContainer: {
            padding: 20,
        },
        libraryItemCard: {
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        libraryItemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        libraryItemTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            flex: 1,
            marginRight: 12,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        statusText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
        },
        libraryItemDate: {
            fontSize: 12,
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
                    <StatItem number={0} label="Takipçi" />
                    <StatItem number={0} label="Takip" />
                    <StatItem number={0} label="İnceleme" />
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

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};
