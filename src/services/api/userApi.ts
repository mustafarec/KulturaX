import { apiClient, handleApiError } from './client';

export const userService = {
    uploadAvatar: async (userId: number, formData: FormData) => {
        try {
            const response = await apiClient.post('/users/upload_avatar.php', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getUserProfile: async (userId: number, viewerId?: number) => {
        try {
            const url = viewerId
                ? `/users/get.php?user_id=${userId}&viewer_id=${viewerId}`
                : `/users/get.php?user_id=${userId}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    updateProfile: async (userId: number, formData: FormData) => {
        try {
            const response = await apiClient.post('/users/update_profile.php', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    followUser: async (followedId: number) => {
        try {
            const response = await apiClient.post('/users/follow.php', { followed_id: followedId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    checkFollowStatus: async (followerId: number, followedId: number) => {
        try {
            const response = await apiClient.post('/users/check_follow.php', { follower_id: followerId, followed_id: followedId });
            return response.data;
        } catch (error: any) {
            return { is_following: false };
        }
    },

    savePreference: async (userId: number, key: string, value: string, expiresInHours?: number) => {
        const response = await apiClient.post('/users/set_preference.php', {
            key, value, expires_in_hours: expiresInHours
        });
        return response.data;
    },

    search: async (query: string) => {
        try {
            const response = await apiClient.get(`/users/search.php?query=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getConnections: async (userId: number, type: 'followers' | 'following', viewerId?: number) => {
        try {
            let url = `/users/connections.php?user_id=${userId}&type=${type}`;
            if (viewerId) url += `&viewer_id=${viewerId}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    blockUser: async (blockedId: number) => {
        const response = await apiClient.post('/users/block_user.php', { blocked_id: blockedId });
        return response.data;
    },

    unblockUser: async (blockedId: number) => {
        const response = await apiClient.post('/users/unblock_user.php', { blocked_id: blockedId });
        return response.data;
    },

    getBlockedUsers: async () => {
        const response = await apiClient.get('/users/get_blocked_users.php');
        return response.data;
    },

    getPopularUsers: async () => {
        try {
            const response = await apiClient.get('/users/popular_users.php');
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getSuggestedUsers: async (userId: number) => {
        try {
            const response = await apiClient.get(`/users/suggested_users.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    muteUser: async (mutedId: number) => {
        try {
            const response = await apiClient.post('/users/mute_user.php', { muted_id: mutedId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    unmuteUser: async (mutedId: number) => {
        try {
            const response = await apiClient.post('/users/unmute_user.php', { muted_id: mutedId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getMutedUsers: async () => {
        try {
            const response = await apiClient.get('/users/get_muted_users.php');
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    updatePrivacy: async (isPrivate: boolean) => {
        try {
            const response = await apiClient.post('/users/update_privacy.php', { is_private: isPrivate });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getFollowRequests: async () => {
        try {
            const response = await apiClient.get('/users/get_follow_requests.php');
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    acceptFollowRequest: async (requestId: number) => {
        try {
            const response = await apiClient.post('/users/accept_follow_request.php', { request_id: requestId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    rejectFollowRequest: async (requestId: number) => {
        try {
            const response = await apiClient.post('/users/reject_follow_request.php', { request_id: requestId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};
