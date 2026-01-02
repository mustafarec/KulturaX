import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ArrowLeft, VolumeX, Volume2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/backendApi';

interface MutedUser {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
    muted_at: string;
}

export const MutedUsersScreen = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMutedUsers();
    }, []);

    const fetchMutedUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getMutedUsers();
            setMutedUsers(data || []);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Sessiz kullanıcılar yüklenemedi.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnmute = (userId: number, username: string) => {
        Alert.alert(
            'Sessizi Kaldır',
            `@${username} kullanıcısının sessizliğini kaldırmak istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kaldır',
                    onPress: async () => {
                        try {
                            await userService.unmuteUser(userId);
                            setMutedUsers(prev => prev.filter(u => u.id !== userId));
                            Toast.show({
                                type: 'success',
                                text1: 'Başarılı',
                                text2: `@${username} sessizliği kaldırıldı.`,
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Hata',
                                text2: 'İşlem başarısız oldu.',
                            });
                        }
                    }
                }
            ]
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: insets.top + 10,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
        },
        backButton: {
            marginRight: 16,
            padding: 4,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: '700',
            color: theme.colors.text,
        },
        infoText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            padding: 20,
            lineHeight: 20,
            backgroundColor: theme.colors.background,
        },
        list: {
            flex: 1,
        },
        listContent: {
            paddingVertical: 8,
        },
        userItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        avatar: {
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: 12,
        },
        avatarPlaceholder: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        avatarText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        userInfo: {
            flex: 1,
        },
        fullName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        username: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        unmuteButton: {
            padding: 10,
            borderRadius: 8,
            backgroundColor: theme.colors.background,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        emptyIcon: {
            marginBottom: 16,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });

    const renderItem = ({ item }: { item: MutedUser }) => (
        <View style={styles.userItem}>
            {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={styles.fullName}>{item.full_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
            <TouchableOpacity
                style={styles.unmuteButton}
                onPress={() => handleUnmute(item.id, item.username)}
            >
                <Volume2 size={22} color={theme.colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <VolumeX size={48} color={theme.colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Sessiz Kullanıcı Yok</Text>
            <Text style={styles.emptyText}>
                Sessize aldığınız kullanıcılar burada görünecektir. Bir kullanıcıyı profil sayfasından sessize alabilirsiniz.
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sessiz Kullanıcılar</Text>
            </View>

            <Text style={styles.infoText}>
                Sessize aldığınız kullanıcıların gönderileri akışınızda gösterilmez, ancak profillerini ziyaret edebilir ve mesaj gönderebilirsiniz.
            </Text>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={mutedUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={mutedUsers.length === 0 ? { flex: 1 } : styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    style={styles.list}
                />
            )}
        </View>
    );
};
