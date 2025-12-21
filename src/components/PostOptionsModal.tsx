import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Trash2, Pin, PinOff, Heart, EyeOff, Flag, Bookmark } from 'lucide-react-native';

interface PostOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onDelete?: () => void;
    onFeedback?: (type: 'report' | 'not_interested' | 'show_more') => void;
    isOwner?: boolean;
    targetPosition?: { x: number; y: number; width: number; height: number } | null;
    isPinned?: boolean;
    onTogglePin?: () => void;
    onToggleSave?: () => void;
    isSaved?: boolean;
}

export const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
    visible,
    onClose,
    onDelete,
    isOwner,
    targetPosition,
    onFeedback,
    isPinned,
    onTogglePin,
    onToggleSave,
    isSaved
}) => {
    const { theme } = useTheme();

    if (!visible || !targetPosition) return null;

    const windowWidth = Dimensions.get('window').width;

    // Position calculation
    const right = windowWidth - (targetPosition.x + targetPosition.width);
    const top = targetPosition.y + targetPosition.height + 6;

    const options = [
        ...(onToggleSave ? [{
            label: isSaved ? 'Kaydedilenlerden Çıkar' : 'Kaydet',
            icon: Bookmark,
            color: theme.colors.text,
            onPress: () => {
                onClose();
                onToggleSave();
            }
        }] : []),

        ...(isOwner ? [{
            label: 'Sil',
            icon: Trash2,
            color: theme.colors.error,
            onPress: () => {
                onClose();
                if (onDelete) onDelete();
            }
        },
        {
            label: isPinned ? 'Sabitlemeyi Kaldır' : 'Profile Sabitle',
            icon: isPinned ? PinOff : Pin,
            color: theme.colors.text,
            onPress: () => {
                onClose();
                if (onTogglePin) onTogglePin();
            }
        }] : [
            {
                label: 'Bunu daha çok göster',
                icon: Heart,
                color: theme.colors.primary,
                onPress: () => {
                    onClose();
                    if (onFeedback) onFeedback('show_more');
                }
            },
            {
                label: 'İlgilenmiyorum',
                icon: EyeOff,
                color: theme.colors.textSecondary,
                onPress: () => {
                    onClose();
                    if (onFeedback) onFeedback('not_interested');
                }
            },
            {
                label: 'Bildir',
                icon: Flag,
                color: theme.colors.error,
                onPress: () => {
                    onClose();
                    if (onFeedback) onFeedback('report');
                }
            }
        ])
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={ZoomIn.duration(100).springify().damping(20).stiffness(300)}
                            exiting={FadeOut.duration(75)}
                            style={[
                                styles.dropdown,
                                {
                                    top: top,
                                    right: right,
                                    transformOrigin: 'top right',
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                    shadowColor: theme.dark ? '#000' : '#888',
                                }
                            ]}
                        >
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={option.label}
                                    style={styles.menuItem}
                                    onPress={option.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.itemLeft}>
                                        <option.icon size={18} color={option.color} style={styles.icon} />
                                        <Text style={[styles.menuText, { color: option.color, fontFamily: theme.fonts.main }]}>{option.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
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
        backgroundColor: 'transparent',
    },
    dropdown: {
        position: 'absolute',
        minWidth: 180,
        maxWidth: 260,
        borderRadius: 12,
        borderWidth: 1,
        padding: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 2,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
