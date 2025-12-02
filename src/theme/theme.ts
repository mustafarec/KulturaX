export const theme = {
    colors: {
        primary: '#6C5CE7', // Soft Purple (Liquid main)
        secondary: '#A8A4E6', // Light Purple
        background: '#F0F3F8', // Very light cool gray/blue
        surface: '#FFFFFF',
        text: '#2D3436',
        textSecondary: '#636E72',
        border: 'rgba(255, 255, 255, 0.5)', // Glass border
        error: '#FF7675',
        success: '#55EFC4',
        warning: '#FFEAA7',

        // Liquid Glass Specifics
        glass: 'rgba(255, 255, 255, 0.75)', // Main glass background
        glassBorder: 'rgba(255, 255, 255, 0.8)', // Highlight border
        glassShadow: 'rgba(108, 92, 231, 0.15)', // Colored shadow

        // Gradients (for reference/usage in styles)
        gradientStart: '#a8c0ff',
        gradientEnd: '#3f2b96',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        liquid: 20, // Common liquid padding
    },
    borderRadius: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        liquid: 30, // Super rounded for liquid feel
        pill: 100,
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
            shadowColor: "#6C5CE7",
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
        h1: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
        h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
        h3: { fontSize: 20, fontWeight: '600' },
        body: { fontSize: 16, lineHeight: 24 },
        caption: { fontSize: 12, color: '#636E72' },
    }
} as const;
