import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { theme } from '../theme/theme';
import { postService } from '../services/backendApi';

interface QuoteModalProps {
    visible: boolean;
    onClose: () => void;
    source: string;
    author: string;
    bookCover: string; // Keeping this name for now to minimize changes, or rename to imageUrl? Let's keep it but treat it as generic image url.
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
    const [quoteText, setQuoteText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                text2: 'Alıntı paylaşıldı!',
            });
            setQuoteText('');
            if (onQuoteAdded) onQuoteAdded();
            onClose();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: error.message || 'Alıntı paylaşılamadı.',
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
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Alıntı Ekle: {source}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Alıntı:</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Kitaptan bir alıntı yazın..."
                            multiline
                            numberOfLines={6}
                            value={quoteText}
                            onChangeText={setQuoteText}
                            placeholderTextColor={theme.colors.textSecondary}
                            autoFocus
                        />
                    </View >

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
                </View >
            </View >
        </Modal >
    );
};

const styles = StyleSheet.create({
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
    inputSection: {
        marginBottom: theme.spacing.l,
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
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
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
});
