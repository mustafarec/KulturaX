import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../context/ThemeContext';

interface AppBottomSheetProps {
    children: React.ReactNode;
    snapPoints?: string[];
    enablePanDownToClose?: boolean;
    onClose?: () => void;
    title?: string;
}

// Standard BottomSheet (for inline use)
export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
    ({ children, snapPoints = ['25%', '50%'], enablePanDownToClose = true, onClose, title }, ref) => {
        const { theme } = useTheme();

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            []
        );

        const handleStyle = useMemo(() => ({
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
        }), [theme]);

        const handleIndicatorStyle = useMemo(() => ({
            backgroundColor: theme.colors.border,
            width: 40,
        }), [theme]);

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={enablePanDownToClose}
                backdropComponent={renderBackdrop}
                handleStyle={handleStyle}
                handleIndicatorStyle={handleIndicatorStyle}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                onClose={onClose}
            >
                <BottomSheetView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
                    {title && (
                        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                    )}
                    {children}
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

// Modal variant (for use with BottomSheetModalProvider)
export const AppBottomSheetModal = forwardRef<BottomSheetModal, AppBottomSheetProps>(
    ({ children, snapPoints = ['25%', '50%'], enablePanDownToClose = true, onClose, title }, ref) => {
        const { theme } = useTheme();

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

        const handleStyle = useMemo(() => ({
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
        }), [theme]);

        const handleIndicatorStyle = useMemo(() => ({
            backgroundColor: theme.colors.border,
            width: 40,
        }), [theme]);

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={snapPoints}
                enablePanDownToClose={enablePanDownToClose}
                backdropComponent={renderBackdrop}
                handleStyle={handleStyle}
                handleIndicatorStyle={handleIndicatorStyle}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                onDismiss={onClose}
            >
                <BottomSheetView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
                    {title && (
                        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                    )}
                    {children}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
        paddingTop: 8,
    },
});
