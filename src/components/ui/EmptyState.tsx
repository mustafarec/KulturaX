import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox, Bell, Users, MessageCircle, Bookmark, Search } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
    type: 'messages' | 'notifications' | 'followers' | 'following' | 'saved' | 'search' | 'posts';
    title?: string;
    description?: string;
}

const iconMap = {
    messages: MessageCircle,
    notifications: Bell,
    followers: Users,
    following: Users,
    saved: Bookmark,
    search: Search,
    posts: Inbox,
};

const defaultContent = {
    messages: {
        title: 'Henüz mesaj yok',
        description: 'Birine mesaj göndererek sohbete başlayın',
    },
    notifications: {
        title: 'Bildirim yok',
        description: 'Yeni bildirimler burada görünecek',
    },
    followers: {
        title: 'Henüz takipçi yok',
        description: 'Profiliniz takip edildiğinde burada görünecek',
    },
    following: {
        title: 'Henüz kimseyi takip etmiyorsunuz',
        description: 'Keşfet sekmesinden kullanıcıları bulun',
    },
    saved: {
        title: 'Kaydedilen gönderi yok',
        description: 'Beğendiğiniz gönderileri kaydedin',
    },
    search: {
        title: 'Sonuç bulunamadı',
        description: 'Farklı anahtar kelimeler deneyin',
    },
    posts: {
        title: 'Henüz gönderi yok',
        description: 'İlk gönderinizi paylaşın',
    },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type, title, description }) => {
    const { theme } = useTheme();
    const IconComponent = iconMap[type];
    const content = defaultContent[type];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
            paddingHorizontal: 40,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
        },
        title: {
            ...theme.typography.h3,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 8,
        },
        description: {
            ...theme.typography.body,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <IconComponent size={36} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.title}>{title || content.title}</Text>
            <Text style={styles.description}>{description || content.description}</Text>
        </View>
    );
};
