import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const SettingsScreen = () => {
    const { user, logout } = useAuth();

    const handleConnect = (service: string) => {
        if (service === 'Spotify') {
            if (user) {
                const authUrl = `https://mmreeo.online/api/integrations/spotify_auth.php?user_id=${user.id}`;
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ayarlar</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Müzik Servisleri</Text>
                <Text style={styles.sectionDescription}>
                    Dinlediğiniz müzikleri profilinizde göstermek için hesaplarınızı bağlayın.
                </Text>

                <TouchableOpacity
                    style={[styles.connectButton, { backgroundColor: '#1DB954' }]}
                    onPress={() => handleConnect('Spotify')}
                >
                    <Text style={styles.buttonIcon}>🎧</Text>
                    <Text style={styles.buttonText}>Spotify ile Bağlan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.connectButton, { backgroundColor: '#D51007' }]}
                    onPress={() => handleConnect('Last.fm')}
                >
                    <Text style={styles.buttonIcon}>📻</Text>
                    <Text style={styles.buttonText}>Last.fm ile Bağlan</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hesap</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#7F8C8D',
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        backgroundColor: '#FFF5F5',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    logoutText: {
        color: '#FF6B6B',
        fontWeight: '700',
        fontSize: 16,
    },
});
