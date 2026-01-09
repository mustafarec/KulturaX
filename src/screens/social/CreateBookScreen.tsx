import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BookForm } from '../../components/post/creation/forms/BookForm';
import { Button } from '../../components/ui/Button';
import { libraryService } from '../../services/backendApi';
import { draftService } from '../../services/DraftService';
import { ThemedDialog } from '../../components/ThemedDialog';

export const CreateBookScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const draft = route.params?.draft;

    // State
    const [title, setTitle] = useState(draft?.data?.bookTitle || '');
    const [author, setAuthor] = useState(draft?.data?.bookAuthor || '');
    const [contentId, setContentId] = useState(draft?.data?.bookContentId || '');
    const [imageUrl, setImageUrl] = useState(draft?.data?.bookImage || '');
    const [status, setStatus] = useState<'reading' | 'read' | 'want_to_read'>(draft?.data?.bookStatus || 'reading');
    const [rating, setRating] = useState(draft?.data?.bookRating || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    const hasUnsavedChanges = title.trim().length > 0;

    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                if (hasUnsavedChanges) {
                    setDialogVisible(true);
                    return true;
                }
                return false;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }, [hasUnsavedChanges])
    );

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setDialogVisible(true);
        } else {
            navigation.goBack();
        }
    };

    const handleSaveDraft = async () => {
        try {
            if (draft) {
                await draftService.updateDraft(draft.id, { bookTitle: title, bookAuthor: author, bookContentId: contentId, bookImage: imageUrl, bookStatus: status, bookRating: rating });
            } else {
                await draftService.saveDraft({ type: 'book', data: { bookTitle: title, bookAuthor: author, bookContentId: contentId, bookImage: imageUrl, bookStatus: status, bookRating: rating } });
            }
            Toast.show({ type: 'info', text1: 'Taslak Kaydedildi' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Taslak kaydedilemedi.' });
        }
        setDialogVisible(false);
    };

    const handleSubmit = async () => {
        if (!title || !author) {
            Toast.show({ type: 'error', text1: 'Lütfen bir kitap seçin.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (!user) return;

            await libraryService.updateStatus(
                'book',
                contentId,
                status,
                0, // progress
                title,
                imageUrl,
                author
            );

            if (draft) {
                await draftService.deleteDraft(draft.id);
            }

            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Kitap kütüphanenize eklendi.' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Kitap eklenemedi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={handleClose} style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.headings }]}>
                    Kitap Kaydet
                </Text>
                <View style={{ width: 80 }}>
                    <Button onPress={handleSubmit} loading={isSubmitting} disabled={!title || !author} size="sm">
                        Kaydet
                    </Button>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <BookForm
                        title={title} setTitle={setTitle}
                        author={author} setAuthor={setAuthor}
                        setContentId={setContentId}
                        imageUrl={imageUrl} setImageUrl={setImageUrl}
                        status={status} setStatus={setStatus}
                        rating={rating} setRating={setRating}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <ThemedDialog
                visible={dialogVisible}
                title="Taslak Kaydedilsin mi?"
                message="Yaptığınız değişiklikleri taslak olarak kaydetmek ister misiniz?"
                onClose={() => setDialogVisible(false)}
                actions={[
                    { text: 'Kaydetme', onPress: () => { setDialogVisible(false); navigation.goBack(); }, style: 'cancel' },
                    { text: 'Kaydet', onPress: handleSaveDraft, style: 'default' },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 16, flexGrow: 1 },
});
