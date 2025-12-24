import { View, StyleSheet, Text, Image, Platform } from 'react-native';

export const lightTheme = {
    fonts: {
        main: Platform.select({ ios: 'Roboto-Regular', android: 'Roboto-Regular' }),
        quote: Platform.select({ ios: 'NotoSerifGeorgian-Regular', android: 'NotoSerifGeorgian-Regular' }),
        headings: Platform.select({ ios: 'PlayfairDisplay-Bold', android: 'PlayfairDisplay-Bold' }),
    },
    id: 'light', // Unique identifier
    colors: {
        primary: '#3D2817', // --primary
        secondary: '#8B7355', // --secondary
        accent: '#A08968', // --accent
        background: '#FAF8F5', // --background
        surface: '#FFFFFF', // --card
        text: '#3D2817', // --foreground
        textSecondary: '#6B5D4F', // --muted-foreground
        border: 'rgba(61, 40, 23, 0.1)', // --border
        error: '#d4183d', // --destructive
        success: '#10B981',
        warning: '#F59E0B',
        glass: 'rgba(255, 255, 255, 0.75)',
        glassBorder: 'rgba(248, 232, 232, 0.8)',
        glassShadow: 'rgba(184, 120, 56, 0.15)',
        gradientStart: '#3D2817',
        gradientEnd: '#3D2817',
        icon: '#3D2817',
        inputBackground: '#F3F1ED', // --input-background
        muted: '#E8E4DD', // --muted
    },
    spacing: {
        xs: 4, s: 8, m: 16, l: 24, xl: 32, liquid: 20,
    },
    borderRadius: {
        s: 8, m: 16, l: 24, xl: 32, liquid: 30, pill: 100,
    },
    shadows: {
        default: {
            shadowColor: "#3D2817",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        soft: {
            shadowColor: "#3D2817",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 5,
        },
        glass: {
            shadowColor: "#3D2817",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 5,
        }
    },
    typography: {
        h1: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5, fontFamily: 'PlayfairDisplay-Bold' } as const,
        h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, fontFamily: 'PlayfairDisplay-Bold' } as const,
        h3: { fontSize: 17, fontWeight: '600', fontFamily: 'PlayfairDisplay-Bold' } as const,
        body: { fontSize: 15, lineHeight: 20, fontFamily: 'Roboto-Regular' } as const,
        bodyLarge: { fontSize: 17, lineHeight: 22, fontFamily: 'Roboto-Regular' } as const,
        caption: { fontSize: 13, color: '#6B5D4F', fontFamily: 'Roboto-Regular' } as const,
        small: { fontSize: 12, lineHeight: 16, fontFamily: 'Roboto-Regular' } as const,
    },
    dark: false,
};

// Dim Theme (Dark Gray - Previous Dark Mode)
export const dimTheme = {
    ...lightTheme,
    id: 'dim', // Unique identifier
    colors: {
        ...lightTheme.colors,
        background: '#1C1917', // Stone 900
        surface: '#292524', // Stone 800 - From CSS
        text: '#E7E5E4', // Stone 200 - From CSS
        textSecondary: '#A8A29E', // Stone 400
        border: '#44403C', // Stone 700 - From CSS
        glass: 'rgba(28, 25, 23, 0.85)', // Adapted from background
        glassBorder: '#44403C',
        glassShadow: 'rgba(0, 0, 0, 0.3)',
        icon: '#E7E5E4',
        primary: '#EA9A65',
        secondary: '#44403C', // Stone 700 - From CSS
        accent: '#44403C', // Stone 700 - From CSS
        gradientStart: '#EA9A65',
        gradientEnd: '#EA9A65',
        muted: '#44403C', // Stone 700 - From CSS
        inputBackground: '#44403C', // Stone 700 - From CSS
    },
    shadows: {
        ...lightTheme.shadows,
        default: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 1,
        },
        soft: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 0,
            elevation: 0,
        },
    },
    dark: true,
};

// Lights Out Theme (True Black - Current Dark Mode)
export const blackTheme = {
    ...lightTheme,
    id: 'black', // Unique identifier
    colors: {
        ...lightTheme.colors,
        background: '#000000', // True Black
        surface: '#000000', // True Black for seamless look
        text: '#E7E5E4', // Cream/Off-White (Old Typewriter aesthetic as requested)
        textSecondary: '#C2B2A2', // Warm Titanium / Bronze Gray (User Request)
        border: '#2A2420', // Dark Earthy Brown (User Request)
        glass: 'rgba(0, 0, 0, 0.85)',
        glassBorder: '#2F3336',
        glassShadow: 'rgba(255, 255, 255, 0.05)',
        icon: '#C2B2A2', // Warm Titanium / Bronze Gray
        primary: '#EA9A65', // Matching Dim Theme
        secondary: '#EA9A65',
        accent: '#EA9A65',
        gradientStart: '#EA9A65',
        gradientEnd: '#EA9A65',
        muted: '#1C1917', // Darker background for muted cards in black mode
        inputBackground: '#1C1917', // Consistent with muted
    },
    shadows: {
        ...lightTheme.shadows,
        default: {
            shadowColor: "#FFF",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1,
        },
        soft: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
        },
    },
    dark: true,
};

// Default export for backward compatibility (will be managed by context)
export const darkTheme = dimTheme;
export const theme = lightTheme;

export type Theme = typeof lightTheme;
