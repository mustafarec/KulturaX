import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { login, isLoading } = useAuth();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: theme.spacing.l,
            justifyContent: 'center',
        },
        title: {
            ...theme.typography.h1,
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
            color: theme.colors.text,
        },
        inputContainer: {
            marginBottom: theme.spacing.l,
        },
        input: {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: theme.spacing.m,
            borderRadius: 8,
            marginBottom: theme.spacing.m,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        button: {
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.m,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: theme.spacing.m,
        },
        buttonText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        linkText: {
            color: theme.colors.secondary,
            textAlign: 'center',
            marginTop: theme.spacing.s,
        },
    }), [theme]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Eksik Bilgi',
                text2: 'Lütfen e-posta ve şifre alanlarını doldurunuz.',
            });
            return;
        }

        try {
            await login(email, password);
        } catch (error: any) {
            let errorMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.';
            let errorTitle = 'Hata';

            if (error.message === 'Kullanıcı bulunamadı.') {
                errorTitle = 'Hesap Bulunamadı';
                errorMessage = 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı. Lütfen kayıt olun.';
            } else if (error.message === 'Geçersiz şifre.') {
                errorTitle = 'Yanlış Şifre';
                errorMessage = 'Girdiğiniz şifre yanlış. Lütfen tekrar deneyiniz.';
            } else if (error.message === 'Network Error') {
                errorTitle = 'Bağlantı Hatası';
                errorMessage = 'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
            } else if (error.message === 'Geçersiz email formatı.') {
                errorTitle = 'Geçersiz Format';
                errorMessage = 'Lütfen geçerli bir e-posta adresi giriniz.';
            }

            Toast.show({
                type: 'error',
                text1: errorTitle,
                text2: errorMessage,
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tekrar Hoşgeldiniz</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Şifre"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
                <Text style={styles.linkText}>Hesabınız yok mu? Kayıt Olun</Text>
            </TouchableOpacity>
        </View>
    );
};


