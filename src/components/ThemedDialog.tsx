import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface DialogAction {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
    fullWidth?: boolean;
}

interface ThemedDialogProps {
    visible: boolean;
    title: string;
    message?: string;
    actions: DialogAction[];
    onClose?: () => void;
}

export const ThemedDialog: React.FC<ThemedDialogProps> = ({ visible, title, message, actions, onClose }) => {
    const { theme } = useTheme();

    if (!visible) return null;

    // Default to a single "OK" button if no actions provided
    const dialogActions: DialogAction[] = actions.length > 0 ? actions : [{ text: 'OK', style: 'default', onPress: onClose }];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose || (() => { })}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View
                    entering={ZoomIn.duration(150).springify().damping(30).stiffness(350).mass(0.8)}
                    exiting={FadeOut.duration(100)}
                    style={[
                        styles.dialogPanel,
                        {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            shadowColor: theme.dark ? '#000' : '#888',
                        }
                    ]}
                >
                    <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.main }]}>
                        {title}
                    </Text>
                    {message && (
                        <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.fonts.main }]}>
                            {message}
                        </Text>
                    )}

                    <View style={styles.actionsContainer}>
                        {dialogActions.map((action, index) => {
                            const isDestructive = action.style === 'destructive';
                            const isCancel = action.style === 'cancel';

                            // Determine styles based on action type
                            let buttonBg = theme.colors.primary;
                            let textColor = '#fff';

                            if (isCancel) {
                                buttonBg = 'transparent'; // Or a subtle gray
                                textColor = theme.colors.textSecondary;
                            } else if (isDestructive) {
                                buttonBg = '#EF4444'; // Red-500
                                textColor = '#fff';
                            } else {
                                // Default Primary
                                buttonBg = theme.colors.primary;
                                textColor = '#fff'; // Assuming primary text is white, or check theme
                                // Current theme primary is brown, text white fits.
                            }

                            // If cancel, maybe add a border or distinct look
                            const buttonStyle = isCancel
                                ? [styles.button, styles.cancelButton, { borderColor: theme.colors.border }]
                                : [styles.button, { backgroundColor: buttonBg }];

                            const baseStyle: any[] = [styles.buttonBase, buttonStyle];
                            if (action.fullWidth) {
                                baseStyle.push({ width: '100%', flexGrow: 0 }); // Force full width, disable grow logic used for others
                            }

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={baseStyle}
                                    onPress={action.onPress}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.buttonText, { color: textColor, fontFamily: theme.fonts.main }]}>
                                        {action.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dimmed backdrop
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    dialogPanel: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 24,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    buttonBase: {
        paddingVertical: 10,
        paddingHorizontal: 12, // Reduced horizontal padding
        borderRadius: 8,
        minWidth: 70, // Reduced minWidth
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1, // Allow buttons to grow and fill available space
        margin: 4, // Add explicit margin for wrap spacing
    },
    button: {
        // dynamic bg
    },
    cancelButton: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    marginLeft: {
        marginLeft: 12,
    }
});
