import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as defaultTheme, lightTheme, darkTheme, dimTheme, blackTheme, Theme } from '../theme/theme';

type ThemeMode = 'light' | 'dark' | 'auto';
type DarkThemeStyle = 'dim' | 'black';

interface ThemeContextType {
    theme: Theme;
    themeMode: ThemeMode;
    darkThemeStyle: DarkThemeStyle;
    setThemeMode: (mode: ThemeMode) => void;
    setDarkThemeStyle: (style: DarkThemeStyle) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: defaultTheme,
    themeMode: 'light',
    darkThemeStyle: 'dim',
    setThemeMode: () => { },
    setDarkThemeStyle: () => { },
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();

    // Initialize with system preference to avoid flash
    const initialScheme = Appearance.getColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>(initialScheme === 'dark' ? 'dark' : 'light');
    const [darkThemeStyle, setDarkThemeStyle] = useState<DarkThemeStyle>('dim');

    const getInitialTheme = () => {
        if (initialScheme === 'dark') {
            return dimTheme; // Default to dim if dark
        }
        return lightTheme;
    };

    const [theme, setTheme] = useState<Theme>(getInitialTheme());

    useEffect(() => {
        loadThemePreferences();
    }, []);

    useEffect(() => {
        updateTheme(themeMode, darkThemeStyle, systemColorScheme);
    }, [themeMode, darkThemeStyle, systemColorScheme]);

    const loadThemePreferences = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('themeMode');
            const savedStyle = await AsyncStorage.getItem('darkThemeStyle');

            if (savedMode) setThemeMode(savedMode as ThemeMode);
            if (savedStyle) setDarkThemeStyle(savedStyle as DarkThemeStyle);
        } catch (error) {
            console.error('Failed to load theme preferences:', error);
        }
    };

    const updateTheme = (mode: ThemeMode, style: DarkThemeStyle, systemScheme: ColorSchemeName) => {
        let activeTheme = lightTheme;

        if (mode === 'dark') {
            activeTheme = style === 'dim' ? dimTheme : blackTheme;
        } else if (mode === 'auto') {
            if (systemScheme === 'dark') {
                activeTheme = style === 'dim' ? dimTheme : blackTheme;
            } else {
                activeTheme = lightTheme;
            }
        }

        setTheme(activeTheme);
    };

    const handleSetThemeMode = async (mode: ThemeMode) => {
        setThemeMode(mode);
        try {
            await AsyncStorage.setItem('themeMode', mode);
        } catch (error) {
            console.error('Failed to save theme mode:', error);
        }
    };

    const handleSetDarkThemeStyle = async (style: DarkThemeStyle) => {
        setDarkThemeStyle(style);
        try {
            await AsyncStorage.setItem('darkThemeStyle', style);
        } catch (error) {
            console.error('Failed to save dark theme style:', error);
        }
    };

    const toggleTheme = () => {
        const nextMode = themeMode === 'light' ? 'dark' : (themeMode === 'dark' ? 'auto' : 'light');
        handleSetThemeMode(nextMode);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            themeMode,
            darkThemeStyle,
            setThemeMode: handleSetThemeMode,
            setDarkThemeStyle: handleSetDarkThemeStyle,
            toggleTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
