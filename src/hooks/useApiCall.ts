import { useState, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { ApiError, createApiError, ERROR_MESSAGES } from '../types/errors';

interface UseApiCallOptions {
    showToast?: boolean;
    retryCount?: number;
}

interface UseApiCallResult<T> {
    data: T | null;
    loading: boolean;
    error: ApiError | null;
    execute: (...args: any[]) => Promise<T | null>;
    reset: () => void;
}

export function useApiCall<T>(
    apiFunction: (...args: any[]) => Promise<T>,
    options: UseApiCallOptions = {}
): UseApiCallResult<T> {
    const { showToast = true, retryCount = 3 } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);

    const execute = useCallback(async (...args: any[]): Promise<T | null> => {
        setLoading(true);
        setError(null);

        let lastError: ApiError | null = null;

        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                const result = await apiFunction(...args);
                setData(result);
                setLoading(false);
                return result;
            } catch (err: any) {
                lastError = createApiError(err);

                // Only retry on retryable errors
                if (!lastError.retry || attempt === retryCount) {
                    break;
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
            }
        }

        setError(lastError);
        setLoading(false);

        if (showToast && lastError) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: lastError.message,
            });
        }

        return null;
    }, [apiFunction, retryCount, showToast]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, execute, reset };
}
