import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/backendApi';
import { UserCard } from '../../components/UserCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyLeadersModal } from '../../components/WeeklyLeadersModal';

export const PopularUsersScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchPopularUsers = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await userService.getPopularUsers();

            // Ekstra güvenlik: Frontend tarafında da boş veya hatalı kayıtları filtrele
            const validUsers = Array.isArray(data) ? data.filter(user =>
                user &&
                user.id &&
                user.username &&
                user.username.trim() !== '' &&
                user.name &&
                user.name.trim() !== ''
            ) : [];

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
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginLeft: 16,
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
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Popüler Kullanıcılar</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <>
                    <FlatList
                        data={users}
                        keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                        }
                        renderItem={({ item }) => (
                            <UserCard
                                user={item}
                                onPress={() => (navigation as any).navigate('OtherProfile', { userId: item.id })}
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
                        users={users} // Backend tüm veriyi zaten dönüyor
                    />
                </>
            )}
        </View>
    );
};
