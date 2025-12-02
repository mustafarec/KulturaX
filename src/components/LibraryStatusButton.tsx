import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import { libraryService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

interface LibraryStatusButtonProps {
    contentType: 'movie' | 'book';
    contentId: string;
    onStatusChange?: () => void;
}

export const LibraryStatusButton: React.FC<LibraryStatusButtonProps> = ({ contentType, contentId, onStatusChange }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const statusOptions = [
        { label: contentType === 'book' ? 'Okudum' : 'İzledim', value: 'read', icon: 'check' },
        { label: contentType === 'book' ? 'Okuyorum' : 'İzliyorum', value: 'reading', icon: 'eyeglass' },
        { label: contentType === 'book' ? 'Okuyacağım' : 'İzleyeceğim', value: 'want_to_read', icon: 'clock' },
        { label: 'Yarım Bıraktım', value: 'dropped', icon: 'close' },
    ];

    useEffect(() => {
        if (user) {
            fetchStatus();
        }
    }, [user, contentId]);

    const fetchStatus = async () => {
        try {
            const data = await libraryService.getStatus(user!.id, contentType, contentId);
            if (data) {
                setStatus(data.status);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        setIsLoading(true);
        try {
            await libraryService.updateStatus(user!.id, contentType, contentId, newStatus);
            setStatus(newStatus);
            setShowModal(false);
            if (onStatusChange) onStatusChange();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusLabel = () => {
        const option = statusOptions.find(opt => opt.value === status);
        return option ? option.label : 'Listeme Ekle';
    };

    const getStatusIcon = () => {
        const option = statusOptions.find(opt => opt.value === status);
        return option ? option.icon : 'plus';
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.button, status ? styles.activeButton : null]}
                onPress={() => setShowModal(true)}
            >
                <Icon name={getStatusIcon()} size={14} color={status ? '#fff' : theme.colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.buttonText, status ? styles.activeButtonText : null]}>
                    {getStatusLabel()}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Durum Seç</Text>
                        {statusOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.optionButton, status === option.value && styles.selectedOption]}
                                onPress={() => handleStatusUpdate(option.value)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name={option.icon} size={16} color={status === option.value ? '#fff' : theme.colors.text} style={{ marginRight: 10 }} />
                                    <Text style={[styles.optionText, status === option.value && styles.selectedOptionText]}>
                                        {option.label}
                                    </Text>
                                </View>
                                {isLoading && status === option.value && (
                                    <ActivityIndicator size="small" color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.glass,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadows.soft,
    },
    activeButton: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    buttonText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeButtonText: {
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 24,
        width: '80%',
        maxWidth: 320,
        ...theme.shadows.soft,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    optionButton: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 10,
        backgroundColor: theme.colors.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    selectedOption: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        ...theme.shadows.soft,
    },
    optionText: {
        fontSize: 15,
        color: theme.colors.text,
        fontWeight: '500',
    },
    selectedOptionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
