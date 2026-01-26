import { apiClient, handleApiError } from './client';
import { libraryStatusCache } from '../ContentCacheService';

export const libraryService = {
    updateStatus: async (
        contentType: string,
        contentId: string,
        status: string,
        progress: number = 0,
        contentTitle?: string,
        imageUrl?: string,
        author?: string,
        summary?: string,
        lyrics?: string,
        isbn?: string,
        userId?: number
    ) => {
        try {
            const response = await apiClient.post('/library/update.php', {
                content_type: contentType,
                content_id: contentId,
                status,
                progress,
                content_title: contentTitle,
                image_url: imageUrl,
                author: author,
                summary: summary,
                lyrics: lyrics,
                isbn: isbn
            });

            // Invalidate cache after update
            if (userId) {
                await libraryStatusCache.invalidate(userId, contentType, contentId);
            }

            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getStatus: async (userId: number, contentType: string, contentId: string, skipCache: boolean = false) => {
        try {
            // Check cache first
            if (!skipCache) {
                const cached = await libraryStatusCache.get(userId, contentType, contentId);
                if (cached !== null) {
                    return cached;
                }
            }

            // Fetch from API
            const response = await apiClient.get(`/library/get_status.php?user_id=${userId}&content_type=${contentType}&content_id=${contentId}`);
            const data = response.data;

            // Cache the result
            if (data) {
                await libraryStatusCache.set(userId, contentType, contentId, data.status || null, data.progress || 0);
            } else {
                await libraryStatusCache.set(userId, contentType, contentId, null, 0);
            }

            return data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    invalidateStatusCache: async (userId: number, contentType: string, contentId: string) => {
        await libraryStatusCache.invalidate(userId, contentType, contentId);
    },

    clearAllStatusCache: async (userId: number) => {
        await libraryStatusCache.clearAll(userId);
    },

    getUserLibrary: async (userId: number, status?: string) => {
        try {
            const response = await apiClient.get(`/library/get_user_library.php?user_id=${userId}${status ? `&status=${status}` : ''}`);
            const data = response.data;
            if (data && Array.isArray(data.items)) {
                return data.items;
            }
            return data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getStats: async (userId: number) => {
        try {
            const response = await apiClient.get(`/library/get_stats.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};

export const goalService = {
    updateGoal: async (targetCount: number, year?: number) => {
        try {
            const response = await apiClient.post('/goals/update.php', {
                target_count: targetCount,
                year
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getGoal: async (userId: number, year?: number) => {
        try {
            const response = await apiClient.get(`/goals/get.php?user_id=${userId}${year ? `&year=${year}` : ''}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};
