import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, BackHandler, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { usePostHub } from '../../context/PostHubContext';
import { PostTypeSelector, CreateTab } from '../post/creation/PostTypeSelector';

export const PostCreationModal: React.FC = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { isModalVisible, closeModal, currentDraft } = usePostHub();
    const insets = useSafeAreaInsets();

    // Animation values
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(300);

    useEffect(() => {
        if (isModalVisible) {
            opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
            translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });

            // If draft exists, navigate directly to appropriate screen
            if (currentDraft) {
                handleSelectType(currentDraft.type as CreateTab);
            }
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            translateY.value = withTiming(300, { duration: 200 });
        }
    }, [isModalVisible, currentDraft]);

    // Handle Hardware Back Button
    useEffect(() => {
        const backAction = () => {
            if (isModalVisible) {
                closeModal();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isModalVisible]);

    const handleSelectType = (type: CreateTab) => {
        closeModal();

        // Small delay to let bottom sheet close animation start
        setTimeout(() => {
            switch (type) {
                case 'thought':
                    (navigation as any).navigate('CreateThought', { draft: currentDraft });
                    break;
                case 'review':
                    (navigation as any).navigate('CreateReview', { draft: currentDraft });
                    break;
                case 'book':
                    (navigation as any).navigate('CreateBook', { draft: currentDraft });
                    break;
                case 'event':
                    (navigation as any).navigate('CreateEvent', { draft: currentDraft });
                    break;
                case 'quote':
                    (navigation as any).navigate('CreateQuote', { mode: 'quote', draft: currentDraft });
                    break;
            }
        }, 100);
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!isModalVisible) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="auto">
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View style={[styles.backdrop, backdropStyle]} />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <View style={styles.bottomContainer} pointerEvents="box-none">
                <Animated.View style={[
                    styles.bottomSheet,
                    {
                        backgroundColor: theme.colors.background,
                        paddingBottom: Math.max(insets.bottom, 20),
                    },
                    containerStyle
                ]}>
                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.headings }]}>
                            Ne Paylaşmak İstersiniz?
                        </Text>
                        <TouchableOpacity onPress={closeModal} style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}>
                            <X size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Type Selector */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <PostTypeSelector onSelectType={handleSelectType} />
                    </ScrollView>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 16,
    },
});
