import React, { useState, memo } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
    uri: string;
    fallback?: React.ReactNode;
    showLoader?: boolean;
}

const CachedImageComponent: React.FC<CachedImageProps> = ({
    uri,
    style,
    fallback,
    showLoader = true,
    ...props
}) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (error && fallback) {
        return <>{fallback}</>;
    }

    return (
        <View style={style}>
            <Image
                {...props}
                source={{ uri, cache: 'force-cache' }}
                style={[StyleSheet.absoluteFill, style]}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setError(true);
                    setLoading(false);
                }}
                resizeMode={props.resizeMode || 'cover'}
            />
            {loading && showLoader && (
                <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
            )}
        </View>
    );
};

export const CachedImage = memo(CachedImageComponent);

const styles = StyleSheet.create({
    loaderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
});
