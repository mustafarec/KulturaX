import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const VerificationScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { theme } = useTheme();
    const { verifyEmail, resendEmailCode } = useAuth();
    const [loading, setLoading] = useState(false);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            padding: theme.spacing.l,
            justifyContent: 'center',
            backgroundColor: theme.colors.background,
        },
        title: {
            ...theme.typography.h1,
            marginBottom: theme.spacing.s,
            textAlign: 'center',
            color: theme.colors.text,
        },
        subtitle: {
            ...theme.typography.body,
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
            color: theme.colors.textSecondary,
        },
        input: {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: theme.spacing.m,
            borderRadius: 8,
            marginBottom: theme.spacing.m,
            borderWidth: 1,
            borderColor: theme.colors.border,
            textAlign: 'center',
            fontSize: 20,
            letterSpacing: 5,
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
        resendButton: {
            padding: theme.spacing.m,
            alignItems: 'center',
        },
        disabledButton: {
            opacity: 0.5,
        },
        resendText: {
            color: theme.colors.secondary,
            fontSize: 14,
        },
    }), [theme]);

    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (route.params && (route.params as any).email) {
            setEmail((route.params as any).email);
        }
    }, [route.params]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Lütfen 6 haneli doğrulama kodunu giriniz.',
            });
            return;
        }

        setLoading(true);
        try {
            await verifyEmail(email, code);
            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Hesabınız doğrulandı.',
            });
            // Navigate to Main or Login depending on auth flow
            // Since verifyEmail in context handles login, we might be redirected automatically if we listen to user state
            // But let's ensure navigation
            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: 'Main' }],
            // });
        } catch (error) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            await resendEmailCode(email);
            setTimer(120); // 120 seconds cooldown
            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Yeni kod gönderildi.',
            });
        } catch (error) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hesap Doğrulama</Text>
            <Text style={styles.subtitle}>
                {email} adresine gönderilen 6 haneli kodu giriniz.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Doğrulama Kodu"
                placeholderTextColor={theme.colors.textSecondary}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
            />

            <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>Doğrula</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.resendButton, timer > 0 && styles.disabledButton]}
                onPress={handleResend}
                disabled={timer > 0 || loading}
            >
                <Text style={styles.resendText}>
                    {timer > 0 ? `Tekrar Gönder (${timer}s)` : "Kodu Tekrar Gönder"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};


