import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Image, Linking, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import {
    ArrowLeft,
    Github,
    Globe,
    Mail,
    Heart,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import { RefreshCcw } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

import { checkForUpdates, applyOTAUpdate, openStore } from '../../services/UpdateService';
import { version as appVersion } from '../../../package.json';
import Toast from 'react-native-toast-message';

export const AboutScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [checkingUpdate, setCheckingUpdate] = React.useState(false);

    const APP_VERSION = appVersion;
    const BUILD_NUMBER = '28';

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
        content: {
            flex: 1,
            alignItems: 'center',
            paddingTop: 40,
            paddingHorizontal: 20,
        },
        logoContainer: {
            width: 100,
            height: 100,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
        logo: {
            width: 80,
            height: 80,
            resizeMode: 'contain',
        },
        appName: {
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 4,
        },
        version: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 24,
        },
        description: {
            fontSize: 15,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
            paddingHorizontal: 20,
        },
        linksContainer: {
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden',
        },
        linkItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        linkItemLast: {
            borderBottomWidth: 0,
        },
        linkIcon: {
            marginRight: 16,
        },
        linkText: {
            fontSize: 16,
            color: theme.colors.text,
            fontWeight: '500',
        },
        footer: {
            marginTop: 'auto',
            paddingVertical: 30,
            alignItems: 'center',
        },
        footerText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        madeWith: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
        },
        madeWithText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
    });

    const LinkItem = ({ icon: Icon, label, url, isLast = false, onPress, loading = false }: { icon: any, label: string, url?: string, isLast?: boolean, onPress?: () => void, loading?: boolean }) => (
        <TouchableOpacity
            style={[styles.linkItem, isLast && styles.linkItemLast]}
            onPress={onPress || (() => url && Linking.openURL(url))}
            disabled={loading}
        >
            <Icon size={20} color={theme.colors.primary} style={styles.linkIcon} />
            <Text style={styles.linkText}>{label}</Text>
            {loading && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 'auto' }} />}
        </TouchableOpacity>
    );

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        try {
            const result = await checkForUpdates();

            if (result.hasOTAUpdate) {
                Alert.alert(
                    'Güncelleme Mevcut',
                    'Uygulamanın yeni bir sürümü indirilebilir. Şimdi uygulansın mı?',
                    [
                        { text: 'Daha Sonra', style: 'cancel' },
                        {
                            text: 'Güncelle',
                            onPress: async () => {
                                try {
                                    Toast.show({ type: 'info', text1: 'Güncelleniyor', text2: 'Uygulama yeniden başlatılacak...' });
                                    await applyOTAUpdate();
                                } catch (e) {
                                    Toast.show({ type: 'error', text1: 'Hata', text2: 'Güncelleme uygulanamadı.' });
                                }
                            }
                        }
                    ]
                );
            } else if (result.hasNativeUpdate) {
                Alert.alert(
                    'Yeni Versiyon',
                    `Yeni sürüm (${result.latestVersion}) mağazada mevcut. Güncellemek ister misiniz?`,
                    [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Mağazaya Git', onPress: () => openStore(result.updateUrl) }
                    ]
                );
            } else {
                Toast.show({
                    type: 'success',
                    text1: 'Güncel',
                    text2: 'Uygulamanız en son sürümde.',
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Güncelleme kontrolü yapılamadı.',
            });
        } finally {
            setCheckingUpdate(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hakkında</Text>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.content}>
                    <LinearGradient
                        colors={[theme.colors.secondary, theme.colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logoContainer}
                    >
                        <Image
                            source={require('../../assets/images/header_logo.png')}
                            style={styles.logo}
                        />
                    </LinearGradient>

                    <Text style={styles.appName}>KültüraX</Text>
                    <Text style={styles.version}>Versiyon {APP_VERSION} ({BUILD_NUMBER})</Text>
                    {!__DEV__ && (
                        <Text style={[styles.version, { marginTop: -16, fontSize: 12 }]}>
                            Channel: {Updates.channel || (Constants.expoConfig as any)?.updates?.channel || 'production (local)'} | RV: {Updates.runtimeVersion || '1.0.0'}

                        </Text>

                    )}

                    <Text style={styles.description}>
                        Kitaplar, filmler ve müzikler hakkında düşüncelerinizi paylaşın,
                        ilham veren insanlarla tanışın ve kültürel yolculuğunuzu zenginleştirin.
                    </Text>

                    <View style={styles.linksContainer}>
                        <LinkItem
                            icon={RefreshCcw}
                            label="Güncellemeleri Denetle"
                            onPress={handleCheckUpdate}
                            loading={checkingUpdate}
                        />
                        <LinkItem
                            icon={Globe}
                            label="Web Sitemizi Ziyaret Edin"
                            url="https://mmreeo.online"
                        />
                        <LinkItem
                            icon={Mail}
                            label="Bize Ulaşın"
                            url="mailto:destek@mmreeo.online"
                        />
                        <LinkItem
                            icon={Github}
                            label="Açık Kaynak Lisansları"
                            url="https://mmreeo.online/licenses"
                            isLast
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 Acacia Node. Tüm hakları saklıdır.</Text>
                    <View style={styles.madeWith}>
                        <Text style={styles.madeWithText}>Türkiye'de </Text>
                        <Heart size={14} color={theme.colors.error} fill={theme.colors.error} />
                        <Text style={styles.madeWithText}> ile yapıldı</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};
