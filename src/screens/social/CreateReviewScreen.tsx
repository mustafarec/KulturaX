import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ReviewForm } from '../../components/post/creation/forms/ReviewForm';
import { Button } from '../../components/ui/Button';
import { reviewService } from '../../services/backendApi';
import { draftService } from '../../services/DraftService';
import { ThemedDialog } from '../../components/ThemedDialog';

export const CreateReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const draft = route.params?.draft;

    // State
    const [type, setType] = useState<'book' | 'film' | 'music'>(draft?.data?.reviewType || 'book');
    const [title, setTitle] = useState(draft?.data?.reviewTitle || '');
    const [contentId, setContentId] = useState(draft?.data?.reviewContentId || '');
    const [imageUrl, setImageUrl] = useState(draft?.data?.reviewImage || '');
    const [review, setReview] = useState(draft?.data?.reviewText || '');
    const [rating, setRating] = useState(draft?.data?.reviewRating || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    const hasUnsavedChanges = title.trim().length > 0 || review.trim().length > 0;

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
                await draftService.updateDraft(draft.id, { reviewType: type, reviewTitle: title, reviewContentId: contentId, reviewImage: imageUrl, reviewText: review, reviewRating: rating });
            } else {
                await draftService.saveDraft({ type: 'review', data: { reviewType: type, reviewTitle: title, reviewContentId: contentId, reviewImage: imageUrl, reviewText: review, reviewRating: rating } });
            }
            Toast.show({ type: 'info', text1: 'Taslak Kaydedildi' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Taslak kaydedilemedi.' });
        }
        setDialogVisible(false);
    };

    const handleSubmit = async () => {
        if (!title || !review) {
            Toast.show({ type: 'error', text1: 'Lütfen içerik seçin ve inceleme yazın.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (!user) return;

            await reviewService.addReview(
                user.id,
                type === 'film' ? 'movie' : type,
                contentId,
                rating,
                review,
                title,
                imageUrl
            );

            if (draft) {
                await draftService.deleteDraft(draft.id);
            }

            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'İnceleme paylaşıldı.' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İnceleme paylaşılamadı.' });
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
                    İnceleme Yaz
                </Text>
                <View style={{ width: 80 }}>
                    <Button onPress={handleSubmit} loading={isSubmitting} disabled={!title || !review} size="sm">
                        Paylaş
                    </Button>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <ReviewForm
                        type={type} setType={setType}
                        title={title} setTitle={setTitle}
                        setContentId={setContentId}
                        setImageUrl={setImageUrl}
                        review={review} setReview={setReview}
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
