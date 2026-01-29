/**
 * Update Service - KültüraX
 * 
 * Uygulama güncelleme kontrolü:
 * - OTA (Over-The-Air) güncellemeler için Expo Updates
 * - Native güncellemeler için backend versiyon kontrolü
 */

import { Platform, Linking } from 'react-native';
import * as Updates from 'expo-updates';
import { getVersionInfo, VersionInfo } from './api/versionApi';
import { version as appVersion } from '../../package.json';

// =============================================================================
// Types
// =============================================================================

export interface UpdateCheckResult {
    hasOTAUpdate: boolean;
    hasNativeUpdate: boolean;
    isForceUpdate: boolean;
    latestVersion?: string;
    releaseNotes?: string;
    updateUrl?: string;
}

// =============================================================================
// Version Comparison
// =============================================================================

/**
 * Semantik versiyon karşılaştırması
 * @returns -1 (v1 < v2), 0 (v1 == v2), 1 (v1 > v2)
 */
const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 < num2) return -1;
        if (num1 > num2) return 1;
    }

    return 0;
};

// =============================================================================
// OTA Update Functions
// =============================================================================

/**
 * Expo Updates ile OTA güncelleme kontrolü
 */
export const checkForOTAUpdate = async (): Promise<boolean> => {
    // Development modunda Updates çalışmaz
    if (__DEV__) {
        console.log('UpdateService: DEV mode, skipping OTA check');
        return false;
    }

    try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
            console.log('OTA Update found!');
            return true;
        }
        console.log('No OTA Update available for this build.');
        return false;
    } catch (error: any) {
        console.warn('OTA update check failed:', error);
        // Alert on production to see error
        if (!__DEV__) {
            // Alert.alert('OTA Error', error.message || 'Check failed');
        }
        return false;
    }
};

/**
 * OTA güncellemeyi indir ve uygula
 */
export const applyOTAUpdate = async (): Promise<void> => {
    if (__DEV__) {
        console.log('UpdateService: DEV mode, cannot apply OTA update');
        return;
    }

    try {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
    } catch (error) {
        console.error('OTA update failed:', error);
        throw error;
    }
};

// =============================================================================
// Native Update Functions
// =============================================================================

/**
 * Backend'den native güncelleme kontrolü
 */
export const checkForNativeUpdate = async (): Promise<{
    hasUpdate: boolean;
    isForceUpdate: boolean;
    versionInfo: VersionInfo;
}> => {
    try {
        const versionInfo = await getVersionInfo();
        const currentVersion = appVersion;

        // Mevcut versiyon minimum versiyondan düşükse zorunlu güncelleme
        const isForceUpdate = compareVersions(currentVersion, versionInfo.minimum_version) < 0;

        // Mevcut versiyon son versiyondan düşükse güncelleme var
        const hasUpdate = compareVersions(currentVersion, versionInfo.latest_version) < 0;

        return {
            hasUpdate,
            isForceUpdate,
            versionInfo,
        };
    } catch (error) {
        console.warn('Native update check failed:', error);
        return {
            hasUpdate: false,
            isForceUpdate: false,
            versionInfo: {
                latest_version: '0.0.0',
                minimum_version: '0.0.0',
                update_url: '',
            },
        };
    }
};

/**
 * Store'a yönlendir
 */
export const openStore = async (updateUrl?: string): Promise<void> => {
    const storeUrl = updateUrl || (
        Platform.OS === 'android'
            ? 'https://play.google.com/store/apps/details?id=com.anonymous.kitapmuzikfilm'
            : 'https://apps.apple.com/app/idXXXXXXXXX' // iOS App Store ID'yi güncelleyin
    );

    try {
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
            await Linking.openURL(storeUrl);
        }
    } catch (error) {
        console.error('Could not open store:', error);
    }
};

// =============================================================================
// Combined Update Check
// =============================================================================

/**
 * Hem OTA hem de native güncelleme kontrolü
 */
export const checkForUpdates = async (): Promise<UpdateCheckResult> => {
    // Paralel olarak her iki kontrolü de yap
    const [hasOTAUpdate, nativeResult] = await Promise.all([
        checkForOTAUpdate(),
        checkForNativeUpdate(),
    ]);

    return {
        hasOTAUpdate,
        hasNativeUpdate: nativeResult.hasUpdate,
        isForceUpdate: nativeResult.isForceUpdate,
        latestVersion: nativeResult.versionInfo.latest_version,
        releaseNotes: nativeResult.versionInfo.release_notes,
        updateUrl: nativeResult.versionInfo.update_url,
    };
};
