/**
 * API Client - KültüraX
 * 
 * Axios tabanlı HTTP istemcisi.
 * Özellikler:
 * - Otomatik retry (3 deneme, exponential backoff)
 * - API signature (HMAC-SHA256)
 * - Token yönetimi (SecureStore ile şifreli)
 * - 401 Unauthorized handling
 * - Network error handling
 */

import axios from 'axios';
import Toast from 'react-native-toast-message';
import { secureSet, secureGet, secureDelete, SECURE_KEYS } from '../SecureStorageService';
import CryptoJS from 'crypto-js';
import axiosRetry from 'axios-retry';
import { API_URL as ENV_API_URL, API_SIGNATURE_SECRET as ENV_API_SECRET } from '@env';

// =============================================================================
// Configuration
// =============================================================================

/** API Base URL - from environment variable */
export const API_URL = ENV_API_URL;



/** API Signature Secret - from environment variable (Must match backend config.php) */
const API_SIGNATURE_SECRET = ENV_API_SECRET || '';

// =============================================================================
// Token Management (Encapsulated)
// =============================================================================

/**
 * Token Manager - Encapsulates token state and operations
 * Avoids global mutable state by using closure
 */
const createTokenManager = () => {
    let cachedToken: string | null = null;

    return {
        /** Set auth token (cache + secure storage) */
        set: async (token: string): Promise<void> => {
            cachedToken = token;
            await secureSet(SECURE_KEYS.AUTH_TOKEN, token);
        },

        /** Get auth token (from cache or secure storage) */
        get: async (): Promise<string | null> => {
            if (!cachedToken) {
                cachedToken = await secureGet(SECURE_KEYS.AUTH_TOKEN);
            }
            return cachedToken;
        },

        /** Clear auth token */
        clear: async (): Promise<void> => {
            cachedToken = null;
            await secureDelete(SECURE_KEYS.AUTH_TOKEN);
        }
    };
};

// Token manager instance
const tokenManager = createTokenManager();

// Exported token functions (backwards compatible)
export const setAuthToken = tokenManager.set;
export const getAuthToken = tokenManager.get;
export const clearAuthToken = tokenManager.clear;

// =============================================================================
// Unauthorized Callback Management
// =============================================================================

/**
 * Unauthorized callback manager
 */
const createUnauthorizedHandler = () => {
    let callback: (() => void) | null = null;

    return {
        set: (cb: () => void) => {
            callback = cb;
        },
        invoke: () => {
            if (callback) {
                callback();
            }
        }
    };
};

const unauthorizedHandler = createUnauthorizedHandler();

/** Register callback for 401 Unauthorized events */
export const onUnauthorized = unauthorizedHandler.set;

// =============================================================================
// API Signature Generation
// =============================================================================

/**
 * Generate API signature for request authentication
 * Format: timestamp:hmac_sha256(method:url:body:timestamp:secret)
 */
const generateApiSignature = (method: string = '', url: string = '', body: any = null): string => {
    const timestamp = Math.floor(Date.now() / 1000);

    // Normalize body: Use empty string if no body, otherwise stringify
    let bodyString = '';
    if (body) {
        try {
            // Ensure stable stringification (though JSON.stringify is usually enough for simple objects)
            bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        } catch (e) {
            bodyString = '';
        }
    }

    // Normalize URL: Strip baseURL if present to get the path relative to /api
    let normalizedUrl = url;
    if (normalizedUrl.startsWith(API_URL)) {
        normalizedUrl = normalizedUrl.slice(API_URL.length);
    }
    // Ensure leading slash for consistency with backend
    if (!normalizedUrl.startsWith('/')) {
        normalizedUrl = '/' + normalizedUrl;
    }

    // Create message: method:url:body:timestamp:secret
    const message = `${method.toUpperCase()}:${normalizedUrl}:${bodyString}:${timestamp}:${API_SIGNATURE_SECRET}`;
    const signature = CryptoJS.HmacSHA256(message, API_SIGNATURE_SECRET).toString();

    return `${timestamp}:${signature}`;
};


// =============================================================================
// Axios Instance
// =============================================================================

/** Axios instance with default configuration */
export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 120000, // 120 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Configure retry logic
axiosRetry(apiClient, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        // Do not retry on 4xx (client errors)
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response?.status ? error.response.status >= 500 : false);
    }
});

// =============================================================================
// Interceptors
// =============================================================================

// Request interceptor - Add token and API signature to every request
apiClient.interceptors.request.use(
    async (config) => {
        // Use getUri() to include query parameters in the signature message
        const relativeUrl = apiClient.getUri(config);

        config.headers['X-App-Signature'] = generateApiSignature(
            config.method,
            relativeUrl,
            config.data
        );
        const token = await tokenManager.get();

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.headers['X-Auth-Token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network/SSL Error
        if (!error.response) {
            Toast.show({
                type: 'error',
                text1: 'Bağlantı Hatası',
                text2: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
                visibilityTime: 4000
            });
            return Promise.reject(new Error("Network/SSL Error"));
        }

        // 401 Unauthorized - Token Expired Logic
        if (error.response.status === 401) {
            const errorCode = error.response.data?.code;
            // Only logout if explicitly TOKEN_EXPIRED or if no specific code is provided
            if (errorCode === 'TOKEN_EXPIRED' || !errorCode) {
                unauthorizedHandler.invoke();
            }
        }

        // 5xx Server Errors
        if (error.response.status >= 500) {
            console.error(`Status 500+ Error at ${error.config.url}:`, error.response.data);
            Toast.show({
                type: 'error',
                text1: 'Sunucu Hatası',
                text2: 'Şu an isteğinizi gerçekleştiremiyoruz. Lütfen daha sonra tekrar deneyin.',
                visibilityTime: 4000
            });
        }

        return Promise.reject(error);
    }
);


// =============================================================================
// Error Handling
// =============================================================================

/**
 * Handle API errors - throws formatted error
 * @param error - Axios error object
 * @returns never - always throws
 */
export const handleApiError = (error: any): never => {
    throw error.response ? error.response.data : new Error('Network Error');
};

export default apiClient;
