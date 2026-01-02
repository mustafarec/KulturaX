import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { libraryService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import { Check, Glasses, Clock, X, Plus } from 'lucide-react-native';

interface LibraryStatusButtonProps {
    contentType: 'movie' | 'book' | 'music';
    contentId: string;
    onStatusChange?: () => void;
    contentTitle?: string;
    imageUrl?: string;
    author?: string;
    summary?: string;
    lyrics?: string;
}

export const LibraryStatusButton: React.FC<LibraryStatusButtonProps> = ({ contentType, contentId, onStatusChange, contentTitle, imageUrl, author, summary, lyrics }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const getLabels = () => {
        if (contentType === 'book') return { read: 'Okudum', reading: 'Okuyorum', want: 'Okuyacağım' };
        if (contentType === 'music') return { read: 'Dinledim', reading: 'Dinliyorum', want: 'Dinleyeceğim' };
        return { read: 'İzledim', reading: 'İzliyorum', want: 'İzleyeceğim' };
    };

    const labels = getLabels();

    const statusOptions = [
        { label: labels.read, value: 'read', icon: Check },
        { label: labels.reading, value: 'reading', icon: Glasses }, // Maybe change icon for music? Keep for now.
        { label: labels.want, value: 'want_to_read', icon: Clock },
        { label: 'Yarım Bıraktım', value: 'dropped', icon: X },
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
            // Pass metadata to service
            await libraryService.updateStatus(contentType, contentId, newStatus, 0, contentTitle, imageUrl, author, summary, lyrics);
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
        return option ? option.icon : Plus;
    };

    const styles = React.useMemo(() => StyleSheet.create({
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            alignSelf: 'flex-start', // İçeriği kadar yer kaplaması için
            ...theme.shadows.soft,
        },
        activeButton: {
            backgroundColor: theme.colors.primary,
        },
        buttonText: {
            fontSize: 11,
            fontWeight: '600',
            color: theme.colors.primary,
        },
        activeButtonText: {
            color: '#fff',
        },
        // ... (diğer stiller aynı kalacak)
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            width: '80%',
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 20,
            ...theme.shadows.default,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 20,
            textAlign: 'center',
        },
        optionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between', // For loading indicator
            paddingVertical: 15,
            paddingHorizontal: 15,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            borderRadius: 12, // Rounded options
        },
        selectedOption: {
            backgroundColor: theme.colors.primary,
        },
        optionText: {
            fontSize: 16,
            color: theme.colors.text,
        },
        selectedOptionText: {
            color: '#fff',
            fontWeight: 'bold',
        }
    }), [theme]);

    return (
        <View>
            <TouchableOpacity
                style={[styles.button, status ? styles.activeButton : null]}
                onPress={() => setShowModal(true)}
            >
                {React.createElement(getStatusIcon(), { size: 14, color: status ? '#fff' : theme.colors.primary, style: { marginRight: 6 } })}
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
                                    {React.createElement(option.icon, { size: 16, color: status === option.value ? '#fff' : theme.colors.text, style: { marginRight: 10 } })}
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


