import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { SocialUserCard } from '../../components/SocialUserCard';
import { ArrowLeft, Users, Eye, TrendingUp, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyLeadersModal } from '../../components/WeeklyLeadersModal';

type TabType = 'top20' | 'followers' | 'views' | 'trending';

interface Tab {
    key: TabType;
    label: string;
    icon: any;
}

const TABS: Tab[] = [
    { key: 'top20', label: 'İlk 20', icon: Award },
    { key: 'followers', label: 'En Çok Takip', icon: Users },
    { key: 'views', label: 'En Çok İzlenen', icon: Eye },
    { key: 'trending', label: 'Trend', icon: TrendingUp },
];

export const PopularUsersScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('top20');

    const fetchPopularUsers = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            // Fetch popular users and following list in parallel if logged in
            const popularUsersPromise = userService.getPopularUsers();
            const followingPromise = currentUser
                ? userService.getConnections(currentUser.id, 'following')
                : Promise.resolve([]);

            const [popularData, followingData] = await Promise.all([
                popularUsersPromise,
                followingPromise
            ]);

            // Create a set of followed IDs for efficient lookup
            // Check if followingData is an array, if not (e.g. error or object), assume empty
            const followingIds = new Set<number>();
            if (Array.isArray(followingData)) {
                followingData.forEach((u: any) => {
                    if (u && u.id) followingIds.add(u.id);
                });
            }

            // Ekstra güvenlik: Frontend tarafında da boş veya hatalı kayıtları filtrele
            const validUsers = Array.isArray(popularData) ? popularData.filter(user =>
                user &&
                user.id &&
                user.username &&
                user.username.trim() !== '' &&
                user.name &&
                user.name.trim() !== ''
            ).map(user => ({
                ...user,
                // Override is_following based on the source of truth (following list)
                is_following: followingIds.has(user.id)
            })) : [];

            setUsers(validUsers);

            // Veri geldikten sonra popup kontrolü yap
            if (!isRefresh && validUsers.length > 0) {
                checkWeeklyPopup();
            }

        } catch (error) {
            console.log('Popular Users Fetch Error:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const checkWeeklyPopup = async () => {
        try {
            const lastShownDateStr = await AsyncStorage.getItem('last_leaders_popup_date');

            // Bu haftanın başlangıcını (En son geçen Çarşamba 00:00) hesapla
            const now = new Date();
            const day = now.getDay(); // 0=Pazar, 1=Pzt, ..., 3=Çarşamba
            // Çarşamba'dan sapma miktarı. Eğer bugün Çarşamba ise diff=0, Salı ise diff=6
            const diff = (day - 3 + 7) % 7;

            const currentWeekStart = new Date(now);
            currentWeekStart.setDate(now.getDate() - diff);
            currentWeekStart.setHours(0, 0, 0, 0); // Bu haftanın başlangıcı (Çarşamba 00:00)

            // Eğer daha önce hiç gösterilmediyse VEYA son gösterim bu haftanın başlangıcından önceyse
            if (!lastShownDateStr) {
                setModalVisible(true);
                await AsyncStorage.setItem('last_leaders_popup_date', now.toISOString());
            } else {
                const lastShownDate = new Date(lastShownDateStr);
                // Kullanıcı popup'ı en son "bu haftanın başlangıcından önce" görmüşse tekrar göster
                if (lastShownDate < currentWeekStart) {
                    setModalVisible(true);
                    await AsyncStorage.setItem('last_leaders_popup_date', now.toISOString());
                }
            }
        } catch (error) {
            console.error('Popup check error', error);
        }
    };

    useEffect(() => {
        fetchPopularUsers();
    }, []);

    const onRefresh = () => {
        fetchPopularUsers(true);
    };

    // Sort users based on active tab
    const sortedUsers = useMemo(() => {
        if (!users.length) return [];

        const sorted = [...users];
        switch (activeTab) {
            case 'top20':
                // Backend zaten popularity_score'a göre sıralı döndürüyor
                return sorted;
            case 'followers':
                return sorted.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
            case 'views':
                return sorted.sort((a, b) => (b.total_views || 0) - (a.total_views || 0));
            case 'trending':
                // Büyüme Potansiyeli: (views + likes) / follower_count
                return sorted.sort((a, b) => {
                    const aFollowers = a.follower_count || 1; // 0'a bölme hatası önle
                    const bFollowers = b.follower_count || 1;
                    const aGrowth = ((a.total_views || 0) + (a.total_likes || 0)) / aFollowers;
                    const bGrowth = ((b.total_views || 0) + (b.total_likes || 0)) / bFollowers;
                    return bGrowth - aGrowth;
                });
            default:
                return sorted;
        }
    }, [users, activeTab]);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 0,
            borderBottomColor: theme.colors.border,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginLeft: 16,
        },
        tabWrapper: {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        tabContainer: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
        },
        tab: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 6,
        },
        tabActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        tabLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        tabLabelActive: {
            color: '#FFFFFF',
        },
        listContent: {
            padding: 16,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 50,
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontSize: 16,
        }
    }), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Popüler Kullanıcılar</Text>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabContainer}
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const IconComponent = tab.icon;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(tab.key)}
                                activeOpacity={0.7}
                            >
                                <IconComponent
                                    size={16}
                                    color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                                />
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <>
                    <FlatList
                        data={sortedUsers}
                        keyExtractor={(item, index) => `${activeTab}-${item?.id || index}`}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                        }
                        renderItem={({ item }) => (
                            <SocialUserCard
                                user={item}
                                onPress={(isFollowing) => (navigation as any).navigate('OtherProfile', { userId: item.id, initialFollowing: isFollowing })}
                            />
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
                            </View>
                        }
                    />

                    <WeeklyLeadersModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                        users={users}
                    />
                </>
            )}
        </View>
    );
};
