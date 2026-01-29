import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react-native';

/**
 * KültüraX - Theme Toggle Component
 * Standards: ThemeContext, Themed Colors, Lucide Icons
 */
const ThemeToggleTest = () => {
    const { theme, toggleTheme, themeMode } = useTheme();
    const { colors } = theme;

    const getIcon = () => {
        if (theme.id === 'light') return <Sun color={colors.primary} size={24} />;
        if (theme.id === 'dim') return <Monitor color={colors.primary} size={24} />;
        if (theme.id === 'black') return <Moon color={colors.primary} size={24} />;
        return <Sun color={colors.primary} size={24} />;
    };

    return (
        <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
            <View style={styles.iconWrapper}>
                {getIcon()}
            </View>
            <Text style={[styles.text, { color: colors.text }]}>
                Tema Modu: {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} ({theme.id})
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        margin: 8,
    },
    iconWrapper: {
        marginRight: 12,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ThemeToggleTest;
