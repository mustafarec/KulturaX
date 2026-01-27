import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { API_URL } from '../../services/backendApi';

export const ForgotPasswordScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: theme.spacing.l,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
            paddingTop: 40,
        },
        backButton: {
            padding: 8,
            marginRight: 12,
        },
        title: {
            ...theme.typography.h1,
            color: theme.colors.text,
        },
        description: {
            ...theme.typography.body,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xl,
            lineHeight: 22,
        },
        input: {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: theme.spacing.m,
            borderRadius: 8,
            marginBottom: theme.spacing.m,
            borderWidth: 1,
            borderColor: theme.colors.border,
            fontSize: 16,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: theme.spacing.m,
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
            marginTop: theme.spacing.m,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        buttonText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        linkText: {
            color: theme.colors.secondary,
            textAlign: 'center',
            marginTop: theme.spacing.l,
        },
    }), [theme]);

    const handleSendCode = async () => {
        if (!email) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Lütfen email adresinizi giriniz.',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/forgot_password.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Kod Gönderildi',
                    text2: data.message,
                });
                setCodeSent(true);
            } else {
                Toast.show({
                    type: 'error',
                    text1: response.status === 429 ? 'Çok Fazla Deneme' : 'Hata',
                    text2: data.message || 'Bir hata oluştu.',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Bir hata oluştu. Lütfen tekrar deneyin.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!code || !newPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Lütfen tüm alanları doldurunuz.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Şifreler eşleşmiyor.',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/reset_password.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, new_password: newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: data.message,
                });
                navigation.navigate('Login');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Hata',
                    text2: data.message,
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Bir hata oluştu. Lütfen tekrar deneyin.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Şifremi Unuttum</Text>
            </View>

            {!codeSent ? (
                <>
                    <Text style={styles.description}>
                        Email adresinizi girin, size şifre sıfırlama kodu göndereceğiz.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="E-posta"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSendCode}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Kod Gönder</Text>
                        )}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.description}>
                        {email} adresine gönderilen 6 haneli kodu ve yeni şifrenizi girin.
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

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Yeni Şifre"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={newPassword}
                            onChangeText={setNewPassword}
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

                    <PasswordStrengthIndicator password={newPassword} />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Yeni Şifre (Tekrar)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} color={theme.colors.textSecondary} />
                            ) : (
                                <Eye size={20} color={theme.colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Şifreyi Sıfırla</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setCodeSent(false)}>
                        <Text style={styles.linkText}>Farklı email kullan</Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Giriş ekranına dön</Text>
            </TouchableOpacity>
        </View>
    );
};
