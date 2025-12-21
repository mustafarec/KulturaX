
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { theme } from '../../theme/theme';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'default',
    size = 'default',
    children,
    onPress,
    disabled = false,
    loading = false,
    style,
    textStyle,
    leftIcon,
    rightIcon,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return theme.colors.muted;
        switch (variant) {
            case 'default': return theme.colors.primary;
            case 'destructive': return theme.colors.error;
            case 'outline': return 'transparent';
            case 'secondary': return theme.colors.secondary;
            case 'ghost': return 'transparent';
            case 'link': return 'transparent';
            default: return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.textSecondary;
        switch (variant) {
            case 'default': return theme.colors.surface; // Text on primary is surface/white
            case 'destructive': return '#FFFFFF';
            case 'outline': return theme.colors.text;
            case 'secondary': return theme.colors.surface;
            case 'ghost': return theme.colors.text;
            case 'link': return theme.colors.primary;
            default: return theme.colors.surface;
        }
    };

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.borderRadius.m,
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: variant === 'outline' ? theme.colors.border : 'transparent',
            backgroundColor: getBackgroundColor(),
            paddingHorizontal: size === 'default' ? 16 : size === 'sm' ? 12 : size === 'lg' ? 24 : 0,
            paddingVertical: size === 'default' ? 10 : size === 'sm' ? 8 : size === 'lg' ? 14 : 0,
            width: size === 'icon' ? 40 : undefined,
            height: size === 'icon' ? 40 : undefined,
            opacity: disabled ? 0.6 : 1,
        },
        text: {
            fontSize: size === 'sm' ? 14 : 16,
            fontWeight: '600',
            color: getTextColor(),
            textDecorationLine: variant === 'link' ? 'underline' : 'none',
            fontFamily: theme.fonts.main as string,
        },
        iconSpace: {
            width: 8,
        }
    });

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.container, style]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
                    {size !== 'icon' && (
                        <Text style={[styles.text, textStyle]}>
                            {children}
                        </Text>
                    )}
                    {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
                    {/* Render children directly if it's an icon button (usually passed as children) */}
                    {size === 'icon' && children}
                </>
            )}
        </TouchableOpacity>
    );
};
