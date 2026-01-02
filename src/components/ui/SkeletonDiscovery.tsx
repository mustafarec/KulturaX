import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export const SkeletonDiscovery = () => {
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

    const renderHorizontalList = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.cardContainer}>
                    <Animated.View style={[styles.cardImage, bgStyle]} />
                    <Animated.View style={[styles.cardTitle, bgStyle]} />
                    <Animated.View style={[styles.cardSubtitle, bgStyle]} />
                </View>
            ))}
        </ScrollView>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Trend Topics Skeleton */}
            <View style={styles.sectionHeader}>
                <Animated.View style={[styles.sectionTitle, bgStyle]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                {[1, 2, 3].map((item) => (
                    <Animated.View key={item} style={[styles.topicCard, bgStyle]} />
                ))}
            </ScrollView>

            {/* Sections */}
            <View style={styles.sectionHeader}>
                <Animated.View style={[styles.sectionTitle, bgStyle]} />
                <Animated.View style={[styles.viewAll, bgStyle]} />
            </View>
            {renderHorizontalList()}

            <View style={styles.sectionHeader}>
                <Animated.View style={[styles.sectionTitle, bgStyle]} />
                <Animated.View style={[styles.viewAll, bgStyle]} />
            </View>
            {renderHorizontalList()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
    },
    sectionHeader: { // Mimics SectionHeader
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 10,
    },
    sectionTitle: {
        width: 120,
        height: 20,
        borderRadius: 4,
    },
    viewAll: {
        width: 40,
        height: 14,
        borderRadius: 4,
    },
    horizontalList: {
        paddingLeft: 20,
        marginBottom: 10,
    },
    topicCard: {
        width: 140,
        height: 60,
        borderRadius: 16,
        marginRight: 12,
    },
    cardContainer: {
        marginRight: 12,
        width: 120,
    },
    cardImage: {
        width: 120,
        height: 180,
        borderRadius: 12,
        marginBottom: 8,
    },
    cardTitle: {
        width: '90%',
        height: 14,
        borderRadius: 4,
        marginBottom: 4,
    },
    cardSubtitle: {
        width: '60%',
        height: 12,
        borderRadius: 4,
    }
});
