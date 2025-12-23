import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
    ArrowLeft,
    User,
    Bell,
    Ban,
    Sliders,
    Moon,
    Sun,
    Music,
    HelpCircle,
    Info,
    FileText,
    LogOut,
    Shield,
    MessageSquare,
    Trash2,
    Crown,
    VolumeX,
    Lock,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsMenuItem } from '../../components/SettingsMenuItem';
import { SettingsSection } from '../../components/SettingsSection';
import { ThemeSelectorModal } from '../../components/ThemeSelectorModal';
import { API_URL, userService } from '../../services/backendApi';
import { Linking } from 'react-native';

export const SettingsScreen = () => {
    const { user, logout, isLoading } = useAuth();
    const { theme, themeMode } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [isPrivateAccount, setIsPrivateAccount] = useState(user?.is_private || false);

    const handlePrivacyToggle = async (value: boolean) => {
        setIsPrivateAccount(value);
        try {
            await userService.updatePrivacy(value);
            Toast.show({
                type: 'success',
                text1: 'Kaydedildi',
                text2: value ? 'Hesabınız özel yapıldı.' : 'Hesabınız herkese açık yapıldı.',
                visibilityTime: 2000,
            });
        } catch (error) {
            // Revert on error
            setIsPrivateAccount(!value);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Ayar kaydedilemedi.',
            });
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const handleLogout = async () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        setLoggingOut(true);
                        try {
                            await logout();
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Hesabı Sil',
            'Bu işlem geri alınamaz! Tüm verileriniz kalıcı olarak silinecektir. Devam etmek istiyor musunuz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Hesabı Sil',
                    style: 'destructive',
                    onPress: () => {
                        Toast.show({
                            type: 'info',
                            text1: 'Hesap Silme',
                            text2: 'Bu özellik yakında aktif olacaktır.',
                        });
                    },
                },
            ]
        );
    };

    const handleSpotifyConnect = () => {
        if (user) {
            const authUrl = `${API_URL}/integrations/spotify_auth.php?user_id=${user.id}`;
            Linking.openURL(authUrl);
        }
    };

    const handleLastfmConnect = () => {
        Toast.show({
            type: 'info',
            text1: 'Last.fm',
            text2: 'Last.fm entegrasyonu yakında aktif olacaktır.',
        });
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
        loadingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayarlar</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profil Ayarları */}
                <SettingsSection title="Profil">
                    <SettingsMenuItem
                        icon={User}
                        label="Profili Düzenle"
                        description="İsim, kullanıcı adı, bio ve fotoğraf"
                        onPress={() => (navigation as any).navigate('EditProfile')}
                    />
                    <SettingsMenuItem
                        icon={Lock}
                        label="Özel Hesap"
                        description="Sadece takipçileriniz gönderilerinizi görebilir"
                        isToggle
                        toggleValue={isPrivateAccount}
                        onToggleChange={handlePrivacyToggle}
                    />
                </SettingsSection>

                {/* Bildirim Ayarları */}
                <SettingsSection title="Bildirimler">
                    <SettingsMenuItem
                        icon={Bell}
                        label="Bildirim Ayarları"
                        description="Push bildirimleri yönet"
                        onPress={() => (navigation as any).navigate('NotificationSettings')}
                    />
                </SettingsSection>

                {/* Gizlilik & Güvenlik */}
                <SettingsSection title="Gizlilik & Güvenlik">
                    <SettingsMenuItem
                        icon={Ban}
                        label="Engellenen Kullanıcılar"
                        description="Engellediğiniz hesapları yönetin"
                        onPress={() => (navigation as any).navigate('BlockedUsers')}
                        gradientColors={[theme.colors.error, '#B91C1C']}
                    />
                    <SettingsMenuItem
                        icon={VolumeX}
                        label="Sessiz Kullanıcılar"
                        description="Sessize aldığınız hesapları yönetin"
                        onPress={() => (navigation as any).navigate('MutedUsers')}
                    />
                    <SettingsMenuItem
                        icon={Shield}
                        label="Şifre Değiştir"
                        description="Hesap güvenliğinizi artırın"
                        onPress={() => (navigation as any).navigate('ChangePassword')}
                    />
                </SettingsSection>

                {/* İçerik Tercihleri */}
                <SettingsSection title="İçerik Tercihleri">
                    <SettingsMenuItem
                        icon={Sliders}
                        label="Akış Tercihleri"
                        description="Gizlenen ve önceliklenen içerikler"
                        onPress={() => (navigation as any).navigate('FeedPreferences')}
                    />
                </SettingsSection>

                {/* Görünüm */}
                <SettingsSection title="Görünüm">
                    <SettingsMenuItem
                        icon={themeMode === 'dark' ? Moon : Sun}
                        label="Tema"
                        description={themeMode === 'dark' ? 'Karanlık mod aktif' : themeMode === 'auto' ? 'Sistem teması aktif' : 'Aydınlık mod aktif'}
                        onPress={() => setThemeModalVisible(true)}
                    />
                </SettingsSection>

                {/* Entegrasyonlar */}
                <SettingsSection title="Entegrasyonlar">
                    <SettingsMenuItem
                        icon={Music}
                        label="Spotify"
                        description="Müzik dinleme geçmişinizi paylaşın"
                        onPress={handleSpotifyConnect}
                        gradientColors={['#1DB954', '#1ed760']}
                    />
                </SettingsSection>

                {/* Destek & Hakkında */}
                <SettingsSection title="Destek & Hakkında">
                    <SettingsMenuItem
                        icon={HelpCircle}
                        label="Yardım & Destek"
                        description="Sık sorulan sorular"
                        onPress={() => Toast.show({ type: 'info', text1: 'Yakında', text2: 'Yardım merkezi yakında açılacaktır.' })}
                    />
                    <SettingsMenuItem
                        icon={MessageSquare}
                        label="Geri Bildirim Gönder"
                        description="Öneri ve şikayetlerinizi iletin"
                        onPress={() => Linking.openURL('mailto:destek@mmreeo.online?subject=Uygulama Geri Bildirimi')}
                    />
                    <SettingsMenuItem
                        icon={FileText}
                        label="Gizlilik Politikası"
                        onPress={() => Linking.openURL('https://mmreeo.online/privacy')}
                    />
                    <SettingsMenuItem
                        icon={FileText}
                        label="Kullanım Koşulları"
                        onPress={() => Linking.openURL('https://mmreeo.online/terms')}
                    />
                    <SettingsMenuItem
                        icon={Info}
                        label="Hakkında"
                        description="Versiyon 1.0.0"
                        onPress={() => (navigation as any).navigate('About')}
                    />
                </SettingsSection>

                {/* Hesap */}
                <SettingsSection title="Hesap">
                    <SettingsMenuItem
                        icon={Crown}
                        label="Premium'a Geç"
                        description="Özel ayrıcalıklardan yararlan"
                        onPress={() => Toast.show({ type: 'info', text1: 'Premium', text2: 'Premium üyelik yakında aktif olacaktır.' })}
                        gradientColors={['#10b981', '#0d9488']}
                    />
                    <SettingsMenuItem
                        icon={Trash2}
                        label="Hesabı Sil"
                        description="Kalıcı olarak hesabınızı silin"
                        onPress={handleDeleteAccount}
                        danger
                    />
                    <SettingsMenuItem
                        icon={LogOut}
                        label="Çıkış Yap"
                        onPress={handleLogout}
                        danger
                    />
                </SettingsSection>
            </ScrollView>

            <ThemeSelectorModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} />

            {loggingOut && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            )}
        </View>
    );
};
