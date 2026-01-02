import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Alert, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
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
    Snowflake,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsMenuItem } from '../../components/SettingsMenuItem';
import { SettingsSection } from '../../components/SettingsSection';
import { ThemeSelectorModal } from '../../components/ThemeSelectorModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import { API_URL, userService, getAuthToken } from '../../services/backendApi';
import { Linking } from 'react-native';

export const SettingsScreen = () => {
    const { user, logout, isLoading } = useAuth();
    const { theme, themeMode } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [isPrivateAccount, setIsPrivateAccount] = useState(user?.is_private || false);
    const [freezeConfirmVisible, setFreezeConfirmVisible] = useState(false);
    const [freezeModalVisible, setFreezeModalVisible] = useState(false);
    const [freezePassword, setFreezePassword] = useState('');

    const { updateUser } = useAuth();

    const handlePrivacyToggle = async (value: boolean) => {
        setIsPrivateAccount(value);
        try {
            await userService.updatePrivacy(value);
            // Update AuthContext and AsyncStorage so the setting persists
            if (user) {
                await updateUser({ ...user, is_private: value });
            }
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

    const handleFreezeAccount = () => {
        setFreezeConfirmVisible(true);
    };

    const confirmFreezeAccount = async () => {
        if (!freezePassword) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifre gereklidir.' });
            return;
        }
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/auth/freeze_account.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: freezePassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setFreezeModalVisible(false);
                Toast.show({ type: 'success', text1: 'Başarılı', text2: data.message });
                await logout();
            } else {
                Toast.show({ type: 'error', text1: 'Hata', text2: data.message });
            }
        } catch (error: any) {
            console.error('Freeze Account Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Bağlantı Hatası',
                text2: error.message || 'Sunucuya ulaşılamadı.'
            });
        }
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
            fontSize: 20,
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
                        description="Yakında açılacak"
                        disabled
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
                        description="Yakında aktif olacak"
                        disabled
                        gradientColors={['#10b981', '#0d9488']}
                    />
                    <SettingsMenuItem
                        icon={Snowflake}
                        label="Hesabı Dondur"
                        description="Hesabınızı geçici olarak devre dışı bırakın"
                        onPress={handleFreezeAccount}
                        gradientColors={['#3b82f6', '#1d4ed8']}
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

            {/* Freeze Account Confirm Dialog */}
            <ThemedDialog
                visible={freezeConfirmVisible}
                title="Hesabı Dondur"
                message={`Hesabınızı dondurmak istiyor musunuz?

• Giriş yapamayacaksınız
• Profiliniz görünmeyecek
• Gönderileriniz gizlenecek

Tekrar giriş yaparak hesabınızı aktifleştirebilirsiniz.`}
                onClose={() => setFreezeConfirmVisible(false)}
                actions={[
                    { text: 'İptal', style: 'cancel', onPress: () => setFreezeConfirmVisible(false) },
                    {
                        text: 'Dondur',
                        style: 'destructive',
                        onPress: () => {
                            setFreezeConfirmVisible(false);
                            setFreezePassword('');
                            setFreezeModalVisible(true);
                        }
                    },
                ]}
            />

            {loggingOut && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            )}

            {/* Freeze Account Password Modal */}
            <Modal
                visible={freezeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFreezeModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 20,
                        width: '100%',
                        maxWidth: 320,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8
                        }}>
                            Şifre Doğrulama
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginBottom: 16
                        }}>
                            Güvenlik için şifrenizi girin:
                        </Text>
                        <TextInput
                            value={freezePassword}
                            onChangeText={setFreezePassword}
                            placeholder="Şifre"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            style={{
                                backgroundColor: theme.colors.background,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                color: theme.colors.text,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                marginBottom: 16,
                            }}
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setFreezeModalVisible(false)}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 8,
                                    backgroundColor: theme.colors.muted,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmFreezeAccount}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 8,
                                    backgroundColor: theme.colors.error,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Dondur</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
