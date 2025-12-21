
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    style,
    textStyle,
}) => {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'default': return theme.colors.primary;
            case 'secondary': return theme.colors.secondary;
            case 'destructive': return theme.colors.error;
            case 'outline': return 'transparent';
            default: return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'default': return theme.colors.surface;
            case 'secondary': return theme.colors.surface;
            case 'destructive': return '#FFFFFF';
            case 'outline': return theme.colors.text;
            default: return theme.colors.surface;
        }
    };

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 4,
            width: 'auto',
            borderRadius: 12, // Pill shape
            backgroundColor: getBackgroundColor(),
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: variant === 'outline' ? theme.colors.border : 'transparent',
            alignSelf: 'flex-start',
        },
        text: {
            fontSize: 12,
            fontWeight: '600',
            color: getTextColor(),
            fontFamily: theme.fonts.main as string,
        }
    });

    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.text, textStyle]}>
                {children}
            </Text>
        </View>
    );
};
