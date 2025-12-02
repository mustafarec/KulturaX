import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const SignupScreen = () => {
    const navigation = useNavigation();
    const { signup, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');

    // Date Picker State
    const [date, setDate] = useState(new Date());
    const [openDate, setOpenDate] = useState(false);
    const [birthDate, setBirthDate] = useState('');

    // Gender Dropdown State
    const [gender, setGender] = useState('');
    const [openGender, setOpenGender] = useState(false);
    const genderOptions = ['Kız', 'Erkek', 'Belirtmek İstemiyorum'];

    const handleSignup = async () => {
        if (!email || !password || !name || !surname || !username || !birthDate || !gender) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Lütfen tüm alanları doldurunuz.',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Şifreler eşleşmiyor.',
            });
            return;
        }

        // birthDate is already formatted YYYY-MM-DD from DatePicker onConfirm

        try {
            const response = await signup(email, password, name, surname, username, birthDate, gender);

            if (response && response.require_verification) {
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Lütfen email adresinizi doğrulayın.',
                });
                navigation.navigate('Verification' as never, { email } as never);
            } else {
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Hesap oluşturuldu.',
                });
                // Navigation to Main is handled by AuthContext state change or AppNavigator
            }
        } catch (error) {
            // Error is handled in context
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>Hesap Oluştur</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="İsim *"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Soyisim *"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={surname}
                        onChangeText={setSurname}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Kullanıcı Adı *"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="E-posta *"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Date Picker Trigger */}
                    <TouchableOpacity onPress={() => setOpenDate(true)} style={styles.input}>
                        <Text style={{ color: birthDate ? theme.colors.text : theme.colors.textSecondary }}>
                            {birthDate ? birthDate : "Doğum Tarihi Seçiniz *"}
                        </Text>
                    </TouchableOpacity>

                    <DatePicker
                        modal
                        open={openDate}
                        date={date}
                        mode="date"
                        locale="tr"
                        title="Doğum Tarihi Seçiniz"
                        confirmText="Onayla"
                        cancelText="İptal"
                        onConfirm={(date: Date) => {
                            setOpenDate(false);
                            setDate(date);
                            // Format YYYY-MM-DD for backend
                            const formatted = date.toISOString().split('T')[0];
                            setBirthDate(formatted);
                        }}
                        onCancel={() => {
                            setOpenDate(false);
                        }}
                    />

                    {/* Gender Dropdown Trigger */}
                    <TouchableOpacity onPress={() => setOpenGender(true)} style={styles.input}>
                        <Text style={{ color: gender ? theme.colors.text : theme.colors.textSecondary }}>
                            {gender ? gender : "Cinsiyet Seçiniz *"}
                        </Text>
                    </TouchableOpacity>

                    {/* Gender Selection Modal */}
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

                    <TextInput
                        style={styles.input}
                        placeholder="Şifre *"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Şifreyi Onayla *"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Kayıt Ol</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                    <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş Yapın</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        flex: 1,
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
        justifyContent: 'center', // For TouchableOpacity inputs
        height: 50, // Ensure consistent height
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
});
