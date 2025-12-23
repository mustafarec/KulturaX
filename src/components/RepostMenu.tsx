import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { Repeat, Pencil } from 'lucide-react-native';
import { theme } from '../theme/theme';

interface RepostMenuProps {
    visible: boolean;
    onClose: () => void;
    onDirectRepost: () => void;
    onQuoteRepost: () => void;
    isReposted?: boolean;
}

export const RepostMenu: React.FC<RepostMenuProps> = ({ visible, onClose, onDirectRepost, onQuoteRepost, isReposted }) => {
    const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen (below)

    useEffect(() => {
        if (visible) {
            // Slide up
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            // Reset to off-screen
            slideAnim.setValue(300);
        }
    }, [visible]);

    const handleClose = () => {
        // Slide down then close
        Animated.timing(slideAnim, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.handle} />

                            <TouchableOpacity style={styles.option} onPress={onDirectRepost}>
                                <Repeat size={20} color={isReposted ? theme.colors.error : theme.colors.text} style={styles.icon} />
                                <Text style={[styles.optionText, isReposted && { color: theme.colors.error }]}>
                                    {isReposted ? 'Yeniden gönderiyi geri al' : 'Yeniden gönder'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={onQuoteRepost}>
                                <Pencil size={20} color={theme.colors.text} style={styles.icon} />
                                <Text style={styles.optionText}>Alıntı</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelText}>İptal</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.glassBorder,
    },
    icon: {
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
});

