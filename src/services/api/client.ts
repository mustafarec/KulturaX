import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

// API Base URL
export const API_URL = 'https://mmreeo.online/api';

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = async (token: string) => {
    authToken = token;
    await AsyncStorage.setItem('authToken', token);
};

export const getAuthToken = async (): Promise<string | null> => {
    if (!authToken) {
        authToken = await AsyncStorage.getItem('authToken');
    }
    return authToken;
};

export const clearAuthToken = async () => {
    authToken = null;
    await AsyncStorage.removeItem('authToken');
};

// Request interceptor - Add token to every request
apiClient.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.headers['X-Auth-Token'] = token;
            // Token artık URL'de gönderilmiyor - güvenlik için sadece header kullanılıyor
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

// Helper to handle API errors
export const handleApiError = (error: any): never => {
    throw error.response ? error.response.data : new Error('Network Error');
};

export default apiClient;
