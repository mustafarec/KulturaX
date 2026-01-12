/**
 * Version API - KültüraX
 * 
 * Backend'den uygulama versiyon bilgilerini alır.
 */

import apiClient from './client';

export interface VersionInfo {
    latest_version: string;
    minimum_version: string;
    update_url: string;
    release_notes?: string;
}

/**
 * Backend'den güncel versiyon bilgilerini al
 */
export const getVersionInfo = async (): Promise<VersionInfo> => {
    try {
        const response = await apiClient.get<VersionInfo>('/version.php');
        return response.data;
    } catch (error) {
        console.warn('Version check failed:', error);
        // Hata durumunda varsayılan değerler döndür
        return {
            latest_version: '0.0.0',
            minimum_version: '0.0.0',
            update_url: '',
        };
    }
};
