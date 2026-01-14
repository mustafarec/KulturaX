import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, Dimensions, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SignupScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { signup } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 3;

    // Step 1: Basic Info
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');

    // Step 2: Account Info
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 3: Profile Info (Optional)
    const [date, setDate] = useState(new Date());
    const [openDate, setOpenDate] = useState(false);
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [openGender, setOpenGender] = useState(false);
    const genderOptions = ['Kız', 'Erkek', 'Belirtmek İstemiyorum'];

    const styles = React.useMemo(() => StyleSheet.create({
        scrollContainer: {
            flexGrow: 1,
            backgroundColor: theme.colors.background,
        },
        container: {
            flex: 1,
            padding: theme.spacing.l,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 40,
            marginBottom: theme.spacing.l,
        },
        backButton: {
            padding: 8,
            marginRight: 12,
        },
        headerTitle: {
            ...theme.typography.h2,
            color: theme.colors.text,
            flex: 1,
        },
        stepIndicatorContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
            gap: 8,
        },
        stepDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.border,
        },
        stepDotActive: {
            backgroundColor: theme.colors.primary,
            width: 24,
        },
        stepDotCompleted: {
            backgroundColor: theme.colors.success,
        },
        stepText: {
            ...theme.typography.caption,
            textAlign: 'center',
            marginBottom: theme.spacing.m,
        },
        title: {
            ...theme.typography.h1,
            marginBottom: theme.spacing.s,
            color: theme.colors.text,
        },
        subtitle: {
            ...theme.typography.body,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xl,
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
            justifyContent: 'center',
            height: 50,
            fontSize: 16,
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: 12,
            marginTop: theme.spacing.m,
        },
        button: {
            flex: 1,
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.m,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
        },
        buttonSecondary: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        buttonText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        buttonTextSecondary: {
            color: theme.colors.text,
        },
        skipButton: {
            alignItems: 'center',
            marginTop: theme.spacing.m,
            padding: theme.spacing.s,
        },
        skipText: {
            color: theme.colors.textSecondary,
            fontSize: 14,
        },
        linkText: {
            color: theme.colors.secondary,
            textAlign: 'center',
            marginTop: theme.spacing.l,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            padding: 10,
            width: '80%',
            elevation: 5,
        },
        modalItem: {
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        modalItemText: {
            color: theme.colors.text,
            fontSize: 16,
            textAlign: 'center',
        },
    }), [theme]);

    const validateStep1 = () => {
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen isminizi giriniz.' });
            return false;
        }
        if (!surname.trim()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen soyisminizi giriniz.' });
            return false;
        }
        if (!username.trim()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen kullanıcı adı giriniz.' });
            return false;
        }
        if (username.length < 3) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Kullanıcı adı en az 3 karakter olmalı.' });
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!email.trim()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen email adresinizi giriniz.' });
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Geçerli bir email adresi giriniz.' });
            return false;
        }
        if (!password) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen şifre giriniz.' });
            return false;
        }
        if (password.length < 8) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifre en az 8 karakter olmalı.' });
            return false;
        }
        if (password !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifreler eşleşmiyor.' });
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleSignup = async (skipOptional = false) => {
        setLoading(true);
        try {
            const finalBirthDate = skipOptional ? '' : birthDate;
            const finalGender = skipOptional ? '' : gender;

            const response = await signup(email, password, name, surname, username, finalBirthDate, finalGender);

            if (response && response.require_verification) {
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Lütfen email adresinizi doğrulayın.',
                });
                navigation.navigate('Verification' as any, { email } as any);
            } else {
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Hesap oluşturuldu.',
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Kayıt Hatası',
                text2: error.message || 'Kayıt işlemi başarısız oldu.',
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicatorContainer}>
            {[1, 2, 3].map((step) => (
                <View
                    key={step}
                    style={[
                        styles.stepDot,
                        currentStep === step && styles.stepDotActive,
                        currentStep > step && styles.stepDotCompleted,
                    ]}
                />
            ))}
        </View>
    );

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return 'Temel Bilgiler';
            case 2: return 'Hesap Bilgileri';
            case 3: return 'Profil Bilgileri';
            default: return '';
        }
    };

    const getStepSubtitle = () => {
        switch (currentStep) {
            case 1: return 'Seni tanıyalım';
            case 2: return 'Güvenli bir hesap oluştur';
            case 3: return 'Bu adım isteğe bağlı';
            default: return '';
        }
    };

    const renderStep1 = () => (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="İsim"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Soyisim"
                placeholderTextColor={theme.colors.textSecondary}
                value={surname}
                onChangeText={setSurname}
            />
            <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                placeholderTextColor={theme.colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
        </View>
    );

    const renderStep2 = () => (
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
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: theme.spacing.m,
            }}>
                <TextInput
                    style={{ flex: 1, color: theme.colors.text, padding: theme.spacing.m, fontSize: 16 }}
                    placeholder="Şifre (min. 8 karakter)"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={{ padding: theme.spacing.m }} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color={theme.colors.textSecondary} /> : <Eye size={20} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
            </View>
            <PasswordStrengthIndicator password={password} />
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: theme.spacing.m,
            }}>
                <TextInput
                    style={{ flex: 1, color: theme.colors.text, padding: theme.spacing.m, fontSize: 16 }}
                    placeholder="Şifreyi Onayla"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity style={{ padding: theme.spacing.m }} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={20} color={theme.colors.textSecondary} /> : <Eye size={20} color={theme.colors.textSecondary} />}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setOpenDate(true)} style={styles.input}>
                <Text style={{ color: birthDate ? theme.colors.text : theme.colors.textSecondary }}>
                    {birthDate ? birthDate : "Doğum Tarihi (İsteğe Bağlı)"}
                </Text>
            </TouchableOpacity>

            {openDate && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                            setOpenDate(false);
                        }
                        if (event.type === 'set' && selectedDate) {
                            setDate(selectedDate);
                            const formatted = selectedDate.toISOString().split('T')[0];
                            setBirthDate(formatted);
                        }
                        if (Platform.OS === 'ios') {
                            // iOS'ta modal kapatma için ayrı buton gerekebilir
                        }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                />
            )}
            {openDate && Platform.OS === 'ios' && (
                <TouchableOpacity
                    onPress={() => setOpenDate(false)}
                    style={{ alignItems: 'center', padding: 10, backgroundColor: theme.colors.primary, borderRadius: 8, marginBottom: 10 }}
                >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Tamam</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setOpenGender(true)} style={styles.input}>
                <Text style={{ color: gender ? theme.colors.text : theme.colors.textSecondary }}>
                    {gender ? gender : "Cinsiyet (İsteğe Bağlı)"}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={openGender}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setOpenGender(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOpenGender(false)}
                >
                    <View style={styles.modalContent}>
                        {genderOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.modalItem}
                                onPress={() => {
                                    setGender(option);
                                    setOpenGender(false);
                                }}
                            >
                                <Text style={styles.modalItemText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Adım {currentStep}/{TOTAL_STEPS}</Text>
                </View>

                {renderStepIndicator()}

                <Text style={styles.title}>{getStepTitle()}</Text>
                <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <View style={styles.buttonContainer}>
                    {currentStep > 1 && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSecondary]}
                            onPress={handleBack}
                        >
                            <ArrowLeft size={18} color={theme.colors.text} />
                            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Geri</Text>
                        </TouchableOpacity>
                    )}

                    {currentStep < 3 ? (
                        <TouchableOpacity
                            style={[styles.button]}
                            onPress={handleNext}
                        >
                            <Text style={styles.buttonText}>İleri</Text>
                            <ArrowRight size={18} color="#ffffff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={() => handleSignup(false)}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Check size={18} color="#ffffff" />
                                    <Text style={styles.buttonText}>Kayıt Ol</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {currentStep === 3 && (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => handleSignup(true)}
                        disabled={loading}
                    >
                        <Text style={styles.skipText}>Bu adımı atla</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => navigation.navigate('Login' as any)}>
                    <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş Yapın</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};
