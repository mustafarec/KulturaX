import { apiClient, handleApiError } from './client';

export const messageService = {
    send: async (receiverId: number, content: string, clientId?: string) => {
        try {
            const response = await apiClient.post('/messages/send.php', {
                receiver_id: receiverId,
                content,
                client_id: clientId
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getMessages: async (userId: number, otherUserId: number, page: number = 1, limit: number = 50) => {
        try {
            const response = await apiClient.get(`/messages/get.php?user_id=${userId}&other_user_id=${otherUserId}&page=${page}&limit=${limit}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getInbox: async (type: 'inbox' | 'requests' = 'inbox') => {
        try {
            const response = await apiClient.get(`/messages/inbox.php?type=${type}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getUnreadCount: async (userId: number) => {
        try {
            const response = await apiClient.get(`/messages/get_unread_count.php?user_id=${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    markMessagesRead: async (userId: number, otherUserId: number) => {
        try {
            const response = await apiClient.post('/messages/mark_read.php', { user_id: userId, other_user_id: otherUserId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    acceptRequest: async (userId: number, partnerId: number) => {
        try {
            const response = await apiClient.post('/messages/accept_request.php', { user_id: userId, partner_id: partnerId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    declineRequest: async (userId: number, partnerId: number) => {
        try {
            const response = await apiClient.post('/messages/decline_request.php', { user_id: userId, partner_id: partnerId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    deleteConversation: async (userId: number, partnerId: number) => {
        try {
            const response = await apiClient.post('/messages/delete_thread.php', { user_id: userId, partner_id: partnerId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    setTyping: async (receiverId: number) => {
        try {
            const response = await apiClient.post('/messages/set_typing.php', { receiver_id: receiverId });
            return response.data;
        } catch (error: any) {
            console.log('Set typing failed', error);
        }
    },

    getTyping: async (otherUserId: number) => {
        try {
            const response = await apiClient.get(`/messages/get_typing.php?other_user_id=${otherUserId}`);
            return response.data;
        } catch (error: any) {
            return { is_typing: false };
        }
    },

    addReaction: async (messageId: number, emoji: string) => {
        try {
            const response = await apiClient.post('/messages/add_reaction.php', { message_id: messageId, emoji });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    removeReaction: async (messageId: number) => {
        try {
            const response = await apiClient.post('/messages/remove_reaction.php', { message_id: messageId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    editMessage: async (messageId: number, content: string) => {
        try {
            const response = await apiClient.post('/messages/edit.php', { message_id: messageId, content });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    unsendMessage: async (messageId: number) => {
        try {
            const response = await apiClient.post('/messages/unsend.php', { message_id: messageId });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    sendWithReply: async (receiverId: number, content: string, replyToId?: number, clientId?: string) => {
        try {
            const response = await apiClient.post('/messages/send.php', {
                receiver_id: receiverId,
                content,
                reply_to_id: replyToId,
                client_id: clientId
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    }
};
