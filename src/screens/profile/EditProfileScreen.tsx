import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { ArrowLeft, Camera, Calendar } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { userService } from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { InterestSelector } from '../../components/profile/InterestSelector';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, updateUser } = useAuth();
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
            backgroundColor: theme.colors.surface,
            ...theme.shadows.soft,
            zIndex: 10,
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
        },
        saveButton: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.primary,
        },
        content: {
            flex: 1,
        },
        headerImageContainer: {
            height: 150,
            width: '100%',
            position: 'relative',
        },
        headerImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        overlay: {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarSection: {
            alignItems: 'center',
            marginTop: -50,
            marginBottom: 20,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 4,
            borderColor: theme.colors.background,
        },
        avatarOverlay: {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 50,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        changePhotoText: {
            marginTop: 8,
            color: theme.colors.primary,
            fontWeight: '600',
            fontSize: 14,
        },
        form: {
            padding: 20,
        },
        inputGroup: {
            marginBottom: 24,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginBottom: 8,
            marginLeft: 4,
        },
        input: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            color: theme.colors.text,
            fontSize: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        textArea: {
            height: 100,
            textAlignVertical: 'top',
        },
    }), [theme]);

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [location, setLocation] = useState(user?.location || '');
    const [website, setWebsite] = useState(user?.website || '');
    const [isLoading, setIsLoading] = useState(false);

    // New profile fields
    const [birthDate, setBirthDate] = useState(user?.birth_date || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerDate, setDatePickerDate] = useState(user?.birth_date ? new Date(user.birth_date) : new Date(2000, 0, 1));
    const [school, setSchool] = useState(user?.school || '');
    const [department, setDepartment] = useState(user?.department || '');
    const [interests, setInterests] = useState<string[]>(user?.interests || []);

    const [avatarAsset, setAvatarAsset] = useState<any>(null);
    const [headerAsset, setHeaderAsset] = useState<any>(null);

    const handleAvatarSelect = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: true,
                mediaType: 'photo',
                cropperCircleOverlay: true, // Yuvarlak kırpma (görsel olarak)
                forceJpg: true,
            });

            if (image) {
                setAvatarAsset({
                    uri: image.path,
                    type: image.mime,
                    fileName: image.filename || `avatar_${Date.now()}.jpg`,
                });
            }
        } catch (error) {
            console.log('ImagePicker Error: ', error);
        }
    };

    const handleHeaderSelect = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 800,
                height: 266, // ~3:1 aspect ratio
                cropping: true,
                mediaType: 'photo',
                forceJpg: true,
            });

            if (image) {
                setHeaderAsset({
                    uri: image.path,
                    type: image.mime,
                    fileName: image.filename || `header_${Date.now()}.jpg`,
                });
            }
        } catch (error) {
            console.log('ImagePicker Error: ', error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('full_name', fullName);
            formData.append('bio', bio);
            formData.append('location', location);
            formData.append('website', website);
            // New profile fields
            if (birthDate) formData.append('birth_date', birthDate);
            formData.append('school', school);
            formData.append('department', department);
            formData.append('interests', JSON.stringify(interests));

            if (avatarAsset) {
                formData.append('avatar', {
                    uri: avatarAsset.uri,
                    type: avatarAsset.type,
                    name: avatarAsset.fileName || 'avatar.jpg',
                } as any);
            }

            if (headerAsset) {
                formData.append('header_image', {
                    uri: headerAsset.uri,
                    type: headerAsset.type,
                    name: headerAsset.fileName || 'header.jpg',
                } as any);
            }

            const response = await userService.updateProfile(user.id, formData);
            console.log('Profile update response:', response);

            if (response.user) {
                console.log('Updating local user context with:', response.user);
                await updateUser(response.user);
            } else {
                console.warn('No user object in update response');
            }

            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Profil bilgileriniz güncellendi.',
            });
            navigation.goBack();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Profil güncellenemedi.',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profili Düzenle</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text style={styles.saveButton}>Kaydet</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Header Image Selection */}
                <TouchableOpacity style={styles.headerImageContainer} onPress={handleHeaderSelect}>
                    {(headerAsset || user?.header_image_url) ? (
                        <Image
                            source={{ uri: headerAsset ? headerAsset.uri : user?.header_image_url }}
                            style={styles.headerImage}
                        />
                    ) : (
                        <View style={[styles.headerImage, { backgroundColor: theme.colors.border }]} />
                    )}
                    <View style={styles.overlay}>
                        <Camera size={24} color="#FFF" />
                    </View>
                </TouchableOpacity>

                {/* Avatar Selection */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handleAvatarSelect}>
                        {(avatarAsset || user?.avatar_url) ? (
                            <Image
                                source={{ uri: avatarAsset ? avatarAsset.uri : user?.avatar_url }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 32, fontWeight: '600' }}>
                                    {(user?.full_name || user?.username || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.avatarOverlay}>
                            <Camera size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Profil Fotoğrafını Değiştir</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ad Soyad</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Adınız Soyadınız"
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Biyografi</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Kendinizden bahsedin..."
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Konum</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="İstanbul, Türkiye"
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Web Sitesi</Text>
                        <TextInput
                            style={styles.input}
                            value={website}
                            onChangeText={setWebsite}
                            placeholder="https://..."
                            placeholderTextColor={theme.colors.textSecondary}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* New Profile Fields */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Doğum Tarihi</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ color: birthDate ? theme.colors.text : theme.colors.textSecondary, fontSize: 16 }}>
                                {birthDate ? new Date(birthDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Seçiniz...'}
                            </Text>
                            <Calendar size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={datePickerDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (event.type === 'set' && selectedDate) {
                                        setDatePickerDate(selectedDate);
                                        const formatted = selectedDate.toISOString().split('T')[0];
                                        setBirthDate(formatted);
                                    }
                                }}
                                maximumDate={new Date()}
                                minimumDate={new Date(1900, 0, 1)}
                            />
                        )}
                        {showDatePicker && Platform.OS === 'ios' && (
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                                style={{ alignItems: 'center', padding: 10, backgroundColor: theme.colors.primary, borderRadius: 8, marginTop: 10 }}
                            >
                                <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Tamam</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Okul</Text>
                        <TextInput
                            style={styles.input}
                            value={school}
                            onChangeText={setSchool}
                            placeholder="Üniversite veya okul adı"
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bölüm</Text>
                        <TextInput
                            style={styles.input}
                            value={department}
                            onChangeText={setDepartment}
                            placeholder="Bölüm veya alan"
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>İlgi Alanları</Text>
                        <InterestSelector
                            selectedInterests={interests}
                            onInterestsChange={setInterests}
                            maxSelections={10}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};


