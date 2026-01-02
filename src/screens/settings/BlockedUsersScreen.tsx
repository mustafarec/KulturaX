import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/backendApi';
import { ArrowLeft, UserX } from 'lucide-react-native';
import { ThemedDialog } from '../../components/ThemedDialog';
import Toast from 'react-native-toast-message';
import { getDefaultAvatar } from '../../utils/DefaultImages';

export const BlockedUsersScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unblockDialogVisible, setUnblockDialogVisible] = useState(false);
    const [selectedUserToUnblock, setSelectedUserToUnblock] = useState<any>(null);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: insets.top + 10,
            paddingBottom: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        backButton: {
            padding: 8,
            marginRight: 16,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        listContainer: {
            padding: 20,
        },
        userCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        avatar: {
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: 12,
            backgroundColor: theme.colors.secondary,
        },
        userInfo: {
            flex: 1,
        },
        full_name: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        username: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        unblockButton: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: theme.colors.primary,
            borderRadius: 20,
        },
        unblockButtonText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        emptyText: {
            marginTop: 16,
            fontSize: 16,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
    });

    const fetchBlockedUsers = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getBlockedUsers();
            setBlockedUsers(data);
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Engellenen kullanıcılar yüklenemedi.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const confirmUnblock = (user: any) => {
        setSelectedUserToUnblock(user);
        setUnblockDialogVisible(true);
    };

    const handleUnblock = async () => {
        if (!selectedUserToUnblock) return;

        try {
            await userService.unblockUser(selectedUserToUnblock.id);
            setBlockedUsers(prev => prev.filter(u => u.id !== selectedUserToUnblock.id));
            Toast.show({
                type: 'success',
                text1: 'Engel Kaldırıldı',
                text2: `@${selectedUserToUnblock.username} artık engelli değil.`
            });
            setUnblockDialogVisible(false);
            setSelectedUserToUnblock(null);
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'İşlem başarısız.'
            });
            setUnblockDialogVisible(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <Image
                source={{ uri: item.avatar_url || getDefaultAvatar(item.username || item.full_name) }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.full_name}>{item.full_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
            <TouchableOpacity style={styles.unblockButton} onPress={() => confirmUnblock(item)}>
                <Text style={styles.unblockButtonText}>Kaldır</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Engellenen Kullanıcılar</Text>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <UserX size={48} color={theme.colors.textSecondary} style={{ opacity: 0.5 }} />
                            <Text style={styles.emptyText}>Engellenen kullanıcı bulunmuyor.</Text>
                        </View>
                    }
                />
            )}

            <ThemedDialog
                visible={unblockDialogVisible}
                title="Engeli Kaldır"
                message={`@${selectedUserToUnblock?.username} kullanıcısının engelini kaldırmak istiyor musunuz?`}
                actions={[
                    {
                        text: 'Vazgeç',
                        style: 'cancel',
                        onPress: () => setUnblockDialogVisible(false)
                    },
                    {
                        text: 'Engeli Kaldır',
                        style: 'default', // or success if available, default is usually primary color
                        onPress: handleUnblock
                    }
                ]}
                onClose={() => setUnblockDialogVisible(false)}
            />
        </View>
    );
};
