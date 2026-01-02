import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 16,
    borderRadius = 8,
    style
}) => {
    const { theme } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: theme.colors.border,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Preset skeleton components
export const SkeletonText: React.FC<{ lines?: number; style?: ViewStyle }> = ({ lines = 1, style }) => (
    <View style={style}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                height={14}
                width={i === lines - 1 ? '60%' : '100%'}
                style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
            />
        ))}
    </View>
);

export const SkeletonCircle: React.FC<{ size?: number; style?: ViewStyle }> = ({ size = 48, style }) => (
    <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />
);

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const { theme } = useTheme();
    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, style]}>
            <View style={styles.cardHeader}>
                <SkeletonCircle size={40} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width={120} height={14} />
                    <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
                </View>
            </View>
            <SkeletonText lines={3} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={180} borderRadius={12} style={{ marginTop: 12 }} />
        </View>
    );
};

// Feed screen skeleton
export const FeedSkeleton: React.FC = () => (
    <View style={styles.container}>
        <SkeletonCard />
        <SkeletonCard style={{ marginTop: 16 }} />
        <SkeletonCard style={{ marginTop: 16 }} />
    </View>
);

// Profile screen skeleton
export const ProfileSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.profileHeader, { backgroundColor: theme.colors.surface }]}>
                <SkeletonCircle size={80} />
                <Skeleton width={150} height={20} style={{ marginTop: 12 }} />
                <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
            </View>
            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Skeleton width={40} height={24} />
                    <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
                </View>
                <View style={styles.statItem}>
                    <Skeleton width={40} height={24} />
                    <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
                </View>
                <View style={styles.statItem}>
                    <Skeleton width={40} height={24} />
                    <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
                </View>
            </View>
            {/* Posts */}
            <SkeletonCard style={{ marginTop: 16 }} />
            <SkeletonCard style={{ marginTop: 16 }} />
        </View>
    );
};

// Message list skeleton
export const MessageSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={styles.container}>
            {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[styles.messageItem, { backgroundColor: theme.colors.surface }]}>
                    <SkeletonCircle size={50} />
                    <View style={styles.messageContent}>
                        <Skeleton width={120} height={16} />
                        <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    messageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    messageContent: {
        marginLeft: 12,
        flex: 1,
    },
});
