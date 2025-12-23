import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react-native';



export const SuggestedUsers = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchSuggested = async () => {
            try {
                const data = await userService.getSuggestedUsers(user.id);
                setUsers(data);
            } catch (error) {
                console.error("Failed to load suggested users", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggested();
    }, [user]);

    const handleFollow = async (followedId: number) => {
        if (!user) return;
        setUsers(prev => prev.filter(u => u.id !== followedId));
        try {
            await userService.followUser(followedId);
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleHide = async () => {
        if (!user) return;

        // Optimistic hide
        setHidden(true);
        // Toast.show({ type: 'success', text1: 'Gizlendi', text2: 'Bu alan 24 saat boyunca gösterilmeyecek.' });

        try {
            // Hide for 24 hours
            await userService.savePreference(user.id, 'hide_suggested_users', 'true', 24);
        } catch (error) {
            console.error("Failed to save preference", error);
        }
    };

    if (loading || hidden) return null;
    if (users.length === 0) return null;

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => (navigation as any).navigate('OtherProfile', { userId: item.id })}
        >
            <View style={styles.avatarContainer}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {(item.username || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{item.name} {item.surname}</Text>
                <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
            </View>

            <TouchableOpacity
                style={styles.followButton}
                onPress={() => handleFollow(item.id)}
            >
                <Text style={styles.followButtonText}>Takip Et</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const styles = StyleSheet.create({
        container: {
            marginVertical: 10,
            paddingVertical: 10,
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.colors.border,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingRight: 16,
            marginBottom: 10,
        },
        headerText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginLeft: 16,
        },
        closeButton: {
            padding: 4,
        },
        listContent: {
            paddingHorizontal: 12,
        },
        card: {
            width: 140,
            height: 180,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            marginHorizontal: 6,
            padding: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        avatarContainer: {
            marginTop: 8,
        },
        avatar: {
            width: 60,
            height: 60,
            borderRadius: 30,
        },
        avatarPlaceholder: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarText: {
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 'bold',
        },
        infoContainer: {
            alignItems: 'center',
            width: '100%',
        },
        name: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
            textAlign: 'center',
        },
        username: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
        followButton: {
            backgroundColor: theme.colors.primary,
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderRadius: 20,
            width: '100%',
            alignItems: 'center',
        },
        followButtonText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerText}>Kimi takip etmeli</Text>
                <TouchableOpacity onPress={handleHide} style={styles.closeButton}>
                    <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <FlatList
                horizontal
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};
