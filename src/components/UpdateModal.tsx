/**
 * Update Modal - KültüraX
 * 
 * Güncelleme olduğunda kullanıcıya gösterilen popup.
 * Zorunlu ve opsiyonel güncelleme desteği.
 */

import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    BackHandler,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface UpdateModalProps {
    visible: boolean;
    isForceUpdate: boolean;
    latestVersion?: string;
    releaseNotes?: string;
    onUpdate: () => void;
    onLater?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
    visible,
    isForceUpdate,
    latestVersion,
    releaseNotes,
    onUpdate,
    onLater,
}) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    // Zorunlu güncellemede geri tuşunu engelle
    React.useEffect(() => {
        if (visible && isForceUpdate) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
            return () => backHandler.remove();
        }
    }, [visible, isForceUpdate]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={isForceUpdate ? undefined : onLater}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={styles.icon}>🎉</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {isForceUpdate ? 'Güncelleme Gerekli' : 'Yeni Güncelleme Var!'}
                    </Text>

                    {/* Version */}
                    {latestVersion && (
                        <Text style={[styles.version, { color: colors.primary }]}>
                            Versiyon {latestVersion}
                        </Text>
                    )}

                    {/* Description */}
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {isForceUpdate
                            ? 'Uygulamayı kullanmaya devam etmek için güncellemeniz gerekmektedir.'
                            : 'Yeni özellikler ve iyileştirmeler sizi bekliyor!'}
                    </Text>

                    {/* Release Notes */}
                    {releaseNotes && (
                        <View style={[styles.notesContainer, { backgroundColor: colors.background }]}>
                            <Text style={[styles.notesTitle, { color: colors.text }]}>
                                Yenilikler
                            </Text>
                            <Text style={[styles.notes, { color: colors.textSecondary }]}>
                                {releaseNotes}
                            </Text>
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {!isForceUpdate && onLater && (
                            <TouchableOpacity
                                style={[styles.button, styles.laterButton, { borderColor: colors.border }]}
                                onPress={onLater}
                            >
                                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                                    Sonra
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.updateButton,
                                { backgroundColor: colors.primary },
                                isForceUpdate && styles.fullWidthButton,
                            ]}
                            onPress={onUpdate}
                        >
                            <Text style={[styles.buttonText, styles.updateButtonText]}>
                                Güncelle
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 36,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    version: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 16,
    },
    notesContainer: {
        width: '100%',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    notesTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    notes: {
        fontSize: 13,
        lineHeight: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    laterButton: {
        borderWidth: 1,
    },
    updateButton: {
        // backgroundColor is set dynamically
    },
    fullWidthButton: {
        flex: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    updateButtonText: {
        color: '#FFFFFF',
    },
});
