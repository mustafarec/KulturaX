import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface UserCardProps {
    user: {
        id: number;
        username: string;
        name: string;
        surname: string;
        avatar_url?: string;
        follower_count?: number;
        total_views?: number;
    };
    onPress: () => void;
}

const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
    const { theme } = useTheme();

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
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: 'bold',
        },
        infoContainer: {
            flex: 1,
        },
        followerContainer: {
            marginLeft: 8,
            alignItems: 'flex-end',
        },
        name: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        username: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        followerText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontWeight: '500',
        },
    }), [theme]);

    const displayStats = () => {
        if (user.total_views !== undefined && user.total_views > 0) {
            return `${formatNumber(user.total_views)} Görüntülenme`;
        }
        if (user.follower_count !== undefined) {
            return `${formatNumber(user.follower_count)} Takipçi`;
        }
        return '';
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                        {(user.username || '?').charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{user.name} {user.surname}</Text>
                <Text style={styles.username}>@{user.username}</Text>
            </View>

            <View style={styles.followerContainer}>
                <Text style={styles.followerText}>{displayStats()}</Text>
            </View>
        </TouchableOpacity>
    );
};
