export const lightTheme = {
    colors: {
        primary: '#14B8A6', // Teal
        secondary: '#0EA5E9', // Sky Blue
        accent: '#10B981', // Emerald
        background: '#F0F3F8', // Very light cool gray/blue
        surface: '#FFFFFF',
        text: '#2D3436',
        textSecondary: '#636E72',
        border: 'rgba(255, 255, 255, 0.5)',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        glass: 'rgba(255, 255, 255, 0.75)',
        glassBorder: 'rgba(255, 255, 255, 0.8)',
        glassShadow: 'rgba(20, 184, 166, 0.15)',
        gradientStart: '#14B8A6',
        gradientEnd: '#0EA5E9',
        icon: '#2D3436',
    },
    spacing: {
        xs: 4, s: 8, m: 16, l: 24, xl: 32, liquid: 20,
    },
    borderRadius: {
        s: 8, m: 16, l: 24, xl: 32, liquid: 30, pill: 100,
    },
    shadows: {
        default: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        soft: {
            shadowColor: "#14B8A6",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
        },
        glass: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 5,
        }
    },
    typography: {
        h1: { fontSize: 32, fontWeight: '800', letterSpacing: -1 } as const,
        h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 } as const,
        h3: { fontSize: 20, fontWeight: '600' } as const,
        body: { fontSize: 16, lineHeight: 24 } as const,
        caption: { fontSize: 12, color: '#636E72' } as const,
    },
    dark: false,
};

// Dim Theme (Dark Gray - Previous Dark Mode)
export const dimTheme = {
    ...lightTheme,
    colors: {
        ...lightTheme.colors,
        background: '#15202B', // Twitter Dim
        surface: '#192734',
        text: '#FFFFFF',
        textSecondary: '#8899A6',
        border: '#38444D',
        glass: 'rgba(21, 32, 43, 0.85)',
        glassBorder: '#38444D',
        glassShadow: 'rgba(0, 0, 0, 0.3)',
        icon: '#FFFFFF',
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
    colors: {
        ...lightTheme.colors,
        background: '#000000', // True Black
        surface: '#000000', // True Black for seamless look
        text: '#E7E9EA', // High contrast white-ish gray
        textSecondary: '#71767B', // Twitter/X Dim Gray
        border: '#2F3336', // Dark gray border
        glass: 'rgba(0, 0, 0, 0.85)',
        glassBorder: '#2F3336',
        glassShadow: 'rgba(255, 255, 255, 0.05)',
        icon: '#E7E9EA',
        primary: '#1D9BF0', // Keeping X Blue-ish for consistency in dark mode if desired, or revert to Teal.
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
export const darkTheme = blackTheme;
export const theme = lightTheme;

export type Theme = typeof lightTheme;
