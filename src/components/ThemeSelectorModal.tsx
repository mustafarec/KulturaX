import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../context/ThemeContext';

interface ThemeSelectorModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, onClose }) => {
    const { theme, themeMode, darkThemeStyle, setThemeMode, setDarkThemeStyle } = useTheme();
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

    const isDarkMode = themeMode === 'dark';
    const isAutoMode = themeMode === 'auto';

    // Optimistic state to prevent switch flicker
    const [optimisticDarkMode, setOptimisticDarkMode] = React.useState(isDarkMode);
    const [optimisticAutoMode, setOptimisticAutoMode] = React.useState(isAutoMode);

    // Sync optimistic state when real state changes (but only if they differ significantly to avoid loops)
    useEffect(() => {
        setOptimisticDarkMode(isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        setOptimisticAutoMode(isAutoMode);
    }, [isAutoMode]);

    const handleDarkModeToggle = (value: boolean) => {
        setOptimisticDarkMode(value); // Immediate visual feedback
        // Small delay to allow animation to complete before heavy theme change
        setTimeout(() => {
            if (value) {
                setThemeMode('dark');
            } else {
                setThemeMode('light');
            }
        }, 50);
    };

    const handleAutoModeToggle = (value: boolean) => {
        setOptimisticAutoMode(value); // Immediate visual feedback
        setTimeout(() => {
            if (value) {
                setThemeMode('auto');
            } else {
                setThemeMode('light'); // Or revert to previous? Usually light is safe fallback
            }
        }, 50);
    };

    // Dynamic snap points based on content (or just set consistent ones)
    // Using 50% as base which should fit most content
    const snapPoints = useMemo(() => ['50%', '70%'], []);

    const styles = StyleSheet.create({
        contentContainer: {
            flex: 1,
            padding: 24,
        },
        header: {
            alignItems: 'center',
            marginBottom: 20,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 24,
            textAlign: 'center',
        },
        section: {
            marginBottom: 24,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
        },
        labelContainer: {
            flex: 1,
            paddingRight: 16,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 4,
        },
        subLabel: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            lineHeight: 18,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 16,
        },
        radioRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingVertical: 4,
        },
        radioLabel: {
            fontSize: 16,
            color: theme.colors.text,
        },
        radioButton: {
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.colors.textSecondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        radioButtonInner: {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.colors.primary,
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
            <BottomSheetView style={styles.contentContainer}>
                <Text style={styles.title}>Karanlık mod</Text>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Karanlık mod</Text>
                        <Switch
                            value={optimisticDarkMode}
                            onValueChange={handleDarkModeToggle}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={'#f4f3f4'}
                            disabled={optimisticAutoMode}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Cihaz ayarlarını kullan</Text>
                            <Text style={styles.subLabel}>
                                Karanlık modun cihazınızın Ekran ve Parlaklık ayarlarındaki seçime göre ayarlanmasını sağlayın.
                            </Text>
                        </View>
                        <Switch
                            value={optimisticAutoMode}
                            onValueChange={handleAutoModeToggle}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    </View>
                </View>

                {(isDarkMode || isAutoMode) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tema</Text>

                        <TouchableOpacity
                            style={styles.radioRow}
                            onPress={() => setDarkThemeStyle('dim')}
                        >
                            <Text style={styles.radioLabel}>Kahverengi</Text>
                            <View style={[
                                styles.radioButton,
                                darkThemeStyle === 'dim' && { borderColor: '#8B7355' } // Brown color
                            ]}>
                                {darkThemeStyle === 'dim' && <View style={[styles.radioButtonInner, { backgroundColor: '#8B7355' }]} />}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.radioRow}
                            onPress={() => setDarkThemeStyle('black')}
                        >
                            <Text style={styles.radioLabel}>Işıkları kapat</Text>
                            <View style={[
                                styles.radioButton,
                                darkThemeStyle === 'black' && { borderColor: theme.colors.text } // Use text color based on theme
                            ]}>
                                {darkThemeStyle === 'black' && <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.text }]} />}
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </BottomSheetView>
        </BottomSheetModal>
    );
};
