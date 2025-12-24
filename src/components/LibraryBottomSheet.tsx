import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, Eye, Clock, XCircle, Trash2, Check, Film, Music, Headphones, Calendar } from 'lucide-react-native';

type ContentType = 'book' | 'movie' | 'music' | 'event';

interface LibraryBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectStatus: (status: string) => void;
    contentType: ContentType;
    currentStatus: string | null;
}

export const LibraryBottomSheet: React.FC<LibraryBottomSheetProps> = ({
    visible,
    onClose,
    onSelectStatus,
    contentType,
    currentStatus,
}) => {
    const { theme } = useTheme();
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

    // Status labels based on content type
    const getStatusOptions = () => {
        const isBook = contentType === 'book';
        const isMovie = contentType === 'movie';
        const isMusic = contentType === 'music';
        const isEvent = contentType === 'event';

        return [
            {
                status: 'reading',
                label: isMovie ? 'İzliyorum' : isMusic ? 'Dinliyorum' : isEvent ? 'Katılıyorum' : 'Okuyorum',
                icon: Eye,
                color: theme.colors.primary,
            },
            {
                status: 'read',
                label: isMovie ? 'İzledim' : isMusic ? 'Dinledim' : isEvent ? 'Katıldım' : 'Okudum',
                icon: Check,
                color: theme.colors.success,
            },
            {
                status: isMovie ? 'want_to_watch' : isMusic ? 'want_to_listen' : isEvent ? 'want_to_attend' : 'want_to_read',
                label: isMovie ? 'İzleyeceğim' : isMusic ? 'Dinleyeceğim' : isEvent ? 'Katılacağım' : 'Okuyacağım',
                icon: Clock,
                color: theme.colors.warning,
            },
            {
                status: 'dropped',
                label: 'Bıraktım',
                icon: XCircle,
                color: theme.colors.error,
            },
        ];
    };

    const getContentIcon = () => {
        switch (contentType) {
            case 'movie': return Film;
            case 'music': return Headphones;
            case 'event': return Calendar;
            default: return BookOpen;
        }
    };

    const statusOptions = getStatusOptions();
    const ContentIcon = getContentIcon();

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        sheet: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            paddingTop: 12,
            ...theme.shadows.soft,
        },
        handle: {
            width: 40,
            height: 4,
            backgroundColor: theme.colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 16,
        },
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            paddingHorizontal: 16,
            gap: 8,
        },
        title: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
        },
        optionContainer: {
            paddingHorizontal: 16,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 16,
            marginBottom: 8,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        optionActive: {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '10',
        },
        optionIcon: {
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
        },
        optionLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            flex: 1,
        },
        checkMark: {
            marginLeft: 'auto',
        },
        removeOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            marginTop: 8,
            marginHorizontal: 16,
            borderRadius: 16,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        removeLabel: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.error,
            marginLeft: 8,
        },
        cancelButton: {
            marginTop: 12,
            marginHorizontal: 16,
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 16,
            backgroundColor: theme.colors.background,
        },
        cancelText: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.handle} />

                    <View style={styles.headerContainer}>
                        <ContentIcon size={22} color={theme.colors.primary} />
                        <Text style={styles.title}>Kütüphaneye Ekle</Text>
                    </View>

                    <View style={styles.optionContainer}>
                        {statusOptions.map((option) => {
                            const isActive = currentStatus === option.status;
                            const IconComponent = option.icon;

                            return (
                                <TouchableOpacity
                                    key={option.status}
                                    style={[styles.option, isActive && styles.optionActive]}
                                    onPress={() => onSelectStatus(option.status)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                                        <IconComponent size={22} color={option.color} />
                                    </View>
                                    <Text style={styles.optionLabel}>{option.label}</Text>
                                    {isActive && (
                                        <Check size={22} color={theme.colors.primary} style={styles.checkMark} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Remove from library option */}
                    {currentStatus && (
                        <TouchableOpacity
                            style={styles.removeOption}
                            onPress={() => onSelectStatus('')}
                            activeOpacity={0.7}
                        >
                            <Trash2 size={20} color="#EF4444" />
                            <Text style={styles.removeLabel}>Listeden Kaldır</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Vazgeç</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};
