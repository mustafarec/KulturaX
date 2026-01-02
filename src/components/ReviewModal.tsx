import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { StarRating } from './StarRating';
import { reviewService } from '../services/backendApi';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    contentType: string;
    contentId: string;
    contentTitle?: string;
    imageUrl?: string;
    userId: number;
    onReviewAdded?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    visible,
    onClose,
    contentType,
    contentId,
    contentTitle,
    imageUrl,
    userId,
    onReviewAdded
}) => {
    // Debugging passed props
    React.useEffect(() => {
        if (visible) {
            console.log('ReviewModal Visible. Validating Props:', { contentTitle, imageUrl });
        }
    }, [visible, contentTitle, imageUrl]);
    const { theme } = useTheme();
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const slideAnim = useRef(new Animated.Value(400)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            slideAnim.setValue(400);
        }
    }, [visible]);

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
        },
        modal: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: theme.spacing.l,
            maxHeight: '80%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.l,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            flex: 1,
        },
        closeButton: {
            fontSize: 24,
            color: theme.colors.textSecondary,
            padding: 4,
        },
        ratingSection: {
            marginBottom: theme.spacing.l,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: theme.spacing.s,
        },
        reviewSection: {
            marginBottom: theme.spacing.l,
        },
        textInput: {
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: theme.spacing.m,
            color: theme.colors.text,
            minHeight: 100,
            textAlignVertical: 'top',
        },
        submitButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            padding: theme.spacing.m,
            alignItems: 'center',
        },
        submitButtonDisabled: {
            opacity: 0.6,
        },
        submitButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
    }), [theme]);

    const handleSubmit = async () => {
        console.log('ReviewModal Submitting:', { userId, contentType, contentId, rating, reviewText, contentTitle, imageUrl }); // Debug log
        if (rating === 0) {
            Toast.show({
                type: 'info',
                text1: 'Dikkat',
                text2: 'Lütfen bir puan seçin.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewService.addReview(userId, contentType, contentId, rating, reviewText, contentTitle, imageUrl);
            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'İncelemeniz kaydedildi!',
            });
            setRating(0);
            setReviewText('');
            if (onReviewAdded) onReviewAdded();
            onClose();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'İnceleme kaydedilemedi.',
            });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>İncele: {contentTitle}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.label}>Puanınız:</Text>
                        <StarRating
                            rating={rating}
                            onRatingChange={setRating}
                            editable
                            size={32}
                        />
                    </View>

                    <View style={styles.reviewSection}>
                        <Text style={styles.label}>İncelemeniz (opsiyonel):</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ne düşündünüz?"
                            multiline
                            numberOfLines={4}
                            value={reviewText}
                            onChangeText={setReviewText}
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Kaydet</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

