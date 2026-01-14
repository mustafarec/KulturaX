import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { postService } from '../services/backendApi';

interface QuoteModalProps {
    visible: boolean;
    onClose: () => void;
    source: string;
    author: string;
    bookCover: string;
    userId: number;
    onQuoteAdded?: () => void;
    initialContentType?: string;
    initialContentId?: string | number;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
    visible,
    onClose,
    source,
    author,
    bookCover,
    userId,
    onQuoteAdded,
    initialContentType = 'book',
    initialContentId
}) => {
    const { theme } = useTheme();
    const [quoteText, setQuoteText] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modal: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: theme.spacing.l,
            maxHeight: '90%', // Increased height
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
        inputSection: {
            marginBottom: theme.spacing.m,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: theme.spacing.s,
        },
        textInput: {
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: theme.spacing.m,
            color: theme.colors.text,
            minHeight: 100,
            textAlignVertical: 'top',
            fontSize: 16,
        },
        commentInput: {
            minHeight: 80,
        },
        submitButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            padding: theme.spacing.m,
            alignItems: 'center',
            marginTop: theme.spacing.s,
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

    const getPlaceholder = () => {
        switch (initialContentType) {
            case 'movie':
                return "Filmden bir replik yazın...";
            case 'music':
                return "Şarkıdan bir söz yazın...";
            case 'book':
            default:
                return "Kitaptan bir alıntı yazın...";
        }
    };

    const getTitle = () => {
        return "Alıntı ve Yorum Ekle";
    };

    const handleSubmit = async () => {
        if (!quoteText.trim()) {
            Toast.show({
                type: 'info',
                text1: 'Dikkat',
                text2: 'Lütfen bir alıntı yazın.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await postService.create(
                userId,
                quoteText,
                commentText, // Pass the comment
                source,
                author,
                undefined, // originalPostId
                initialContentType, // contentType
                initialContentId ? String(initialContentId) : undefined, // contentId
                bookCover // imageUrl
            );

            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Paylaşım yapıldı!',
            });
            setQuoteText('');
            setCommentText('');
            if (onQuoteAdded) onQuoteAdded();
            onClose();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: error.message || 'Paylaşım yapılamadı.',
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
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{getTitle()}: {source}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Alıntı:</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder={getPlaceholder()}
                                multiline
                                numberOfLines={4}
                                value={quoteText}
                                onChangeText={setQuoteText}
                                placeholderTextColor={theme.colors.textSecondary}
                                autoFocus
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Yorumunuz (İsteğe bağlı):</Text>
                            <TextInput
                                style={[styles.textInput, styles.commentInput]}
                                placeholder="Bu alıntı hakkında ne düşünüyorsunuz?"
                                multiline
                                numberOfLines={3}
                                value={commentText}
                                onChangeText={setCommentText}
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
                                <Text style={styles.submitButtonText}>Paylaş</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
