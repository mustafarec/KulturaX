/**
 * Secure Storage Service
 * 
 * iOS: Uses Keychain
 * Android: Uses EncryptedSharedPreferences (Keystore backed)
 * 
 * This provides encrypted storage for sensitive data like tokens and user info.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys for secure storage
export const SECURE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    FCM_TOKEN: 'fcm_token',
} as const;

// Options for SecureStore
const secureStoreOptions: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Check if SecureStore is available on current platform
 */
const isSecureStoreAvailable = async (): Promise<boolean> => {
    try {
        // SecureStore is available on iOS and Android
        if (Platform.OS === 'web') {
            return false;
        }
        // Try a test operation
        await SecureStore.getItemAsync('__test__');
        return true;
    } catch {
        return false;
    }
};

/**
 * Save item securely
 * Falls back to AsyncStorage if SecureStore is not available
 */
export const secureSet = async (key: string, value: string): Promise<void> => {
    try {
        if (await isSecureStoreAvailable()) {
            await SecureStore.setItemAsync(key, value, secureStoreOptions);
        } else {
            // Fallback for web or unsupported platforms
            await AsyncStorage.setItem(`@secure_${key}`, value);
        }
    } catch (error) {
        console.error(`SecureStore: Error saving ${key}:`, error);
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(`@secure_${key}`, value);
    }
};

/**
 * Get item securely
 */
export const secureGet = async (key: string): Promise<string | null> => {
    try {
        if (await isSecureStoreAvailable()) {
            return await SecureStore.getItemAsync(key, secureStoreOptions);
        } else {
            return await AsyncStorage.getItem(`@secure_${key}`);
        }
    } catch (error) {
        console.error(`SecureStore: Error getting ${key}:`, error);
        // Try fallback
        return await AsyncStorage.getItem(`@secure_${key}`);
    }
};

/**
 * Delete item securely
 */
export const secureDelete = async (key: string): Promise<void> => {
    try {
        if (await isSecureStoreAvailable()) {
            await SecureStore.deleteItemAsync(key, secureStoreOptions);
        }
        // Also try to delete from AsyncStorage (for migration cleanup)
        await AsyncStorage.removeItem(`@secure_${key}`);
    } catch (error) {
        console.error(`SecureStore: Error deleting ${key}:`, error);
    }
};

/**
 * Save object as JSON securely
 */
export const secureSetObject = async <T>(key: string, value: T): Promise<void> => {
    const jsonValue = JSON.stringify(value);
    await secureSet(key, jsonValue);
};

/**
 * Get object from JSON securely
 */
export const secureGetObject = async <T>(key: string): Promise<T | null> => {
    const jsonValue = await secureGet(key);
    if (jsonValue) {
        try {
            return JSON.parse(jsonValue) as T;
        } catch {
            return null;
        }
    }
    return null;
};

/**
 * Migrate from AsyncStorage to SecureStore
 * Call this once during app initialization
 */
export const migrateToSecureStorage = async (): Promise<void> => {
    try {
        // Migrate auth token
        const oldToken = await AsyncStorage.getItem('authToken');
        if (oldToken) {
            await secureSet(SECURE_KEYS.AUTH_TOKEN, oldToken);
            await AsyncStorage.removeItem('authToken');
            console.log('SecureStore: Migrated auth token');
        }

        // Migrate user data
        const oldUser = await AsyncStorage.getItem('user');
        if (oldUser) {
            await secureSet(SECURE_KEYS.USER_DATA, oldUser);
            await AsyncStorage.removeItem('user');
            console.log('SecureStore: Migrated user data');
        }
    } catch (error) {
        console.error('SecureStore: Migration error:', error);
    }
};

export default {
    set: secureSet,
    get: secureGet,
    delete: secureDelete,
    setObject: secureSetObject,
    getObject: secureGetObject,
    migrateToSecureStorage,
    KEYS: SECURE_KEYS,
};
