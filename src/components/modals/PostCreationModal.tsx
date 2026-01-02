import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions, ScrollView, Platform, KeyboardAvoidingView, Alert, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePostHub } from '../../context/PostHubContext';

// Components
import { PostTypeSelector, CreateTab } from '../post/creation/PostTypeSelector';
import { ThoughtForm } from '../post/creation/forms/ThoughtForm';
import { ReviewForm } from '../post/creation/forms/ReviewForm';
import { BookForm } from '../post/creation/forms/BookForm';
import { EventForm } from '../post/creation/forms/EventForm';
import { ThemedDialog } from '../ThemedDialog';

// Services
import { postService, reviewService, libraryService } from '../../services/backendApi';
import { draftService, Draft } from '../../services/DraftService';

const { height } = Dimensions.get('window');

export const PostCreationModal: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { isModalVisible, closeModal, currentDraft } = usePostHub();
    const insets = useSafeAreaInsets();

    // State
    const [selectedType, setSelectedType] = useState<CreateTab | null>(null);

    // Thought State
    const [thoughtText, setThoughtText] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');

    // Review State
    const [reviewType, setReviewType] = useState<'book' | 'film' | 'music'>('book');
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewContentId, setReviewContentId] = useState('');
    const [reviewImage, setReviewImage] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(0);

    // Book State
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');
    const [bookContentId, setBookContentId] = useState('');
    const [bookImage, setBookImage] = useState('');
    const [bookStatus, setBookStatus] = useState<'reading' | 'read' | 'want_to_read'>('reading');
    const [bookRating, setBookRating] = useState(0);

    // Event State
    const [eventType, setEventType] = useState<'concert' | 'theater'>('concert');
    const [eventTitle, setEventTitle] = useState('');
    const [eventContentId, setEventContentId] = useState('');
    const [eventImage, setEventImage] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventNotes, setEventNotes] = useState('');
    const [eventRating, setEventRating] = useState(0);

    // Animation values
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);
    const scale = useSharedValue(0.95);

    useEffect(() => {
        if (isModalVisible) {
            const config = { duration: 250, easing: Easing.out(Easing.cubic) };

            opacity.value = withTiming(1, config);
            translateY.value = withTiming(0, config);
            scale.value = withTiming(1, config);

            // Load Draft
            if (currentDraft) {
                loadDraft(currentDraft);
            }
        } else {
            handleCloseAnimation();
        }
    }, [isModalVisible, currentDraft]);

    // Handle Hardware Back Button
    useEffect(() => {
        const backAction = () => {
            if (isModalVisible) {
                if (selectedType) {
                    handleCloseRequest(); // If inside a form, try to save/close
                } else {
                    closeModal(); // If in selection menu, just close
                    handleCloseAnimation();
                }
                return true; // Prevent default behavior
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, [isModalVisible, selectedType, thoughtText, reviewTitle, reviewText, bookTitle, eventTitle]); // Add dependencies for closure capture

    const loadDraft = (draft: Draft) => {
        setSelectedType(draft.type as CreateTab);
        const data = draft.data;

        switch (draft.type) {
            case 'thought':
                setThoughtText(data.thoughtText || '');
                setSelectedTopic(data.selectedTopic || '');
                break;
            case 'review':
                setReviewType(data.reviewType || 'book');
                setReviewTitle(data.reviewTitle || '');
                setReviewContentId(data.reviewContentId || '');
                setReviewImage(data.reviewImage || '');
                setReviewText(data.reviewText || '');
                setReviewRating(data.reviewRating || 0);
                break;
            case 'book':
                setBookTitle(data.bookTitle || '');
                setBookAuthor(data.bookAuthor || '');
                setBookContentId(data.bookContentId || '');
                setBookImage(data.bookImage || '');
                setBookStatus(data.bookStatus || 'reading');
                setBookRating(data.bookRating || 0);
                break;
            case 'event':
                setEventType(data.eventType || 'concert');
                setEventTitle(data.eventTitle || '');
                setEventContentId(data.eventContentId || '');
                setEventImage(data.eventImage || '');
                setEventLocation(data.eventLocation || '');
                setEventDate(data.eventDate || '');
                setEventNotes(data.eventNotes || '');
                setEventRating(data.eventRating || 0);
                break;
        }
    };

    // Dialog Config State
    const [dialogConfig, setDialogConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        onDiscard: () => void;
        onSave: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        onDiscard: () => { },
        onSave: () => { }
    });

    const handleCloseAnimation = () => {
        const config = { duration: 200, easing: Easing.in(Easing.cubic) };

        opacity.value = withTiming(0, config);
        translateY.value = withTiming(10, config);
        scale.value = withTiming(0.98, config);

        setTimeout(() => {
            resetState();
            translateY.value = 20;
            scale.value = 0.96;
        }, 200);
    };

    const hasUnsavedChanges = useCallback(() => {
        if (!selectedType) return false;

        switch (selectedType) {
            case 'thought': return thoughtText.trim().length > 0;
            case 'review': return reviewTitle.trim().length > 0 || reviewText.trim().length > 0;
            case 'book': return bookTitle.trim().length > 0;
            case 'event': return eventTitle.trim().length > 0;
            default: return false;
        }
    }, [selectedType, thoughtText, reviewTitle, reviewText, bookTitle, eventTitle]);

    const handleCloseRequest = () => {
        if (hasUnsavedChanges()) {
            setDialogConfig({
                visible: true,
                title: "Taslak Kaydedilsin mi?",
                message: "Yaptığınız değişiklikleri taslak olarak kaydetmek ister misiniz?",
                onDiscard: () => {
                    closeModal();
                    handleCloseAnimation();
                    setDialogConfig(prev => ({ ...prev, visible: false }));
                },
                onSave: async () => {
                    await saveDraft();
                    closeModal();
                    handleCloseAnimation();
                    setDialogConfig(prev => ({ ...prev, visible: false }));
                }
            });
        } else {
            closeModal();
            handleCloseAnimation();
        }
    };

    const saveDraft = async () => {
        if (!selectedType) return;

        let data = {};
        switch (selectedType) {
            case 'thought':
                data = { thoughtText, selectedTopic };
                break;
            case 'review':
                data = { reviewType, reviewTitle, reviewContentId, reviewImage, reviewText, reviewRating };
                break;
            case 'book':
                data = { bookTitle, bookAuthor, bookContentId, bookImage, bookStatus, bookRating };
                break;
            case 'event':
                data = { eventType, eventTitle, eventContentId, eventImage, eventLocation, eventDate, eventNotes, eventRating };
                break;
        }

        try {
            if (currentDraft) {
                await draftService.updateDraft(currentDraft.id, data);
            } else {
                await draftService.saveDraft({
                    type: selectedType as any,
                    data
                });
            }
            Toast.show({
                type: 'info',
                text1: 'Taslak Kaydedildi',
                visibilityTime: 2000,
            });
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Taslak kaydedilemedi.',
            });
        }
    };

    const resetState = () => {
        setSelectedType(null);
        setThoughtText('');
        setSelectedTopic('');
        setReviewTitle('');
        setReviewContentId('');
        setReviewImage('');
        setReviewText('');
        setReviewRating(0);
        setBookTitle('');
        setBookAuthor('');
        setBookContentId('');
        setBookImage('');
        setBookStatus('reading');
        setBookRating(0);
        setEventTitle('');
        setEventContentId('');
        setEventImage('');
        setEventLocation('');
        setEventDate('');
        setEventNotes('');
        setEventRating(0);
    };

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { translateY: translateY.value },
                { scale: scale.value }
            ],
        };
    });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const getHeaderTitle = () => {
        if (currentDraft && selectedType) return 'Taslağı Düzenle';
        if (!selectedType) return 'Ne Paylaşmak İstersiniz?';
        switch (selectedType) {
            case 'thought': return 'Düşünce Paylaş';
            case 'review': return 'İnceleme Yaz';
            case 'book': return 'Kitap Kaydet';
            case 'event': return 'Etkinlik Ekle';
            default: return '';
        }
    };

    const handleBack = () => {
        // Updated Logic: If has changes, warn user. If no changes, go back to selector.
        if (hasUnsavedChanges()) {
            setDialogConfig({
                visible: true,
                title: "Dikkat",
                message: "Geri dönerseniz yazdıklarınız silinecek. Taslak olarak kaydetmek ister misiniz?",
                onDiscard: () => {
                    setSelectedType(null);
                    resetState();
                    setDialogConfig(prev => ({ ...prev, visible: false }));
                },
                onSave: async () => {
                    await saveDraft();
                    closeModal();
                    handleCloseAnimation();
                    setDialogConfig(prev => ({ ...prev, visible: false }));
                }
            });
        } else {
            setSelectedType(null);
        }
    };

    const handlePost = async () => {
        // Validation logic
        if (selectedType === 'thought' && !selectedTopic) {
            Toast.show({ type: 'error', text1: 'Lütfen bir konu seçin.' });
            return;
        }

        // Backend Integration
        try {
            if (!user) {
                console.error("User not found");
                return;
            }
            const userId = user.id;

            if (selectedType === 'thought') {
                await postService.create(
                    userId,
                    '', // quote
                    thoughtText, // comment
                    'Düşünce', // source
                    '', // author 
                    undefined, // originalPostId
                    'thought', // contentType
                    undefined, // contentId
                    undefined, // imageUrl
                    Number(selectedTopic)
                );
            } else if (selectedType === 'review') {
                await reviewService.addReview(
                    userId,
                    reviewType === 'film' ? 'movie' : reviewType,
                    reviewContentId,
                    reviewRating,
                    reviewText,
                    reviewTitle,
                    reviewImage
                );
            } else if (selectedType === 'book') {
                await libraryService.updateStatus(
                    'book',
                    bookContentId,
                    bookStatus,
                    0, // progress
                    bookTitle,
                    bookImage,
                    bookAuthor
                );
            } else if (selectedType === 'event') {
                await libraryService.updateStatus(
                    'event',
                    eventContentId,
                    'reading',
                    0,
                    eventTitle,
                    eventImage,
                    eventLocation // Map location to author field for display
                );

                const eventDetails = `${eventTitle} - ${eventLocation}\nTarih: ${eventDate}`;
                await postService.create(
                    userId,
                    eventDetails,
                    eventNotes,
                    eventTitle,
                    eventLocation,
                    undefined,
                    'event',
                    eventContentId,
                    eventImage,
                    undefined
                );
            }

            // Success handling
            if (currentDraft) {
                await draftService.deleteDraft(currentDraft.id);
            }

            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Paylaşım yapıldı.',
                visibilityTime: 2000,
            });

            closeModal();
            handleCloseAnimation(); // Ensure state reset
        } catch (error) {
            console.error('Post failed:', error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Paylaşım yapılamadı.',
            });
        }
    };

    const isPostDisabled = () => {
        if (selectedType === 'thought' && !selectedTopic) return true;
        if (selectedType === 'book' && (!bookTitle || !bookAuthor)) return true;
        if (selectedType === 'review' && (!reviewTitle || !reviewText)) return true;
        if (selectedType === 'event' && (!eventTitle)) return true;
        return false;
    };

    if (!isModalVisible && opacity.value === 0) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents={isModalVisible ? "auto" : "none"}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleCloseRequest}>
                <Animated.View style={[styles.backdrop, backdropStyle]} />
            </TouchableWithoutFeedback>

            {/* Modal Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <View style={[
                    styles.centeredContainer,
                    selectedType
                        ? { justifyContent: 'flex-end', paddingBottom: 0, paddingHorizontal: 0 }
                        : { justifyContent: 'center', paddingBottom: 0, paddingHorizontal: 16 }
                ]} pointerEvents="box-none">
                    <Animated.View style={[
                        styles.modalContent,
                        { backgroundColor: theme.colors.background },
                        selectedType
                            ? { width: '100%', height: height - insets.bottom, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 }
                            : { width: '100%', maxHeight: height * 0.6 },
                        containerStyle
                    ]}>


                        {/* Header */}
                        <View style={[styles.header, {
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                            backgroundColor: theme.colors.surface + '80',
                            paddingTop: selectedType ? Math.max(insets.top, 16) : 16,
                        }]}>
                            {selectedType ? (
                                <TouchableOpacity onPress={handleBack} style={[styles.iconButton, { backgroundColor: theme.colors.background }]}>
                                    {currentDraft ? <X size={18} color={theme.colors.text} /> : <ArrowLeft size={18} color={theme.colors.text} />}
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 40 }} />
                            )}

                            <Text style={[styles.headerTitle, {
                                color: theme.colors.primary,
                                fontFamily: theme.fonts.headings,
                                fontSize: Dimensions.get('window').width < 340 ? 16 : Dimensions.get('window').width < 380 ? 17 : 20
                            }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                {getHeaderTitle()}
                            </Text>

                            {selectedType ? (
                                <TouchableOpacity
                                    onPress={handlePost}
                                    disabled={isPostDisabled()}
                                    style={[
                                        styles.postButton,
                                        {
                                            backgroundColor: isPostDisabled() ? theme.colors.surface : theme.colors.primary,
                                            opacity: isPostDisabled() ? 0.7 : 1
                                        }
                                    ]}
                                >
                                    <Text style={[
                                        styles.postButtonText,
                                        { color: isPostDisabled() ? theme.colors.textSecondary : '#FFF' }
                                    ]}>
                                        {selectedType === 'book' || selectedType === 'event' ? 'Ekle' : 'Paylaş'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={handleCloseRequest} style={[styles.iconButton, { backgroundColor: theme.colors.background }]}>
                                    <X size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Content Scroll */}
                        <ScrollView
                            style={styles.contentScroll}
                            contentContainerStyle={{
                                paddingBottom: selectedType ? Math.max(insets.bottom + 100, 120) : 24,
                                paddingHorizontal: 4
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            {!selectedType ? (
                                <PostTypeSelector onSelectType={setSelectedType} />
                            ) : (
                                <>
                                    {selectedType === 'thought' && (
                                        <ThoughtForm
                                            text={thoughtText} setText={setThoughtText}
                                            selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic}
                                        />
                                    )}
                                    {selectedType === 'review' && (
                                        <ReviewForm
                                            type={reviewType} setType={setReviewType}
                                            title={reviewTitle} setTitle={setReviewTitle}
                                            setContentId={setReviewContentId}
                                            setImageUrl={setReviewImage}
                                            review={reviewText} setReview={setReviewText}
                                            rating={reviewRating} setRating={setReviewRating}
                                        />
                                    )}
                                    {selectedType === 'book' && (
                                        <BookForm
                                            title={bookTitle} setTitle={setBookTitle}
                                            author={bookAuthor} setAuthor={setBookAuthor}
                                            setContentId={setBookContentId}
                                            imageUrl={bookImage} setImageUrl={setBookImage}
                                            status={bookStatus} setStatus={setBookStatus}
                                            rating={bookRating} setRating={setBookRating}
                                        />
                                    )}
                                    {selectedType === 'event' && (
                                        <EventForm
                                            type={eventType} setType={setEventType}
                                            title={eventTitle} setTitle={setEventTitle}
                                            setContentId={setEventContentId}
                                            setImageUrl={setEventImage}
                                            location={eventLocation} setLocation={setEventLocation}
                                            date={eventDate} setDate={setEventDate}
                                            notes={eventNotes} setNotes={setEventNotes}
                                            rating={eventRating} setRating={setEventRating}
                                        />
                                    )}
                                </>
                            )}
                        </ScrollView>

                    </Animated.View>
                </View>
            </KeyboardAvoidingView >

            <ThemedDialog
                visible={dialogConfig.visible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                onClose={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
                actions={[
                    {
                        text: 'Kaydet',
                        style: 'default', // Primary color
                        onPress: dialogConfig.onSave
                    },
                    {
                        text: 'Sil', // Shortened text for better fit
                        style: 'destructive',
                        onPress: dialogConfig.onDiscard
                    },
                    {
                        text: 'Vazgeç',
                        style: 'cancel',
                        fullWidth: true,
                        onPress: () => setDialogConfig(prev => ({ ...prev, visible: false }))
                    }
                ]}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    modalContent: {
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    iconButton: {
        padding: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    postButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contentScroll: {
        padding: 16,
    },
});
