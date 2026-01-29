import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ThemedDialog } from '../../components/ThemedDialog';
import { API_URL } from '../../services/backendApi';

interface ApiError {
    message: string;
    code?: string;
    is_frozen?: boolean;
    frozen_at?: string;
    retry_after?: number;
    retry_after_minutes?: number;
}

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { login, isFirstLaunch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [touched, setTouched] = useState({ email: false, password: false });
    const [frozenDialogVisible, setFrozenDialogVisible] = useState(false);

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
        inputWrapper: {
            marginBottom: theme.spacing.m,
        },
        input: {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: theme.spacing.m,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            fontSize: 16,
        },
        inputError: {
            borderColor: theme.colors.error,
        },
        errorText: {
            color: theme.colors.error,
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        passwordContainerError: {
            borderColor: theme.colors.error,
        },
        passwordInput: {
            flex: 1,
            color: theme.colors.text,
            padding: theme.spacing.m,
            fontSize: 16,
        },
        eyeButton: {
            padding: theme.spacing.m,
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

    const validateEmail = useCallback((value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            return '';
        }
        if (!emailRegex.test(value)) {
            return 'Geçerli bir e-posta adresi giriniz';
        }
        return '';
    }, []);

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (touched.email) {
            setEmailError(validateEmail(value));
        }
    };

    const handleEmailBlur = () => {
        setTouched(prev => ({ ...prev, email: true }));
        setEmailError(validateEmail(email));
    };

    const handleLogin = async () => {
        // Validate before submit
        const emailErr = validateEmail(email);
        setEmailError(emailErr);
        setTouched({ email: true, password: true });

        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Eksik Bilgi',
                text2: 'Lütfen e-posta ve şifre alanlarını doldurunuz.',
            });
            return;
        }

        if (emailErr) {
            Toast.show({
                type: 'error',
                text1: 'Geçersiz Format',
                text2: 'Lütfen geçerli bir e-posta adresi giriniz.',
            });
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            const apiError = error as ApiError;
            let errorMessage = apiError.message || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.';
            let errorTitle = 'Hata';

            // Switch structure based on standardized error codes
            switch (apiError.code) {
                case 'ACCOUNT_FROZEN':
                    setFrozenDialogVisible(true);
                    setLoading(false);
                    return; // Don't show toast, dialog handles it

                case 'RATE_LIMIT_EXCEEDED':
                    errorTitle = 'Çok Fazla Deneme';
                    if (apiError.retry_after_minutes) {
                        errorMessage = `Güvenliğiniz için lütfen ${apiError.retry_after_minutes} dakika bekleyiniz.`;
                    } else if (apiError.retry_after) {
                        errorMessage = `Lütfen ${apiError.retry_after} saniye bekleyiniz.`;
                    }
                    break;

                case 'EMAIL_NOT_VERIFIED':
                    // Redirect to verification instead of showing error
                    setLoading(false);
                    Toast.show({
                        type: 'info',
                        text1: 'Doğrulama Gerekli',
                        text2: 'Lütfen email adresinizi doğrulayın.',
                    });
                    navigation.navigate('Verification' as never, { email } as never);
                    return;

                case 'INVALID_CREDENTIALS':
                    errorTitle = 'Giriş Başarısız';
                    errorMessage = 'Email veya şifre hatalı. Lütfen tekrar deneyiniz.';
                    break;

                case 'INVALID_EMAIL_FORMAT':
                    errorTitle = 'Geçersiz Format';
                    errorMessage = 'Lütfen geçerli bir e-posta adresi giriniz.';
                    break;

                default:
                    // Fallback for legacy errors or network errors
                    if (error.message === 'Network Error') {
                        errorTitle = 'Bağlantı Hatası';
                        errorMessage = 'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
                        // Fix for raw JSON object display
                    } else if (typeof error.message === 'object') {
                        errorMessage = 'Bir hata oluştu.';
                    } else if (apiError.is_frozen) { // Legacy check just in case
                        setFrozenDialogVisible(true);
                        setLoading(false);
                        return;
                    }
                    break;
            }

            Toast.show({
                type: 'error',
                text1: errorTitle,
                text2: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnfreeze = async () => {
        setFrozenDialogVisible(false);
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/unfreeze_account.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Hesabınız aktifleştirildi.' });
                // Otomatik giriş yap
                await login(email, password);
            } else {
                Toast.show({ type: 'error', text1: 'Hata', text2: data.message });
                setLoading(false);
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Bir hata oluştu.' });
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {isFirstLaunch ? "KulturaX'e Hoş Geldiniz" : "Tekrar Hoşgeldiniz"}
            </Text>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={[styles.input, emailError && touched.email && styles.inputError]}
                        placeholder="E-posta"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={handleEmailBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {emailError && touched.email && (
                        <Text style={styles.errorText}>{emailError}</Text>
                    )}
                </View>
                <View style={styles.inputWrapper}>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Şifre"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color={theme.colors.textSecondary} />
                            ) : (
                                <Eye size={20} color={theme.colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)}>
                <Text style={styles.linkText}>Şifremi Unuttum</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
                <Text style={styles.linkText}>Hesabınız yok mu? Kayıt Olun</Text>
            </TouchableOpacity>

            {/* Frozen Account Dialog */}
            <ThemedDialog
                visible={frozenDialogVisible}
                title="Hesabınız Dondurulmuş"
                message="Hesabınızı aktifleştirmek ister misiniz?"
                onClose={() => setFrozenDialogVisible(false)}
                actions={[
                    { text: 'Hayır', style: 'cancel', onPress: () => setFrozenDialogVisible(false) },
                    { text: 'Aktifleştir', style: 'default', onPress: handleUnfreeze },
                ]}
            />
        </View>
    );
};
