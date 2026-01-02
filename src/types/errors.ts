// API Error Types
export type ApiErrorCode =
    | 'NETWORK'      // Ağ bağlantı hatası
    | 'AUTH'         // Kimlik doğrulama hatası (401)
    | 'FORBIDDEN'    // Erişim engeli (403)
    | 'NOT_FOUND'    // Kaynak bulunamadı (404)
    | 'VALIDATION'   // Doğrulama hatası (422)
    | 'SERVER'       // Sunucu hatası (500+)
    | 'TIMEOUT'      // Zaman aşımı
    | 'UNKNOWN';     // Bilinmeyen hata

export interface ApiError {
    code: ApiErrorCode;
    message: string;
    details?: string;
    retry?: boolean;
    status?: number;
}

// Error messages in Turkish
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
    NETWORK: 'İnternet bağlantınızı kontrol edin.',
    AUTH: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
    FORBIDDEN: 'Bu işlem için yetkiniz bulunmuyor.',
    NOT_FOUND: 'Aradığınız içerik bulunamadı.',
    VALIDATION: 'Girdiğiniz bilgileri kontrol edin.',
    SERVER: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    TIMEOUT: 'İstek zaman aşımına uğradı. Tekrar deneyin.',
    UNKNOWN: 'Beklenmeyen bir hata oluştu.',
};

// Map HTTP status to error code
export const statusToErrorCode = (status: number): ApiErrorCode => {
    if (status === 401) return 'AUTH';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 422) return 'VALIDATION';
    if (status >= 500) return 'SERVER';
    return 'UNKNOWN';
};

// Create ApiError from axios error
export const createApiError = (error: any): ApiError => {
    if (!error.response) {
        return {
            code: 'NETWORK',
            message: ERROR_MESSAGES.NETWORK,
            retry: true,
        };
    }

    const status = error.response.status;
    const code = statusToErrorCode(status);
    const serverMessage = error.response.data?.message;

    return {
        code,
        message: serverMessage || ERROR_MESSAGES[code],
        status,
        retry: code === 'NETWORK' || code === 'SERVER' || code === 'TIMEOUT',
    };
};
