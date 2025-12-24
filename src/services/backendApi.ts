import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// BURAYI GÜNCELLEYİN: Kendi sunucu adresinizi yazın
// Örn: 'https://siteniz.com/api' veya yerel test için 'http://10.0.2.2/kitapmuzikfilm/backend'
export const API_URL = 'https://mmreeo.online/api';

const backendApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token yönetimi
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

// Axios interceptor - Her istekte token ekle
backendApi.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.headers['X-Auth-Token'] = token;

            // Fallback: Add token to params for servers that strip headers
            config.params = { ...config.params, token: token };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Axios interceptor - Yanıtları kontrol et
backendApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // 1. SSL Pinning / Network Error Handling
        if (!error.response) {
            // Eğer response yoksa, internet yok veya SSL hatası (bağlantı reddedildi) demektir.
            Alert.alert(
                "Bağlantı Hatası",
                "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin veya güvenli bağlantı kurulamadı (SSL).",
                [{ text: "Tamam" }]
            );
            return Promise.reject(new Error("Network/SSL Error"));
        }

        // 2. HTML Error Handling (Server Crash/404)
        if (typeof error.response.data === 'string' && (error.response.data.trim().startsWith('<!DOCTYPE') || error.response.data.trim().startsWith('<html'))) {
            console.warn('Backend returned HTML instead of JSON:', error.config.url);
            error.response.data = { message: 'Sunucu hatası veya geçersiz uç nokta.' };
        }

        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email: string, password: string) => {
        try {
            const response = await backendApi.post('/auth/login.php', { email, password });
            if (response.data.token) {
                await setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    register: async (email: string, password: string, name: string, surname: string, username: string, birthDate?: string, gender?: string) => {
        try {
            const response = await backendApi.post('/auth/register.php', {
                email,
                password,
                name,
                surname,
                username,
                birth_date: birthDate,
                gender
            });
            if (response.data.token) {
                await setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    togglePin: async (postId: number) => {
        try {
            const response = await backendApi.post('/posts/toggle_pin.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Verify Email
    verifyEmail: async (email: string, code: string) => {
        try {
            const response = await backendApi.post('/auth/verify.php', { email, code });
            if (response.data.token) {
                await setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    resendVerificationCode: async (email: string) => {
        try {
            const response = await backendApi.post('/auth/resend_code.php', { email });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        try {
            const response = await backendApi.post('/auth/change_password.php', {
                current_password: currentPassword,
                new_password: newPassword
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    logout: async () => {
        await clearAuthToken();
    },
};

export const postService = {
    create: async (userId: number, quote: string, comment: string, source: string, author: string, originalPostId?: number, contentType?: string, contentId?: string, imageUrl?: string, topicId?: number) => {
        try {
            const response = await backendApi.post('/posts/create.php', {
                user_id: userId,
                quote,
                comment,
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
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    togglePin: async (postId: number) => {
        try {
            const response = await backendApi.post('/posts/toggle_pin.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getFeed: async (userId?: number, filter?: string, search?: string) => {
        try {
            let url = `/posts/get_feed.php?`;
            if (userId) url += `user_id=${userId}&`;
            if (filter) url += `filter=${filter}&`;
            if (search) url += `search=${search}`;
            const response = await backendApi.get(url);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getFollowingFeed: async (userId: number, filter?: string, search?: string) => {
        try {
            let url = `/posts/get_following_feed.php?user_id=${userId}&`;
            if (filter) url += `filter=${filter}&`;
            if (search) url += `search=${search}`;
            const response = await backendApi.get(url);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getQuotesByContent: async (contentType: string, contentId: string) => {
        try {
            const response = await backendApi.get(`/posts/get_by_content.php?content_type=${contentType}&content_id=${contentId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    delete: async (postId: number) => {
        try {
            const response = await backendApi.post('/posts/delete.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    uploadImage: async (userId: number, formData: FormData) => {
        try {
            const response = await backendApi.post('/posts/upload_image.php', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    markViewed: async (postId: number, userId?: number) => {
        try {
            await backendApi.post('/posts/view.php', { post_id: postId, user_id: userId });
        } catch (error) {
            // View istatistiği başarısız olsa bile kullanıcı deneyimini bozmamak için sessizce yutuyoruz.
            console.log('Mark view failed', error);
        }
    }
};

export const libraryService = {
    updateStatus: async (contentType: string, contentId: string, status: string, progress: number = 0, contentTitle?: string, imageUrl?: string, author?: string, summary?: string, lyrics?: string, isbn?: string) => {
        try {
            const response = await backendApi.post('/library/update.php', {
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
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getStatus: async (userId: number, contentType: string, contentId: string) => {
        try {
            const response = await backendApi.get(`/library/get_status.php?user_id=${userId}&content_type=${contentType}&content_id=${contentId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getUserLibrary: async (userId: number, status?: string) => {
        try {
            const response = await backendApi.get(`/library/get_user_library.php?user_id=${userId}${status ? `&status=${status}` : ''}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const goalService = {
    updateGoal: async (targetCount: number, year?: number) => {
        try {
            const response = await backendApi.post('/goals/update.php', {
                target_count: targetCount,
                year
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getGoal: async (userId: number, year?: number) => {
        try {
            const response = await backendApi.get(`/goals/get.php?user_id=${userId}${year ? `&year=${year}` : ''}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const messageService = {
    send: async (receiverId: number, content: string) => {
        try {
            const response = await backendApi.post('/messages/send.php', { receiver_id: receiverId, content });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getMessages: async (userId: number, otherUserId: number) => {
        try {
            const response = await backendApi.get(`/messages/get.php?user_id=${userId}&other_user_id=${otherUserId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getInbox: async (type: 'inbox' | 'requests' = 'inbox') => {
        try {
            const response = await backendApi.get(`/messages/inbox.php?type=${type}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getUnreadCount: async (userId: number) => {
        try {
            const response = await backendApi.get(`/messages/get_unread_count.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    markMessagesRead: async (userId: number, otherUserId: number) => {
        try {
            const response = await backendApi.post('/messages/mark_read.php', { user_id: userId, other_user_id: otherUserId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    acceptRequest: async (userId: number, partnerId: number) => {
        try {
            const response = await backendApi.post('/messages/accept_request.php', { user_id: userId, partner_id: partnerId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    declineRequest: async (userId: number, partnerId: number) => {
        try {
            const response = await backendApi.post('/messages/decline_request.php', { user_id: userId, partner_id: partnerId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    deleteConversation: async (userId: number, partnerId: number) => {
        try {
            const response = await backendApi.post('/messages/delete_thread.php', { user_id: userId, partner_id: partnerId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Typing indicator
    setTyping: async (receiverId: number) => {
        try {
            const response = await backendApi.post('/messages/set_typing.php', { receiver_id: receiverId });
            return response.data;
        } catch (error: any) {
            // Silently fail - typing indicator is not critical
            console.log('Set typing failed', error);
        }
    },
    getTyping: async (otherUserId: number) => {
        try {
            const response = await backendApi.get(`/messages/get_typing.php?other_user_id=${otherUserId}`);
            return response.data;
        } catch (error: any) {
            return { is_typing: false };
        }
    },
    // Emoji reactions
    addReaction: async (messageId: number, emoji: string) => {
        try {
            const response = await backendApi.post('/messages/add_reaction.php', { message_id: messageId, emoji });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    removeReaction: async (messageId: number) => {
        try {
            const response = await backendApi.post('/messages/remove_reaction.php', { message_id: messageId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Edit message (15 dakika içinde)
    editMessage: async (messageId: number, content: string) => {
        try {
            const response = await backendApi.post('/messages/edit.php', { message_id: messageId, content });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Unsend message (15 dakika içinde)
    unsendMessage: async (messageId: number) => {
        try {
            const response = await backendApi.post('/messages/unsend.php', { message_id: messageId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Send with reply
    sendWithReply: async (receiverId: number, content: string, replyToId?: number) => {
        try {
            const response = await backendApi.post('/messages/send.php', {
                receiver_id: receiverId,
                content,
                reply_to_id: replyToId
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const notificationService = {
    registerToken: async (token: string, platform: 'ios' | 'android') => {
        try {
            const response = await backendApi.post('/notifications/register_token.php', { token, platform });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    removeToken: async (token: string) => {
        try {
            const response = await backendApi.post('/notifications/remove_token.php', { token });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getNotifications: async (userId: number) => {
        try {
            const response = await backendApi.get(`/notifications/get.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getUnreadCount: async (userId: number) => {
        try {
            const response = await backendApi.get(`/notifications/get_unread_count.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },

    markAsRead: async (userId: number, notificationId: number) => {
        try {
            const response = await backendApi.post('/notifications/mark_read.php', { user_id: userId, notification_id: notificationId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    deleteNotification: async (userId: number, notificationId: number) => {
        try {
            const response = await backendApi.post('/notifications/delete.php', { user_id: userId, notification_id: notificationId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    markAllAsRead: async (userId: number) => {
        try {
            const response = await backendApi.post('/notifications/mark_all_read.php', { user_id: userId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    deleteAllNotifications: async (userId: number) => {
        try {
            const response = await backendApi.post('/notifications/delete_all.php', { user_id: userId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Notification Settings
    getSettings: async () => {
        try {
            const response = await backendApi.get('/notifications/get_settings.php');
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    updateSettings: async (settings: { push_enabled?: boolean; likes?: boolean; comments?: boolean; follows?: boolean; messages?: boolean; reposts?: boolean }) => {
        try {
            const response = await backendApi.post('/notifications/update_settings.php', settings);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const interactionService = {
    toggleLike: async (postId: number) => {
        try {
            const response = await backendApi.post('/interactions/like.php', { post_id: postId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    addComment: async (userId: number, postId: number, content: string, parentId?: number) => {
        try {
            const response = await backendApi.post('/interactions/comment.php', { user_id: userId, post_id: postId, content, parent_id: parentId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getComments: async (postId: number, userId?: number) => {
        try {
            const response = await backendApi.get(`/interactions/comment.php?post_id=${postId}${userId ? `&user_id=${userId}` : ''}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    deleteComment: async (userId: number, commentId: number) => {
        try {
            const response = await backendApi.post('/interactions/delete_comment.php', { user_id: userId, comment_id: commentId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    likeComment: async (userId: number, commentId: number) => {
        try {
            const response = await backendApi.post('/interactions/like_comment.php', { user_id: userId, comment_id: commentId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    toggleBookmark: async (userId: number, postId: number) => {
        try {
            // Using POST with action '?action=toggle'
            const response = await backendApi.post('/interactions/bookmarks.php?action=toggle', { post_id: postId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getBookmarks: async (userId: number, page: number = 1) => {
        try {
            const response = await backendApi.get(`/interactions/bookmarks.php?action=list&page=${page}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    checkBookmark: async (userId: number, postId: number) => {
        try {
            const response = await backendApi.get(`/interactions/bookmarks.php?action=check&post_id=${postId}`);
            return response.data;
        } catch (error: any) {
            // Silently fail or return false
            return { saved: false };
        }
    },
    sendFeedFeedback: async (postId: number, type: 'report' | 'not_interested' | 'show_more', reason?: string) => {
        try {
            const response = await backendApi.post('/interactions/feedback.php', { post_id: postId, type, reason });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getFeedPreferences: async () => {
        try {
            const response = await backendApi.get('/users/get_preferences.php');
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    deleteFeedPreference: async (id: number) => {
        try {
            const response = await backendApi.post('/users/delete_preference.php', { id });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const reviewService = {
    addReview: async (userId: number, contentType: string, contentId: string, rating: number, reviewText: string, contentTitle?: string, imageUrl?: string) => {
        console.log('BackendApi addReview Payload:', { user_id: userId, content_type: contentType, content_id: contentId, rating, review_text: reviewText, content_title: contentTitle, image_url: imageUrl }); // Debug log
        try {
            const response = await backendApi.post('/interactions/add_review.php', {
                user_id: userId,
                content_type: contentType,
                content_id: contentId,
                rating,
                review_text: reviewText,
                content_title: contentTitle,
                image_url: imageUrl
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getReviews: async (contentType: string, contentId: string) => {
        try {
            const response = await backendApi.get(`/interactions/get_reviews.php?content_type=${contentType}&content_id=${contentId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getUserReviews: async (userId: number) => {
        try {
            const response = await backendApi.get(`/interactions/get_user_reviews.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const userService = {
    uploadAvatar: async (userId: number, formData: FormData) => {
        try {
            const response = await backendApi.post('/users/upload_avatar.php', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getUserProfile: async (userId: number, viewerId?: number) => {
        try {
            const url = viewerId
                ? `/users/get.php?user_id=${userId}&viewer_id=${viewerId}`
                : `/users/get.php?user_id=${userId}`;
            const response = await backendApi.get(url);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    updateProfile: async (userId: number, formData: FormData) => {
        try {
            const response = await backendApi.post('/users/update_profile.php', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    followUser: async (followedId: number) => {
        try {
            const response = await backendApi.post('/users/follow.php', { followed_id: followedId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    checkFollowStatus: async (followerId: number, followedId: number) => {
        try {
            const response = await backendApi.post('/users/check_follow.php', { follower_id: followerId, followed_id: followedId });
            return response.data;
        } catch (error: any) {
            // Return false if check fails to not block UI
            return { is_following: false };
        }
    },
    savePreference: async (userId: number, key: string, value: string, expiresInHours?: number) => {
        const response = await backendApi.post('/users/set_preference.php', {
            key,
            value,
            expires_in_hours: expiresInHours
        });
        return response.data;
    },

    search: async (query: string) => {
        try {
            const response = await backendApi.get(`/users/search.php?query=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
        // ... existing content ...
    },
    getConnections: async (userId: number, type: 'followers' | 'following', viewerId?: number) => {
        try {
            let url = `/users/connections.php?user_id=${userId}&type=${type}`;
            if (viewerId) url += `&viewer_id=${viewerId}`;
            const response = await backendApi.get(url);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    blockUser: async (blockedId: number) => {
        const response = await backendApi.post('/users/block_user.php', { blocked_id: blockedId });
        return response.data;
    },
    unblockUser: async (blockedId: number) => {
        const response = await backendApi.post('/users/unblock_user.php', { blocked_id: blockedId });
        return response.data;
    },
    getBlockedUsers: async () => {
        const response = await backendApi.get('/users/get_blocked_users.php');
        return response.data;
    },
    getPopularUsers: async () => {
        try {
            const response = await backendApi.get('/users/popular_users.php');
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getSuggestedUsers: async (userId: number) => {
        try {
            const response = await backendApi.get(`/users/suggested_users.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Muted Users
    muteUser: async (mutedId: number) => {
        try {
            const response = await backendApi.post('/users/mute_user.php', { muted_id: mutedId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    unmuteUser: async (mutedId: number) => {
        try {
            const response = await backendApi.post('/users/unmute_user.php', { muted_id: mutedId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getMutedUsers: async () => {
        try {
            const response = await backendApi.get('/users/get_muted_users.php');
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Privacy
    updatePrivacy: async (isPrivate: boolean) => {
        try {
            const response = await backendApi.post('/users/update_privacy.php', { is_private: isPrivate });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    // Follow Requests
    getFollowRequests: async () => {
        try {
            const response = await backendApi.get('/users/get_follow_requests.php');
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    acceptFollowRequest: async (requestId: number) => {
        try {
            const response = await backendApi.post('/users/accept_follow_request.php', { request_id: requestId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    rejectFollowRequest: async (requestId: number) => {
        try {
            const response = await backendApi.post('/users/reject_follow_request.php', { request_id: requestId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};



export const topicService = {
    getPopular: async () => {
        try {
            const response = await backendApi.get('/topics/get_popular.php');
            return response.data;
        } catch (error: any) {
            console.error('getPopular error', error);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    followTopic: async (topicId: number) => {
        try {
            const response = await backendApi.post('/topics/follow.php', { topic_id: topicId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getPostsByTopic: async (topicId: number) => {
        try {
            const response = await backendApi.get(`/topics/get_by_topic.php?topic_id=${topicId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const spotifyService = {
    searchTracks: async (query: string) => {
        try {
            const response = await backendApi.get(`/integrations/spotify_search.php?query=${encodeURIComponent(query)}`);
            return response.data.results;
        } catch (error) {
            console.error('Spotify Search Error:', error);
            return [];
        }
    },
    getTrack: async (id: string) => {
        try {
            const response = await backendApi.get(`/integrations/spotify_track.php?id=${id}`);
            return response.data;
        } catch (error) {
            console.error('Spotify Get Track Error:', error);
            return null;
        }
    },
    getTop50Tracks: async () => {
        try {
            const response = await backendApi.get('/integrations/spotify_top50.php');
            console.log("Spotify Backend Response:", response.data); // Debug Log
            return response.data.results;
        } catch (error: any) {
            console.error('Spotify Top 50 Error:', error);
            if (error.response) {
                console.error('Spotify Error Data:', error.response.data);
                console.error('Spotify Error Status:', error.response.status);
            }
            return [];
        }
    }
};

export const lyricsService = {
    getLyrics: async (artist: string, title: string) => {
        try {
            const response = await backendApi.get(`/integrations/lyrics_proxy.php?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
            return response.data.lyrics || null;
        } catch (error) {
            console.error('getLyrics error:', error);
            return null;
        }
    }
};

export const ticketmasterService = {
    searchEvents: async (keyword: string = '', city: string = '', page: number = 0) => {
        try {
            const response = await backendApi.get(`/integrations/ticketmaster.php?keyword=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}&page=${page}`);
            return response.data;
        } catch (error: any) {
            console.error('Ticketmaster Search Error:', error);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },
    getEventDetails: async (id: string) => {
        try {
            const response = await backendApi.get(`/integrations/ticketmaster_event.php?id=${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Ticketmaster Detail Error:', error);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export default backendApi;
