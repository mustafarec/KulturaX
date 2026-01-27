
import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';
import { ensureHttps } from '../../utils/urlUtils';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | number;

interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    fallback,
    size = 'md',
    style,
}) => {
    const [imageError, setImageError] = useState(false);

    const getSize = (): number => {
        if (typeof size === 'number') return size;
        switch (size) {
            case 'sm': return 32;
            case 'md': return 40;
            case 'lg': return 56;
            case 'xl': return 80;
            default: return 40;
        }
    };

    const dimension = getSize();
    const borderRadius = dimension / 2;

    const styles = StyleSheet.create({
        container: {
            width: dimension,
            height: dimension,
            borderRadius: borderRadius,
            overflow: 'hidden',
            backgroundColor: theme.colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        fallbackText: {
            fontSize: dimension * 0.4,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main as string,
        }
    });

    const getFallbackInitials = () => {
        if (fallback) return fallback;
        if (alt) return alt.substring(0, 2).toUpperCase();
        return '?';
    };

    return (
        <View style={[styles.container, style]}>
            {src && !imageError ? (
                <Image
                    source={{ uri: ensureHttps(src) }}
                    style={styles.image}
                    onError={() => setImageError(true)}
                    resizeMode="cover"
                />
            ) : (
                <Text style={styles.fallbackText}>
                    {getFallbackInitials()}
                </Text>
            )}
        </View>
    );
};
