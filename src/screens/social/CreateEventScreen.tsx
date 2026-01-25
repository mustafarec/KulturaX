import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { EventForm } from '../../components/post/creation/forms/EventForm';
import { Button } from '../../components/ui/Button';
import { postService, libraryService } from '../../services/backendApi';
import { draftService } from '../../services/DraftService';
import { ThemedDialog } from '../../components/ThemedDialog';

export const CreateEventScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const draft = route.params?.draft;

    // State
    const [type, setType] = useState<'concert' | 'theater'>(draft?.data?.eventType || 'concert');
    const [title, setTitle] = useState(draft?.data?.eventTitle || '');
    const [contentId, setContentId] = useState(draft?.data?.eventContentId || '');
    const [imageUrl, setImageUrl] = useState(draft?.data?.eventImage || '');
    const [location, setLocation] = useState(draft?.data?.eventLocation || '');
    const [date, setDate] = useState(draft?.data?.eventDate || '');
    const [notes, setNotes] = useState(draft?.data?.eventNotes || '');
    const [rating, setRating] = useState(draft?.data?.eventRating || 0);
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
            const data = { eventType: type, eventTitle: title, eventContentId: contentId, eventImage: imageUrl, eventLocation: location, eventDate: date, eventNotes: notes, eventRating: rating };
            if (draft) {
                await draftService.updateDraft(draft.id, data);
            } else {
                await draftService.saveDraft({ type: 'event', data });
            }
            Toast.show({ type: 'info', text1: 'Taslak Kaydedildi' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Taslak kaydedilemedi.' });
        }
        setDialogVisible(false);
    };

    const handleSubmit = async () => {
        if (!title) {
            Toast.show({ type: 'error', text1: 'Lütfen bir etkinlik seçin.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (!user) return;

            // Save to library
            await libraryService.updateStatus(
                'event',
                contentId,
                'reading',
                0,
                title,
                imageUrl,
                location
            );

            // Create post
            const eventDetails = `${title} - ${location}\nTarih: ${date}`;
            await postService.create(
                user.id,
                eventDetails,
                notes,
                title,
                location,
                undefined, // title (new!)
                undefined, // originalPostId
                'event',
                contentId,
                imageUrl,
                undefined
            );

            if (draft) {
                await draftService.deleteDraft(draft.id);
            }

            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Etkinlik paylaşıldı.' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Etkinlik paylaşılamadı.' });
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
                    Etkinlik Ekle
                </Text>
                <View style={{ width: 80 }}>
                    <Button onPress={handleSubmit} loading={isSubmitting} disabled={!title} size="sm">
                        Paylaş
                    </Button>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <EventForm
                        type={type} setType={setType}
                        title={title} setTitle={setTitle}
                        setContentId={setContentId}
                        setImageUrl={setImageUrl}
                        location={location} setLocation={setLocation}
                        date={date} setDate={setDate}
                        notes={notes} setNotes={setNotes}
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
