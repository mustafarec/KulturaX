import { apiClient, handleApiError } from './client';

export const interactionService = {
    toggleLike: async (postId: number) => {
        try {
            const response = await apiClient.post('/interactions/like.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    addComment: async (userId: number, postId: number, content: string, parentId?: number) => {
        try {
            const response = await apiClient.post('/interactions/comment.php', {
                user_id: userId, post_id: postId, content, parent_id: parentId
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getComments: async (postId: number, userId?: number) => {
        try {
            const response = await apiClient.get(`/interactions/comment.php?post_id=${postId}${userId ? `&user_id=${userId}` : ''}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    deleteComment: async (userId: number, commentId: number) => {
        try {
            const response = await apiClient.post('/interactions/delete_comment.php', { user_id: userId, comment_id: commentId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    likeComment: async (userId: number, commentId: number) => {
        try {
            const response = await apiClient.post('/interactions/like_comment.php', { user_id: userId, comment_id: commentId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    toggleBookmark: async (userId: number, postId: number) => {
        try {
            const response = await apiClient.post('/interactions/bookmarks.php?action=toggle', { post_id: postId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getBookmarks: async (userId: number, page: number = 1) => {
        try {
            const response = await apiClient.get(`/interactions/bookmarks.php?action=list&page=${page}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    checkBookmark: async (userId: number, postId: number) => {
        try {
            const response = await apiClient.get(`/interactions/bookmarks.php?action=check&post_id=${postId}`);
            return response.data;
        } catch (error: any) {
            return { saved: false };
        }
    },

    sendFeedFeedback: async (postId: number, type: 'report' | 'not_interested' | 'show_more', reason?: string) => {
        try {
            const response = await apiClient.post('/interactions/feedback.php', { post_id: postId, type, reason });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getFeedPreferences: async () => {
        try {
            const response = await apiClient.get('/users/get_preferences.php');
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    deleteFeedPreference: async (id: number) => {
        try {
            const response = await apiClient.post('/users/delete_preference.php', { id });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};

export const reviewService = {
    addReview: async (
        userId: number,
        contentType: string,
        contentId: string,
        rating: number,
        reviewText: string,
        contentTitle?: string,
        imageUrl?: string,
        title?: string
    ) => {
        try {
            const response = await apiClient.post('/interactions/add_review.php', {
                user_id: userId,
                content_type: contentType,
                content_id: contentId,
                rating,
                review_text: reviewText,
                content_title: contentTitle,
                image_url: imageUrl,
                title
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getReviews: async (contentType: string, contentId: string) => {
        try {
            const response = await apiClient.get(`/interactions/get_reviews.php?content_type=${contentType}&content_id=${contentId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getUserReviews: async (userId: number) => {
        try {
            const response = await apiClient.get(`/interactions/get_user_reviews.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};

export const clickTrackingService = {
    trackClick: async (contentType: string, contentId: string, contentTitle?: string, sourceScreen?: string) => {
        try {
            await apiClient.post('/interactions/track_click.php', {
                content_type: contentType,
                content_id: contentId,
                content_title: contentTitle,
                source_screen: sourceScreen
            });
        } catch (error) {
            console.log('Track click failed (non-critical):', error);
        }
    },

    getPopularContent: async (contentType?: string, days: number = 7, limit: number = 20) => {
        try {
            let url = `/interactions/track_click.php?days=${days}&limit=${limit}`;
            if (contentType) url += `&content_type=${contentType}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error: any) {
            console.error('Get popular content error:', error);
            return { data: [], total: 0 };
        }
    }
};
