import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
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
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
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

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
