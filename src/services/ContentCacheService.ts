/**
 * Content Cache Service
 * 
 * AsyncStorage tabanlı local cache sistemi
 * Library status ve content metadata için hızlı erişim sağlar
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key prefixes
const CACHE_KEYS = {
    LIBRARY_STATUS: 'cache_library_status_',
    CONTENT_DETAIL: 'cache_content_detail_',
    POPULAR_CONTENT: 'cache_popular_content_',
};

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
    LIBRARY_STATUS: 5 * 60 * 1000,      // 5 dakika
    CONTENT_DETAIL: 60 * 60 * 1000,     // 1 saat
    POPULAR_CONTENT: 30 * 60 * 1000,    // 30 dakika
};

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/**
 * Generic cache helper functions
 */
const cacheHelpers = {
    /**
     * Get item from cache if not expired
     */
    get: async <T>(key: string): Promise<T | null> => {
        try {
            const cached = await AsyncStorage.getItem(key);
            if (!cached) return null;

            const entry: CacheEntry<T> = JSON.parse(cached);
            const now = Date.now();

            // Check if expired
            if (now - entry.timestamp > entry.ttl) {
                // Expired - remove from cache
                await AsyncStorage.removeItem(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.log('Cache get error:', error);
            return null;
        }
    },

    /**
     * Set item in cache with TTL
     */
    set: async <T>(key: string, data: T, ttl: number): Promise<void> => {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl,
            };
            await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch (error) {
            console.log('Cache set error:', error);
        }
    },

    /**
     * Remove item from cache
     */
    remove: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.log('Cache remove error:', error);
        }
    },

    /**
     * Clear all cache entries with a specific prefix
     */
    clearByPrefix: async (prefix: string): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(prefix));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }
        } catch (error) {
            console.log('Cache clearByPrefix error:', error);
        }
    },
};

/**
 * Library Status Cache
 * Caches the user's library status for content items
 */
export const libraryStatusCache = {
    /**
     * Get cached library status
     * @returns status object or null if not cached/expired
     */
    get: async (userId: number, contentType: string, contentId: string) => {
        const key = `${CACHE_KEYS.LIBRARY_STATUS}${userId}_${contentType}_${contentId}`;
        return cacheHelpers.get<{ status: string | null; progress: number }>(key);
    },

    /**
     * Set library status in cache
     */
    set: async (userId: number, contentType: string, contentId: string, status: string | null, progress: number = 0) => {
        const key = `${CACHE_KEYS.LIBRARY_STATUS}${userId}_${contentType}_${contentId}`;
        await cacheHelpers.set(key, { status, progress }, CACHE_TTL.LIBRARY_STATUS);
    },

    /**
     * Invalidate cache for a specific item (call after update)
     */
    invalidate: async (userId: number, contentType: string, contentId: string) => {
        const key = `${CACHE_KEYS.LIBRARY_STATUS}${userId}_${contentType}_${contentId}`;
        await cacheHelpers.remove(key);
    },

    /**
     * Clear all library status cache for a user
     */
    clearAll: async (userId: number) => {
        await cacheHelpers.clearByPrefix(`${CACHE_KEYS.LIBRARY_STATUS}${userId}_`);
    },
};

/**
 * Content Detail Cache
 * Caches content details from external APIs (TMDB, Google Books, Spotify)
 */
export const contentDetailCache = {
    get: async (contentType: string, contentId: string) => {
        const key = `${CACHE_KEYS.CONTENT_DETAIL}${contentType}_${contentId}`;
        return cacheHelpers.get<any>(key);
    },

    set: async (contentType: string, contentId: string, data: any) => {
        const key = `${CACHE_KEYS.CONTENT_DETAIL}${contentType}_${contentId}`;
        await cacheHelpers.set(key, data, CACHE_TTL.CONTENT_DETAIL);
    },

    invalidate: async (contentType: string, contentId: string) => {
        const key = `${CACHE_KEYS.CONTENT_DETAIL}${contentType}_${contentId}`;
        await cacheHelpers.remove(key);
    },
};

/**
 * Popular Content Cache
 */
export const popularContentCache = {
    get: async (contentType?: string) => {
        const key = `${CACHE_KEYS.POPULAR_CONTENT}${contentType || 'all'}`;
        return cacheHelpers.get<any[]>(key);
    },

    set: async (contentType: string | undefined, data: any[]) => {
        const key = `${CACHE_KEYS.POPULAR_CONTENT}${contentType || 'all'}`;
        await cacheHelpers.set(key, data, CACHE_TTL.POPULAR_CONTENT);
    },
};

/**
 * Clear all content-related caches
 */
export const clearAllContentCaches = async () => {
    await cacheHelpers.clearByPrefix(CACHE_KEYS.LIBRARY_STATUS);
    await cacheHelpers.clearByPrefix(CACHE_KEYS.CONTENT_DETAIL);
    await cacheHelpers.clearByPrefix(CACHE_KEYS.POPULAR_CONTENT);
};

export default {
    libraryStatusCache,
    contentDetailCache,
    popularContentCache,
    clearAllContentCaches,
};
