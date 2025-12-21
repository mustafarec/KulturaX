import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Components
import { PostTypeSelector, CreateTab } from '../post/creation/PostTypeSelector';
import { ThoughtForm } from '../post/creation/forms/ThoughtForm';
import { ReviewForm } from '../post/creation/forms/ReviewForm';
import { BookForm } from '../post/creation/forms/BookForm';
import { EventForm } from '../post/creation/forms/EventForm';

// Services
import { postService, reviewService, libraryService } from '../../services/backendApi';

interface PostCreationModalProps {
    visible: boolean;
    onClose: () => void;
}

const { height } = Dimensions.get('window');

export const PostCreationModal: React.FC<PostCreationModalProps> = ({ visible, onClose }) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { theme } = useTheme();

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
        if (visible) {
            const config = { duration: 250, easing: Easing.out(Easing.cubic) };

            opacity.value = withTiming(1, config);
            translateY.value = withTiming(0, config);
            scale.value = withTiming(1, config);
        } else {
            handleCloseAnimation();
        }
    }, [visible]);

    const handleCloseAnimation = () => {
        const config = { duration: 200, easing: Easing.in(Easing.cubic) };

        opacity.value = withTiming(0, config);
        translateY.value = withTiming(10, config); // Gentle slide down
        scale.value = withTiming(0.98, config); // Gentle shrink

        setTimeout(() => {
            resetState();
            // Reset for next opening (start from slightly below and smaller)
            translateY.value = 20;
            scale.value = 0.96;
        }, 200);
    };

    const handleClose = () => {
        onClose();
        handleCloseAnimation();
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
        setSelectedType(null);
    };

    const handlePost = async () => {
        // Validation logic
        if (selectedType === 'thought' && !selectedTopic) return;

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
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Düşünceniz paylaşıldı.',
                    visibilityTime: 2000,
                });
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
                    userId,
                    'book',
                    bookContentId,
                    bookStatus,
                    0, // progress
                    bookTitle,
                    bookImage,
                    bookAuthor
                );
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Kitap kütüphanenize eklendi.',
                    visibilityTime: 2000,
                });
            } else if (selectedType === 'event') {
                // Save to Library as 'Going' (reading)
                await libraryService.updateStatus(
                    userId,
                    'event',
                    eventContentId,
                    'reading',
                    0,
                    eventTitle,
                    eventImage,
                    eventLocation // Map location to author field for display
                );

                // Formatting event details into a post since there is no specific event creation endpoint
                const eventDetails = `${eventTitle} - ${eventLocation}\nTarih: ${eventDate}`;
                await postService.create(
                    userId,
                    eventDetails,
                    eventNotes, // Pass user notes as comment/caption
                    eventTitle, // source (appears as bold title in card)
                    eventLocation, // author (appears as subtitle in card)
                    undefined,
                    'event',
                    eventContentId,
                    eventImage,
                    undefined // topicId
                );
                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Etkinlik kütüphanenize ve akışa eklendi.',
                    visibilityTime: 2000,
                });
            }

            // Simulate success
            resetState();
            handleClose();
        } catch (error) {
            console.error('Post failed:', error);
            // Show error toast
        }
    };

    const isPostDisabled = () => {
        if (selectedType === 'thought' && !selectedTopic) return true;
        if (selectedType === 'book' && (!bookTitle || !bookAuthor)) return true;
        if (selectedType === 'review' && (!reviewTitle || !reviewText)) return true;
        if (selectedType === 'event' && (!eventTitle)) return true;
        return false;
    };

    if (!visible && opacity.value === 0) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleClose}>
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
                            ? { width: '100%', height: height * 0.95, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                            : { width: '100%', maxHeight: height * 0.6 },
                        containerStyle
                    ]}>

                        {/* Header */}
                        {/* Header */}
                        <View style={[styles.header, {
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                            backgroundColor: theme.colors.surface + '80' // Slight transparency or surface color
                        }]}>
                            {selectedType ? (
                                <TouchableOpacity onPress={handleBack} style={[styles.iconButton, { backgroundColor: theme.colors.background }]}>
                                    <ArrowLeft size={18} color={theme.colors.text} />
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 40 }} /> // Balance the close button
                            )}

                            <Text style={[styles.headerTitle, {
                                color: theme.colors.primary,
                                fontFamily: theme.fonts.headings,
                                fontSize: 20
                            }]}>
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
                                <TouchableOpacity onPress={handleClose} style={[styles.iconButton, { backgroundColor: theme.colors.background }]}>
                                    <X size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Content Scroll */}
                        <ScrollView
                            style={styles.contentScroll}
                            contentContainerStyle={{
                                paddingBottom: selectedType ? 120 : 24,
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
            </KeyboardAvoidingView>
        </View>
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
