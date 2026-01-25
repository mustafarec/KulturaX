import { apiClient, handleApiError } from './client';

export const postService = {
    create: async (
        userId: number,
        quote: string,
        comment: string,
        source: string,
        author: string,
        title?: string,
        originalPostId?: number,
        contentType?: string,
        contentId?: string,
        imageUrl?: string,
        topicId?: number
    ) => {
        try {
            const response = await apiClient.post('/posts/create.php', {
                user_id: userId,
                quote,
                comment,
                title,
                source,
                author,
                original_post_id: originalPostId,
                content_type: contentType,
                content_id: contentId,
                image_url: imageUrl,
                topic_id: topicId
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    togglePin: async (postId: number) => {
        try {
            const response = await apiClient.post('/posts/toggle_pin.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getFeed: async (userId?: number, filter?: string, search?: string) => {
        try {
            let url = `/posts/get_feed.php?`;
            if (userId) url += `user_id=${userId}&`;
            if (filter) url += `filter=${filter}&`;
            if (search) url += `search=${search}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getFollowingFeed: async (userId: number, filter?: string, search?: string) => {
        try {
            let url = `/posts/get_following_feed.php?user_id=${userId}&`;
            if (filter) url += `filter=${filter}&`;
            if (search) url += `search=${search}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getQuotesByContent: async (contentType: string, contentId: string) => {
        try {
            const response = await apiClient.get(`/posts/get_by_content.php?content_type=${contentType}&content_id=${contentId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    delete: async (postId: number) => {
        try {
            const response = await apiClient.post('/posts/delete.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    uploadImage: async (userId: number, formData: FormData) => {
        try {
            const response = await apiClient.post('/posts/upload_image.php', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    markViewed: async (postId: number, userId?: number) => {
        try {
            await apiClient.post('/posts/view.php', { post_id: postId, user_id: userId });
        } catch (error) {
            console.log('Mark view failed', error);
        }
    }
};
