import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';

export const BookLoader = () => {
    const { theme } = useTheme();

    /**
     * KeyPaths identified from book_loader.json:
     * - Cover (Blue parts):
     *    - 'cover.Group 1.Fill 1'
     *    - 'cover.Group 2.Fill 1'
     *    - 'cover.Group 1.Stroke 1' (Outline)
     * - Pages (White/Grey):
     *    - 'flip page.Group 4.Fill 1'
     *    - 'page left.Group 4.Fill 1'
     *    - 'page right.Group 4.Fill 1'
     *    - 'flip page.Group 4.Stroke 1' (Outline)
     */

    // We want to dynamically color the book cover based on the theme (Primary Color).
    // The pages should remain a realistic paper color (Cream/White), or adapt slightly to dark mode (Light Grey).

    const pageColor = theme.dark ? '#F5F5F5' : '#FEFBF5'; // Slightly dimmer in dark mode
    const coverColor = theme.colors.primary; // Brown/Theme color
    const strokeColor = theme.colors.text; // Text color for outlines (Black/White)

    const colorFilters = [
        // --- COVER ---
        {
            keypath: 'cover.Group 1.Fill 1',
            color: coverColor,
        },
        {
            keypath: 'cover.Group 2.Fill 1',
            color: coverColor,
        },

        // --- PAGES ---
        {
            keypath: 'flip page.Group 4.Fill 1',
            color: pageColor,
        },
        {
            keypath: 'page left.Group 4.Fill 1',
            color: pageColor,
        },
        {
            keypath: 'page right.Group 4.Fill 1',
            color: pageColor,
        },

        // --- STROKES (Optional: Coloring outlines) ---
        // If we want the drawing look, we can color strokes.
        // Assuming original strokes were dark grey/black.
        {
            keypath: 'cover.Group 1.Stroke 1',
            color: strokeColor,
        },
        {
            keypath: 'cover.Group 2.Stroke 1',
            color: strokeColor,
        },
        {
            keypath: 'flip page.Group 4.Stroke 1',
            color: strokeColor,
        },
        {
            keypath: 'page left.Group 4.Stroke 1',
            color: strokeColor,
        },
        {
            keypath: 'page right.Group 4.Stroke 1',
            color: strokeColor,
        },
    ];

    return (
        <View style={styles.container}>
            <LottieView
                source={require('../assets/animations/book_loader.json')}
                autoPlay
                loop
                style={styles.lottie}
                colorFilters={colorFilters}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // Container size
        width: 150,
        height: 150,
    },
    lottie: {
        width: 150,
        height: 150,
    },
});
