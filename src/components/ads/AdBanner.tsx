/**
 * AdBanner - Feed ve diğer ekranlarda gösterilecek banner reklam bileşeni
 * 
 * Premium kullanıcılarda otomatik olarak gizlenir.
 * Adaptive banner kullanarak ekran genişliğine uyum sağlar.
 */

import React, { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAdUnitId } from '../../services/AdService';

interface AdBannerProps {
    /** Banner boyutu - varsayılan olarak adaptive banner kullanılır */
    size?: BannerAdSize;
    /** Container için özel stil */
    style?: object;
}

/**
 * Banner reklam bileşeni
 * Premium kullanıcılarda gösterilmez
 */
export const AdBanner: React.FC<AdBannerProps> = memo(({
    size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
    style
}) => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Premium kullanıcılarda reklam gösterme
    if (user?.is_premium) {
        return null;
    }

    // Reklam yüklenemediyse boş alan gösterme
    if (hasError) {
        return null;
    }

    const adUnitId = getAdUnitId('banner');

    return (
        <View style={[
            styles.container,
            { backgroundColor: theme.colors.surface },
            !isLoaded && styles.loading,
            style
        ]}>
            <BannerAd
                unitId={adUnitId}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    setIsLoaded(true);
                }}
                onAdFailedToLoad={(error) => {
                    setHasError(true);
                    if (__DEV__) {
                        console.log('[AdBanner] Ad failed to load:', error.message);
                    }
                }}
            />
        </View>
    );
});

AdBanner.displayName = 'AdBanner';

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 16,
        paddingVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    loading: {
        minHeight: 50, // Banner minimum yüksekliği
    },
});

export default AdBanner;
