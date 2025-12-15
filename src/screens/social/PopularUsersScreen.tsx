import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/backendApi';
import { UserCard } from '../../components/UserCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const PopularUsersScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
        } catch (error) {
            console.log('Popular Users Fetch Error:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
            setRefreshing(false);
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
            )}
        </View>
    );
};
