import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../services/backendApi';

export const SettingsScreen = () => {
    const { user, logout, isLoading } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const handleConnect = (service: string) => {
        if (service === 'Spotify') {
            if (user) {
                const authUrl = `${API_URL}/integrations/spotify_auth.php?user_id=${user.id}`;
                Linking.openURL(authUrl);
            }
        } else if (service === 'Last.fm') {
            // Last.fm için kullanıcı adı alma mantığı eklenecek
            // Şimdilik basit bir uyarı
            Toast.show({
                type: 'info',
                text1: 'Last.fm',
                text2: 'Last.fm entegrasyonu için kullanıcı adınızı girmeniz gerekecek. Bu özellik bir sonraki güncellemede aktif olacak.',
            });
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: 40,
            paddingBottom: 20,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.background,
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
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text,
        },
        section: {
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 8,
        },
        sectionDescription: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
        },
        connectButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            borderRadius: 12,
            marginBottom: 12,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        buttonIcon: {
            fontSize: 20,
            marginRight: 8,
            color: '#FFFFFF',
        },
        buttonText: {
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 16,
        },
        logoutButton: {
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.error,
        },
        logoutText: {
            color: theme.colors.error,
            fontWeight: '700',
            fontSize: 16,
        },
    }), [theme]);

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayarlar</Text>
            </View>



            <View style={styles.section}>
                <Text style={styles.sectionTitle}>İçerik Tercihleri</Text>
                <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => (navigation as any).navigate('FeedPreferences')}
                >
                    <Icon name="equalizer" style={[styles.buttonIcon, { color: theme.colors.primary }]} />
                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>Akış Tercihleri</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => (navigation as any).navigate('BlockedUsers')}
                >
                    <Icon name="ban" style={[styles.buttonIcon, { color: theme.colors.error }]} />
                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>Engellenen Kullanıcılar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hesap</Text>
                <TouchableOpacity
                    style={[styles.logoutButton, isLoading && { opacity: 0.7 }]}
                    onPress={logout}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.error} />
                    ) : (
                        <Text style={styles.logoutText}>Çıkış Yap</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};


