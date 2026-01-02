import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { getDefaultAvatar } from '../../utils/DefaultImages';

const FollowUserItem = ({ user, currentUserId, onFollowUpdate }: { user: any, currentUserId: number, onFollowUpdate: (id: number, isFollowing: boolean) => void }) => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const [isFollowing, setIsFollowing] = useState(user.is_following);
    const [loading, setLoading] = useState(false);

    const handleFollowToggle = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await userService.followUser(user.id);
            setIsFollowing(response.is_following);
            onFollowUpdate(user.id, response.is_following);

            Toast.show({
                type: 'success',
                text1: response.is_following ? 'Takip Ediliyor' : 'Takip Bırakıldı'
            });

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız.' });
        } finally {
            setLoading(false);
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            marginBottom: 8,
            borderRadius: 12,
            ...theme.shadows.soft,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            marginRight: 12,
        },
        infoContainer: {
            flex: 1,
        },
        name: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.text,
        },
        username: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        followButton: {
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderRadius: 20,
            borderWidth: 1,
            backgroundColor: isFollowing ? theme.colors.surface : theme.colors.text,
            borderColor: isFollowing ? theme.colors.border : theme.colors.text,
        },
        followButtonText: {
            fontSize: 12,
            fontWeight: '600',
            color: isFollowing ? theme.colors.text : theme.colors.background,
        },
    }), [theme, isFollowing]);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => (navigation as any).push('OtherProfile', { userId: user.id })}
        >
            <Image
                source={{ uri: user.avatar_url || getDefaultAvatar(user.username || user.full_name) }}
                style={styles.avatar}
            />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{user.full_name || user.username}</Text>
                <Text style={styles.username}>@{user.username}</Text>
            </View>

            {currentUserId !== user.id && (
                <TouchableOpacity
                    style={styles.followButton}
                    onPress={handleFollowToggle}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={isFollowing ? theme.colors.text : theme.colors.background} />
                    ) : (
                        <Text style={styles.followButtonText}>
                            {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                        </Text>
                    )}
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export const FollowListScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { userId, type } = route.params as { userId: number, type: 'followers' | 'following' };
    const { user: currentUser } = useAuth();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [userId, type]);

    const fetchUsers = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Fetch the list to display AND current user's following list for verification
            const listPromise = userService.getConnections(userId, type, currentUser.id);
            const myFollowingPromise = userService.getConnections(currentUser.id, 'following');

            const [data, myFollowing] = await Promise.all([
                listPromise,
                myFollowingPromise
            ]);

            // Create set of IDs I follow
            const myFollowingIds = new Set<number>();
            if (Array.isArray(myFollowing)) {
                myFollowing.forEach((u: any) => myFollowingIds.add(u.id));
            }

            // Update is_following for the list
            const updatedData = Array.isArray(data) ? data.map((u: any) => ({
                ...u,
                is_following: myFollowingIds.has(u.id)
            })) : [];

            setUsers(updatedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10,
        },
        backButton: {
            marginRight: 16,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        listContent: {
            paddingTop: 16,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: 40,
            color: theme.colors.textSecondary,
        },
    }), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <FollowUserItem
                            user={item}
                            currentUserId={currentUser?.id || 0}
                            onFollowUpdate={(id, isFollowing) => {
                                // Optional logic: could update local state if needed
                            }}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Henüz kimse yok.</Text>
                    }
                />
            )}
        </View>
    );
};
