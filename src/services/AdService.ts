/**
 * AdService - Google Mobile Ads yönetim servisi
 * 
 * Banner reklam entegrasyonu için merkezi servis.
 * Test ve production Ad Unit ID'lerini yönetir.
 */

import { Platform } from 'react-native';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

// Test Ad Unit IDs (Google tarafından sağlanan)
// Production'a geçmeden önce gerçek ID'lerle değiştirilmeli
const TEST_AD_UNITS = {
    android: {
        banner: 'ca-app-pub-3940256099942544/6300978111',
    },
    ios: {
        banner: 'ca-app-pub-3940256099942544/2934735716',
    },
};

// Production Ad Unit IDs
const PRODUCTION_AD_UNITS = {
    android: {
        banner: 'ca-app-pub-5897178396326522/9516424523', // KültüraX Feed Banner
    },
    ios: {
        banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ', // TODO: iOS Banner ID
    },
};

// Development modunda test ID'leri kullan
const IS_DEVELOPMENT = __DEV__;

// GEÇİCİ: Production'da da test reklamları kullan
// AdMob uygulama incelemesi tamamlandıktan sonra false yapın
const USE_TEST_ADS_IN_PRODUCTION = true;

/**
 * Platform ve environment'a göre doğru Ad Unit ID'yi döndürür
 */
export const getAdUnitId = (type: 'banner'): string => {
    // Test reklamları kullan: development modunda veya flag açıksa
    const useTestAds = IS_DEVELOPMENT || USE_TEST_ADS_IN_PRODUCTION;
    const adUnits = useTestAds ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;
    const platformAds = Platform.OS === 'ios' ? adUnits.ios : adUnits.android;
    return platformAds[type];
};

/**
 * Mobile Ads SDK'yı başlat
 * App.tsx içinde uygulama başlangıcında çağrılmalı
 */
export const initializeAds = async (): Promise<void> => {
    try {
        // Reklam içerik ayarları
        await mobileAds().setRequestConfiguration({
            // Maksimum reklam içerik derecelendirmesi
            maxAdContentRating: MaxAdContentRating.PG,
            // Çocuklara yönelik içerik kontrolü (COPPA)
            tagForChildDirectedTreatment: false,
            // Rıza yaşı altındaki kullanıcılar için etiketleme
            tagForUnderAgeOfConsent: false,
        });

        // SDK'yı başlat
        await mobileAds().initialize();

        if (IS_DEVELOPMENT) {
            console.log('[AdService] Mobile Ads SDK initialized (Development Mode)');
        }
    } catch (error) {
        console.error('[AdService] Failed to initialize Mobile Ads SDK:', error);
    }
};

/**
 * Feed'de reklamın gösterilmesi gereken pozisyonları hesaplar
 * Her N postta bir reklam gösterilir
 */
export const shouldShowAdAtIndex = (index: number, interval: number = 5): boolean => {
    // İlk postta reklam gösterme, sonra her `interval` postta bir göster
    return index > 0 && index % interval === 0;
};

export default {
    getAdUnitId,
    initializeAds,
    shouldShowAdAtIndex,
};
