/**
 * NativeAdComment - Yorum bölümünde gösterilecek sponsorlu reklam bileşeni
 * 
 * Yorum görünümünde banner reklam gösterir.
 * Premium kullanıcılarda otomatik olarak gizlenir.
 */

import React, { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAdUnitId } from '../../services/AdService';

interface NativeAdCommentProps {
    /** Container için özel stil */
    style?: object;
}

/**
 * Yorum tarzında sponsorlu reklam bileşeni
 * Premium kullanıcılarda gösterilmez
 */
export const NativeAdComment: React.FC<NativeAdCommentProps> = memo(({ style }) => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Premium kullanıcılarda reklam gösterme
    if (user?.is_premium) {
        return null;
    }

    // Reklam yüklenemediyse gizle
    if (hasError) {
        if (__DEV__) {
            console.log('[NativeAdComment] Ad failed to load, hiding component');
        }
        return null;
    }

    const adUnitId = getAdUnitId('banner');

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
            {/* Sponsorlu Etiketi */}
            <View style={styles.sponsoredHeader}>
                <View style={[styles.sponsoredBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.sponsoredText, { color: theme.colors.primary }]}>Sponsorlu</Text>
                </View>
            </View>

            {/* Banner Reklam */}
            <View style={[styles.adWrapper, !isLoaded && styles.loading]}>
                <BannerAd
                    unitId={adUnitId}
                    size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true,
                    }}
                    onAdLoaded={() => {
                        setIsLoaded(true);
                    }}
                    onAdFailedToLoad={(error) => {
                        if (__DEV__) {
                            console.error('[NativeAdComment] Ad failed to load:', error);
                        }
                        setHasError(true);
                    }}
                />
            </View>
        </View>
    );
});

NativeAdComment.displayName = 'NativeAdComment';

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 12,
    },
    sponsoredHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sponsoredBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sponsoredText: {
        fontSize: 11,
        fontWeight: '600',
    },
    adWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    loading: {
        minHeight: 250,
    },
});

export default NativeAdComment;
