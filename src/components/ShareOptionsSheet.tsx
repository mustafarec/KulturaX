import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../context/ThemeContext';
import { Send, Image } from 'lucide-react-native';

interface ShareOptionsSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectDM: () => void;
    onSelectStory: () => void;
}

export const ShareOptionsSheet: React.FC<ShareOptionsSheetProps> = ({
    visible,
    onClose,
    onSelectDM,
    onSelectStory,
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

    const handleDM = useCallback(() => {
        bottomSheetRef.current?.dismiss();
        onSelectDM();
    }, [onSelectDM]);

    const handleStory = useCallback(() => {
        bottomSheetRef.current?.dismiss();
        onSelectStory();
    }, [onSelectStory]);

    const styles = StyleSheet.create({
        content: {
            paddingBottom: Math.max(insets.bottom + 16, 40),
            paddingTop: 8,
        },
        title: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 24,
        },
        optionsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 40,
            paddingHorizontal: 32,
        },
        option: {
            alignItems: 'center',
            gap: 12,
        },
        optionIcon: {
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
        },
        optionLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
        },

    });

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={['28%']}
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
                <Text style={styles.title}>Paylaş</Text>

                <View style={styles.optionsContainer}>
                    {/* DM Option */}
                    <TouchableOpacity
                        style={styles.option}
                        onPress={handleDM}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Send size={28} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.optionLabel}>Mesaj Gönder</Text>
                    </TouchableOpacity>

                    {/* Story/Image Option */}
                    <TouchableOpacity
                        style={styles.option}
                        onPress={handleStory}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                            <Image size={28} color={theme.colors.success} />
                        </View>
                        <Text style={styles.optionLabel}>Hikayede Paylaş</Text>
                    </TouchableOpacity>
                </View>


            </BottomSheetView>
        </BottomSheetModal>
    );
};
