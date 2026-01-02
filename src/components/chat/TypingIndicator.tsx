import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';

interface TypingIndicatorProps {
    isTyping: boolean;
    theme: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, theme }) => {
    const dot1Y = useSharedValue(0);
    const dot2Y = useSharedValue(0);
    const dot3Y = useSharedValue(0);

    useEffect(() => {
        if (isTyping) {
            // Bouncing dots animation - like iMessage
            dot1Y.value = withRepeat(
                withSequence(
                    withTiming(-5, { duration: 300 }),
                    withTiming(0, { duration: 300 })
                ),
                -1,
                false
            );

            dot2Y.value = withDelay(
                100,
                withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 300 }),
                        withTiming(0, { duration: 300 })
                    ),
                    -1,
                    false
                )
            );

            dot3Y.value = withDelay(
                200,
                withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 300 }),
                        withTiming(0, { duration: 300 })
                    ),
                    -1,
                    false
                )
            );
        } else {
            dot1Y.value = 0;
            dot2Y.value = 0;
            dot3Y.value = 0;
        }
    }, [isTyping]);

    const dot1Style = useAnimatedStyle(() => ({
        transform: [{ translateY: dot1Y.value }]
    }));

    const dot2Style = useAnimatedStyle(() => ({
        transform: [{ translateY: dot2Y.value }]
    }));

    const dot3Style = useAnimatedStyle(() => ({
        transform: [{ translateY: dot3Y.value }]
    }));

    if (!isTyping) return null;

    // Mesaj balonlarıyla aynı stilde
    const styles = StyleSheet.create({
        container: {
            alignSelf: 'flex-start',
            marginBottom: 4, // Mesajlarla aynı spacing
        },
        bubble: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.textSecondary,
            marginHorizontal: 2,
        },
    });

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            style={styles.container}
        >
            <View style={styles.bubble}>
                <Animated.View style={[styles.dot, dot1Style]} />
                <Animated.View style={[styles.dot, dot2Style]} />
                <Animated.View style={[styles.dot, dot3Style]} />
            </View>
        </Animated.View>
    );
};
