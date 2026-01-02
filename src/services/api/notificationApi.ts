import { apiClient, handleApiError } from './client';

export const notificationService = {
    registerToken: async (token: string, platform: 'ios' | 'android') => {
        try {
            const response = await apiClient.post('/notifications/register_token.php', { token, platform });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    removeToken: async (token: string) => {
        try {
            const response = await apiClient.post('/notifications/remove_token.php', { token });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getNotifications: async (userId: number) => {
        try {
            const response = await apiClient.get(`/notifications/get.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getUnreadCount: async (userId: number) => {
        try {
            const response = await apiClient.get(`/notifications/get_unread_count.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    markAsRead: async (userId: number, notificationId: number) => {
        try {
            const response = await apiClient.post('/notifications/mark_read.php', { user_id: userId, notification_id: notificationId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    deleteNotification: async (userId: number, notificationId: number) => {
        try {
            const response = await apiClient.post('/notifications/delete.php', { user_id: userId, notification_id: notificationId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    markAllAsRead: async (userId: number) => {
        try {
            const response = await apiClient.post('/notifications/mark_all_read.php', { user_id: userId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    deleteAllNotifications: async (userId: number) => {
        try {
            const response = await apiClient.post('/notifications/delete_all.php', { user_id: userId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getSettings: async () => {
        try {
            const response = await apiClient.get('/notifications/get_settings.php');
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    updateSettings: async (settings: {
        push_enabled?: boolean;
        likes?: boolean;
        comments?: boolean;
        follows?: boolean;
        messages?: boolean;
        reposts?: boolean
    }) => {
        try {
            const response = await apiClient.post('/notifications/update_settings.php', settings);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};
