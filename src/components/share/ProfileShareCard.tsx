import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { User } from 'lucide-react-native';
import { getStyles } from '../styles/ShareCardModal.styles';

interface ProfileShareCardProps {
    coverUrl?: string;
    username?: string;
    bio?: string;
    followerCount?: number;
    postCount?: number;
}

export const ProfileShareCard: React.FC<ProfileShareCardProps> = ({
    coverUrl,
    username,
    bio,
    followerCount,
    postCount,
}) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const cardTextSecondary = theme.colors.textSecondary;
    const isDark = theme.dark;
    const avatarPlaceholderBg = isDark ? '#333' : '#E5E5E5';

    return (
        <View style={styles.profileCard}>
            {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.profileAvatar} />
            ) : (
                <View style={[styles.profileAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: avatarPlaceholderBg }]}>
                    <User size={48} color={cardTextSecondary} />
                </View>
            )}
            <Text style={styles.profileUsername}>@{username}</Text>
            {bio && <Text style={styles.profileBio} numberOfLines={3}>{bio}</Text>}
            <View style={styles.profileStats}>
                {followerCount !== undefined && (
                    <View style={styles.profileStat}>
                        <Text style={styles.profileStatNumber}>{followerCount}</Text>
                        <Text style={styles.profileStatLabel}>Takipçi</Text>
                    </View>
                )}
                {postCount !== undefined && (
                    <View style={styles.profileStat}>
                        <Text style={styles.profileStatNumber}>{postCount}</Text>
                        <Text style={styles.profileStatLabel}>Gönderi</Text>
                    </View>
                )}
            </View>
            <View style={styles.branding}>
                <Text style={styles.brandingText}>📱 KültüraX</Text>
            </View>
        </View>
    );
};
