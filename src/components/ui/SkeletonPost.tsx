import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const SkeletonPost = () => {
    const { theme } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacity]);

    const bgStyle = {
        backgroundColor: theme.colors.border,
        opacity: opacity
    };

    return (
        <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.header}>
                {/* Avatar Skeleton */}
                <Animated.View style={[styles.avatar, bgStyle]} />

                <View style={styles.content}>
                    {/* Name & Username Skeleton */}
                    <View style={styles.row}>
                        <Animated.View style={[styles.name, bgStyle]} />
                        <Animated.View style={[styles.username, bgStyle]} />
                    </View>

                    {/* Content Lines */}
                    <Animated.View style={[styles.line, { width: '90%' }, bgStyle]} />
                    <Animated.View style={[styles.line, { width: '70%' }, bgStyle]} />
                    <Animated.View style={[styles.line, { width: '40%' }, bgStyle]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderBottomWidth: 1,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        width: 100,
        height: 14,
        borderRadius: 4,
        marginRight: 8,
    },
    username: {
        width: 60,
        height: 12,
        borderRadius: 4,
    },
    line: {
        height: 12,
        marginBottom: 6,
        borderRadius: 4,
    },
});
