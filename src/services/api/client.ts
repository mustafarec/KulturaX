import axios from 'axios';
import Toast from 'react-native-toast-message';
import { secureSet, secureGet, secureDelete, SECURE_KEYS } from '../SecureStorageService';
import CryptoJS from 'crypto-js';
import axiosRetry from 'axios-retry';
import { API_URL as ENV_API_URL, API_SIGNATURE_SECRET as ENV_API_SECRET } from '@env';

// API Base URL - from environment variable with fallback
export const API_URL = ENV_API_URL || 'https://mmreeo.online/api';

// API Signature Secret - from environment variable (Must match backend config.php)
const API_SIGNATURE_SECRET = ENV_API_SECRET || '';

/**
 * Generate API signature for request authentication
 * Format: timestamp:hmac_sha256(timestamp:secret)
 */
const generateApiSignature = (): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${timestamp}:${API_SIGNATURE_SECRET}`;
    const signature = CryptoJS.HmacSHA256(message, API_SIGNATURE_SECRET).toString();
    return `${timestamp}:${signature}`;
};

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 seconds timeout
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

// Token management - Now using SecureStore for encrypted storage
let authToken: string | null = null;

export const setAuthToken = async (token: string) => {
    authToken = token;
    await secureSet(SECURE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    if (!authToken) {
        authToken = await secureGet(SECURE_KEYS.AUTH_TOKEN);
    }
    return authToken;
};

export const clearAuthToken = async () => {
    authToken = null;
    await secureDelete(SECURE_KEYS.AUTH_TOKEN);
};

// Request interceptor - Add token and API signature to every request
apiClient.interceptors.request.use(
    async (config) => {
        // Add API signature for security
        config.headers['X-App-Signature'] = generateApiSignature();

        const token = await getAuthToken();
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

// Helper to handle API errors
export const handleApiError = (error: any): never => {
    throw error.response ? error.response.data : new Error('Network Error');
};

// 401 Unauthorized Handling Listener
let unauthorizedCallback: (() => void) | null = null;

export const onUnauthorized = (callback: () => void) => {
    unauthorizedCallback = callback;
};

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
            // Let retry-axios handle it if configured, otherwise reject
            return Promise.reject(new Error("Network/SSL Error"));
        }

        // 401 Unauthorized - Token Expired Logic
        if (error.response.status === 401) {
            const errorCode = error.response.data?.code;
            // Only logout if explicitly TOKEN_EXPIRED or if no specific code is provided (safe fallback)
            if (errorCode === 'TOKEN_EXPIRED' || !errorCode) {
                if (unauthorizedCallback) {
                    unauthorizedCallback();
                }
            }
        }

        // HTML Error Handling
        if (typeof error.response.data === 'string' &&
            (error.response.data.trim().startsWith('<!DOCTYPE') ||
                error.response.data.trim().startsWith('<html'))) {
            console.warn('Backend returned HTML instead of JSON:', error.config.url);
            error.response.data = { message: 'Sunucu hatası veya geçersiz uç nokta.' };
        }

        return Promise.reject(error);
    }
);

export default apiClient;
