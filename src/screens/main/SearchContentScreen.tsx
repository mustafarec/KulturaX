import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Keyboard,
    Dimensions,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, X, ArrowLeft, Ghost, User, MessageSquare } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFeed } from '../../hooks/useFeed';
import { PostCard } from '../../components/PostCard';
import { UserCard } from '../../components/UserCard';
import { SkeletonPost } from '../../components/ui/SkeletonPost';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SearchContentScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
    const inputRef = useRef<TextInput>(null);

    // Entry animations for search bar
    const searchBarScale = useSharedValue(0.95);
    const searchBarOpacity = useSharedValue(0);

    const animatedSearchBarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: searchBarScale.value }],
        opacity: searchBarOpacity.value,
    }));

    // Using useFeed hook for searching
    const {
        feeds,
        loadingStates,
        refreshing,
        fetchFeed,
        users,
        feed
    } = useFeed();

    const loading = loadingStates.search;

    const onRefresh = () => fetchFeed('search', searchQuery, true);

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            const delayDebounceFn = setTimeout(() => {
                fetchFeed('search', searchQuery);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery, fetchFeed]);

    useEffect(() => {
        // Entry animation on mount
        searchBarScale.value = withSpring(1, { damping: 20, stiffness: 150 });
        searchBarOpacity.value = withTiming(1, { duration: 200 });

        // Auto-focus on mount
        const timer = setTimeout(() => inputRef.current?.focus(), 150);
        return () => clearTimeout(timer);
    }, []);

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'posts') {
            return <PostCard post={item} />;
        } else {
            return <UserCard user={item} onPress={() => (navigation as any).navigate('OtherProfile', { userId: item.originalId || item.id })} />;
        }
    };

    const displayData = activeTab === 'posts' ? feed : (users || []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Professional Search Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <Animated.View style={[styles.searchBar, { backgroundColor: theme.colors.inputBackground }, animatedSearchBarStyle]}>
                    <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder="Kitap, film veya kişi ara..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <X size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>

            {/* Professional Tabs */}
            <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    onPress={() => setActiveTab('posts')}
                    style={[styles.tab, activeTab === 'posts' && { borderBottomColor: theme.colors.primary }]}
                >
                    <View style={styles.tabContent}>
                        <MessageSquare size={18} color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'posts' ? theme.colors.text : theme.colors.textSecondary },
                            activeTab === 'posts' && styles.activeTabText
                        ]}>Gönderiler</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('people')}
                    style={[styles.tab, activeTab === 'people' && { borderBottomColor: theme.colors.primary }]}
                >
                    <View style={styles.tabContent}>
                        <User size={18} color={activeTab === 'people' ? theme.colors.primary : theme.colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'people' ? theme.colors.text : theme.colors.textSecondary },
                            activeTab === 'people' && styles.activeTabText
                        ]}>Kişiler</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Results List */}
            {loading && searchQuery.length > 0 ? (
                <View style={styles.listPadding}>
                    <SkeletonPost /><SkeletonPost /><SkeletonPost />
                </View>
            ) : (
                <FlatList
                    data={displayData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listPadding}
                    ListEmptyComponent={
                        searchQuery.length > 0 ? (
                            <Animated.View entering={FadeIn} style={styles.emptyContainer}>
                                <Ghost size={48} color={theme.colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                    Sonuç bulunamadı
                                </Text>
                            </Animated.View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Search size={48} color={theme.colors.textSecondary} opacity={0.3} />
                                <Text style={[styles.emptyText, { color: theme.colors.textSecondary, opacity: 0.5 }]}>
                                    Keşfetmeye başla...
                                </Text>
                            </View>
                        )
                    }
                    onScroll={() => Keyboard.dismiss()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    searchBar: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    clearButton: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        fontWeight: '700',
    },
    listPadding: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
