import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Control visibility via ref
    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    // Status labels based on content type
    const getStatusOptions = useCallback(() => {
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
    }, [contentType, theme.colors]);

    const getContentIcon = useCallback(() => {
        switch (contentType) {
            case 'movie': return Film;
            case 'music': return Headphones;
            case 'event': return Calendar;
            default: return BookOpen;
        }
    }, [contentType]);

    const statusOptions = useMemo(() => getStatusOptions(), [getStatusOptions]);
    const ContentIcon = useMemo(() => getContentIcon(), [getContentIcon]);

    const handleSelect = useCallback((status: string) => {
        bottomSheetRef.current?.dismiss();
        onSelectStatus(status);
    }, [onSelectStatus]);

    const snapPoints = useMemo(() => currentStatus ? ['65%'] : ['60%'], [currentStatus]);

    const styles = StyleSheet.create({
        content: {
            paddingBottom: Math.max(insets.bottom, 20) + 20,
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
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            handleStyle={{
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.colors.border,
                width: 40,
            }}
            backgroundStyle={{ backgroundColor: theme.colors.surface }}
            onDismiss={onClose}
        >
            <BottomSheetView style={[styles.content, { backgroundColor: theme.colors.surface }]}>
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
                                onPress={() => handleSelect(option.status)}
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
                        onPress={() => handleSelect('')}
                        activeOpacity={0.7}
                    >
                        <Trash2 size={20} color="#EF4444" />
                        <Text style={styles.removeLabel}>Listeden Kaldır</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>Vazgeç</Text>
                </TouchableOpacity>
            </BottomSheetView>
        </BottomSheetModal>
    );
};
