import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'flat' | 'glass';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 'md',
}) => {
    const { theme } = useTheme();

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return 8;
            case 'md': return 16;
            case 'lg': return 24;
            default: return 16;
        }
    };

    const styles = useMemo(() => {
        const getVariantStyles = () => {
            switch (variant) {
                case 'flat':
                    return {
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    };
                case 'glass':
                    return {
                        backgroundColor: theme.colors.glass,
                        borderColor: theme.colors.glassBorder,
                        borderWidth: 1,
                        ...theme.shadows.glass,
                    };
                default:
                    return {
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        ...theme.shadows.default,
                    };
            }
        };

        return StyleSheet.create({
            container: {
                borderRadius: theme.borderRadius.l,
                overflow: 'hidden',
                padding: getPadding(),
                ...getVariantStyles(),
            }
        });
    }, [theme, variant, padding]);

    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    );
};
