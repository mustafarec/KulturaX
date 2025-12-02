export const theme = {
    colors: {
        primary: '#14B8A6', // Teal (Deniz Yeşili)
        secondary: '#0EA5E9', // Sky Blue (Gökyüzü Mavisi)
        accent: '#10B981', // Emerald (Zümrüt Yeşili)
        background: '#F0F3F8', // Very light cool gray/blue
        surface: '#FFFFFF',
        text: '#2D3436',
        textSecondary: '#636E72',
        border: 'rgba(255, 255, 255, 0.5)', // Glass border
        error: '#EF4444', // Red
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Amber

        // Liquid Glass Specifics
        glass: 'rgba(255, 255, 255, 0.75)', // Main glass background
        glassBorder: 'rgba(255, 255, 255, 0.8)', // Highlight border
        glassShadow: 'rgba(20, 184, 166, 0.15)', // Teal shadow

        // Gradients (for reference/usage in styles)
        gradientStart: '#14B8A6', // Teal
        gradientEnd: '#0EA5E9', // Sky Blue
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
        h1: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
        h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
        h3: { fontSize: 20, fontWeight: '600' },
        body: { fontSize: 16, lineHeight: 24 },
        caption: { fontSize: 12, color: '#636E72' },
    }
} as const;
