import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, Dimensions, Easing, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Send, Image, X } from 'lucide-react-native';

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
    // Custom hook or logic can be inside, but keeping it simple
    const { theme } = useTheme();
    const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = React.useState(visible);

    React.useEffect(() => {
        if (visible) {
            setIsVisible(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
            ]).start(() => setIsVisible(false));
        }
    }, [visible]);

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
            marginBottom: 20,
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
            marginBottom: 24,
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
        cancelButton: {
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

    if (!isVisible && !visible) return null;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <Animated.View style={[
                            styles.sheet,
                            { transform: [{ translateY: slideAnim }] }
                        ]}>
                            <View style={styles.handle} />
                            <Text style={styles.title}>Paylaş</Text>

                            <View style={styles.optionsContainer}>
                                {/* DM Option */}
                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={onSelectDM}
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
                                    onPress={onSelectStory}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                                        <Image size={28} color={theme.colors.success} />
                                    </View>
                                    <Text style={styles.optionLabel}>Hikayede Paylaş</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>Vazgeç</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
