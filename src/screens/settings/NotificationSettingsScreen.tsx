import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import {
    ArrowLeft,
    Bell,
    Heart,
    MessageCircle,
    UserPlus,
    Mail,
    Repeat,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/backendApi';
import { SettingsMenuItem } from '../../components/SettingsMenuItem';
import { SettingsSection } from '../../components/SettingsSection';

interface NotificationSettings {
    push_enabled: boolean;
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
    reposts: boolean;
}

export const NotificationSettingsScreen = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<NotificationSettings>({
        push_enabled: true,
        likes: true,
        comments: true,
        follows: true,
        messages: true,
        reposts: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getSettings();
            setSettings(data);
        } catch (error) {
            console.log('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof NotificationSettings) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));

        try {
            await notificationService.updateSettings({ [key]: newValue });
            Toast.show({
                type: 'success',
                text1: 'Kaydedildi',
                text2: 'Bildirim tercihiniz güncellendi.',
                visibilityTime: 1500,
            });
        } catch (error) {
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: !newValue }));
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Ayar kaydedilemedi.',
            });
        }
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
        scrollContent: {
            paddingTop: 16,
            paddingBottom: 40,
        },
        infoText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            paddingHorizontal: 20,
            paddingBottom: 16,
            lineHeight: 18,
        },
    });

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.infoText}>
                    Hangi bildirimler almak istediğinizi buradan yönetin. Kapatılan bildirimler telefonunuza gönderilmeyecektir.
                </Text>

                <SettingsSection title="Genel">
                    <SettingsMenuItem
                        icon={Bell}
                        label="Push Bildirimleri"
                        description="Tüm bildirimleri aç/kapat"
                        isToggle
                        toggleValue={settings.push_enabled}
                        onToggleChange={() => handleToggle('push_enabled')}
                    />
                </SettingsSection>

                <SettingsSection title="Etkileşimler">
                    <SettingsMenuItem
                        icon={Heart}
                        label="Beğeniler"
                        description="Gönderileriniz beğenildiğinde"
                        isToggle
                        toggleValue={settings.likes}
                        onToggleChange={() => handleToggle('likes')}
                    />
                    <SettingsMenuItem
                        icon={MessageCircle}
                        label="Yorumlar"
                        description="Gönderilerinize yorum yapıldığında"
                        isToggle
                        toggleValue={settings.comments}
                        onToggleChange={() => handleToggle('comments')}
                    />
                    <SettingsMenuItem
                        icon={Repeat}
                        label="Yeniden Paylaşımlar"
                        description="Gönderileriniz paylaşıldığında"
                        isToggle
                        toggleValue={settings.reposts}
                        onToggleChange={() => handleToggle('reposts')}
                    />
                </SettingsSection>

                <SettingsSection title="Sosyal">
                    <SettingsMenuItem
                        icon={UserPlus}
                        label="Yeni Takipçiler"
                        description="Biri sizi takip ettiğinde"
                        isToggle
                        toggleValue={settings.follows}
                        onToggleChange={() => handleToggle('follows')}
                    />
                    <SettingsMenuItem
                        icon={Mail}
                        label="Mesajlar"
                        description="Yeni mesaj aldığınızda"
                        isToggle
                        toggleValue={settings.messages}
                        onToggleChange={() => handleToggle('messages')}
                    />
                </SettingsSection>
            </ScrollView>
        </View>
    );
};
