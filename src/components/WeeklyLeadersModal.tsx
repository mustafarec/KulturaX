import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Trophy, Medal, Award, Star, PenTool, Heart, MessageCircle, Eye } from 'lucide-react-native';

interface LeaderUser {
    id: number;
    username: string;
    name: string;
    surname: string;
    avatar_url?: string;
    total_views: number;
    total_likes: number;
    total_comments: number;
    post_count: number;
}

interface WeeklyLeadersModalProps {
    visible: boolean;
    onClose: () => void;
    users: LeaderUser[];
}

const { width } = Dimensions.get('window');

const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const WeeklyLeadersModal: React.FC<WeeklyLeadersModalProps> = ({ visible, onClose, users }) => {
    const { theme } = useTheme();

    if (!users || users.length === 0) return null;

    const topUsers = users.slice(0, 3);

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return '#FFD700'; // Gold
            case 1: return '#C0C0C0'; // Silver
            case 2: return '#CD7F32'; // Bronze
            default: return theme.colors.textSecondary;
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return Trophy;
            case 1: return Medal;
            case 2: return Award;
            default: return Star;
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            width: width * 0.9,
            maxHeight: '80%',
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: 24,
            ...theme.shadows.soft,
        },
        header: {
            alignItems: 'center',
            marginBottom: 24,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.primary,
            marginBottom: 8,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
        card: {
            backgroundColor: theme.colors.background,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20, // Alt kartla mesafe
            marginTop: 15, // Üstten taşan rozet için güvenli alan
            marginHorizontal: 20, // Yandan taşan rozet için güvenli alan (left: -15 olduğu için en az 15 lazım)
            borderWidth: 1,
            flexDirection: 'column',
        },
        rankBadge: {
            position: 'absolute',
            top: -15,
            left: -15,
            width: 40, // Biraz daha büyüttüm
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999, // En üstte kalması için
            elevation: 5, // Android gölgesi
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.20,
            shadowRadius: 1.41,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
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
        nameContainer: {
            flex: 1,
        },
        name: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        username: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        statsGrid: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: 12,
            padding: 10,
        },
        statItem: {
            alignItems: 'center',
            flex: 1,
        },
        statValue: {
            fontSize: 13,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 2,
        },
        statLabel: {
            fontSize: 10,
            color: theme.colors.textSecondary,
        },
        closeButton: {
            marginTop: 8,
            backgroundColor: theme.colors.primary,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
        },
        closeButtonText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
        },
    }), [theme]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Trophy size={48} color={theme.colors.primary} style={{ marginBottom: 10 }} />
                        <Text style={styles.title}>Geçen Haftanın Liderleri</Text>
                        <Text style={styles.subtitle}>Geçen hafta en çok etkileşimi alan ve topluluğa değer katan kullanıcılarımız.</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {topUsers.map((user, index) => (
                            <View key={user.id} style={[styles.card, { borderColor: getRankColor(index) }]}>
                                <View style={[styles.rankBadge, { backgroundColor: getRankColor(index) }]}>
                                    {React.createElement(getRankIcon(index), { size: 16, color: "#FFF" })}
                                </View>

                                <View style={styles.userInfo}>
                                    {user.avatar_url ? (
                                        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Text style={styles.avatarText}>{(user.username || '?').charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View style={styles.nameContainer}>
                                        <Text style={styles.name}>{user.name} {user.surname}</Text>
                                        <Text style={styles.username}>@{user.username}</Text>
                                    </View>
                                </View>

                                <View style={styles.statsGrid}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{formatNumber(user.post_count)}</Text>
                                        <PenTool size={14} color={theme.colors.textSecondary} />
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{formatNumber(user.total_likes)}</Text>
                                        <Heart size={14} color={theme.colors.textSecondary} />
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{formatNumber(user.total_comments)}</Text>
                                        <MessageCircle size={14} color={theme.colors.textSecondary} />
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: theme.colors.primary }]}>{formatNumber(user.total_views)}</Text>
                                        <Eye size={14} color={theme.colors.textSecondary} />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Harika!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
