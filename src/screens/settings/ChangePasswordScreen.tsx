import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/backendApi';
import LinearGradient from 'react-native-linear-gradient';

export const ChangePasswordScreen = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (password: string): boolean => {
        return password.length >= 6;
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Lütfen tüm alanları doldurun.',
            });
            return;
        }

        if (!validatePassword(newPassword)) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Yeni şifre en az 6 karakter olmalıdır.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Yeni şifreler eşleşmiyor.',
            });
            return;
        }

        if (currentPassword === newPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Yeni şifre mevcut şifreden farklı olmalıdır.',
            });
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);

            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Şifreniz başarıyla güncellendi.',
            });
            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: error.message || 'Şifre güncellenemedi.',
            });
        } finally {
            setLoading(false);
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
        content: {
            padding: 20,
        },
        infoText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 24,
            lineHeight: 20,
        },
        inputGroup: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 8,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingHorizontal: 16,
        },
        input: {
            flex: 1,
            paddingVertical: 14,
            fontSize: 16,
            color: theme.colors.text,
        },
        eyeButton: {
            padding: 8,
        },
        submitButton: {
            marginTop: 10,
            borderRadius: 12,
            overflow: 'hidden',
        },
        submitGradient: {
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        submitText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700',
        },
        passwordRequirements: {
            marginTop: 8,
            paddingLeft: 4,
        },
        requirementText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginBottom: 4,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Şifre Değiştir</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.infoText}>
                    Hesap güvenliğinizi artırmak için güçlü bir şifre kullanın. Şifreniz en az 6 karakter uzunluğunda olmalıdır.
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mevcut Şifre</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Mevcut şifrenizi girin"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrentPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? (
                                <EyeOff size={20} color={theme.colors.textSecondary} />
                            ) : (
                                <Eye size={20} color={theme.colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Yeni Şifre</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Yeni şifrenizi girin"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? (
                                <EyeOff size={20} color={theme.colors.textSecondary} />
                            ) : (
                                <Eye size={20} color={theme.colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.passwordRequirements}>
                        <Text style={styles.requirementText}>• En az 6 karakter</Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Yeni şifrenizi tekrar girin"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
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
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[theme.colors.secondary, theme.colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitText}>Şifreyi Güncelle</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
