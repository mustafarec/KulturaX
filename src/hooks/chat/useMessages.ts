import { useState, useEffect, useCallback } from 'react';
import { messageService, userService } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import Toast from 'react-native-toast-message';

interface Message {
    id: number;
    _internalId?: string; // Stable ID for React keys to prevent re-mounting
    client_id?: string; // ID from backend if available
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    is_read?: number | boolean;
    reactions?: { user_id: number; emoji: string; username: string }[];
    reply_to?: { id: number; username: string; content: string } | null;
}

interface ChatUser {
    username: string;
    avatar_url?: string;
}

interface UseMessagesOptions {
    userId: number | undefined;
    otherUserId: number;
    initialUsername?: string;
    initialAvatarUrl?: string;
    markAsRead: (userId: number) => void;
}

export const useMessages = ({
    userId,
    otherUserId,
    initialUsername,
    initialAvatarUrl,
    markAsRead
}: UseMessagesOptions) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [chatUser, setChatUser] = useState<ChatUser | null>(
        initialUsername ? { username: initialUsername, avatar_url: initialAvatarUrl } : null
    );

    // WebSocket integration
    const { isConnected, onNewMessage, onMessagesRead, onMessageSent } = useWebSocket();

    // Helper to generate stable IDs
    const generateInternalId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    const fetchMessages = useCallback(async (nextPage: number = 1) => {
        if (!userId) return;

        // Prevent duplicate calls
        if (nextPage > 1 && isMoreLoading) return;

        // Only show loading indicator if we have no messages (initial load)
        // If we are refreshing (page 1) but have data, do it silently (background)
        if (nextPage === 1) {
            setMessages(prev => {
                if (prev.length === 0) setIsLoading(true);
                return prev;
            });
        }
        else {
            setIsMoreLoading(true);
        }

        try {
            const data = await messageService.getMessages(userId, otherUserId, nextPage);
            const serverMessages: Message[] = Array.isArray(data) ? data : [];

            if (serverMessages.length < 50) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setMessages(prev => {
                // If refreshing (page 1), we start fresh but keep pending messages
                const currentMessages = nextPage === 1 ? [] : prev;
                const prevMap = new Map(currentMessages.map(m => [m.id, m]));
                const pendingMessages = prev.filter(m => m.id > 9999999999); // Always keep pending from previous state

                // Process server messages
                const processedServerMessages = serverMessages.map(msg => {
                    const existing = prevMap.get(msg.id);
                    // If server message has client_id, use it as _internalId (perfect sync)
                    // If not, use existing _internalId if available, or generate a new one
                    return {
                        ...msg,
                        _internalId: msg.client_id || existing?._internalId || generateInternalId()
                    };
                });

                // If loading next page, we just append older messages to the end
                // We assume backend returns DESC (Newest first)
                // So Page 1: [Newest...Mid], Page 2: [Mid...Oldest]
                // List: [...Page1, ...Page2]

                let newAllMessages = nextPage === 1
                    ? processedServerMessages
                    : [...currentMessages, ...processedServerMessages];

                // If no pending messages, just return processed server messages
                if (pendingMessages.length === 0) {
                    return newAllMessages;
                }

                // Filtering logic for pending messages
                const confirmedPendingIds = new Set<number>();
                const consumedServerIds = new Set<number>();

                const sortedPendingMessages = [...pendingMessages].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                for (const pending of sortedPendingMessages) {
                    const match = newAllMessages.find(s => {
                        if (consumedServerIds.has(s.id)) return false;

                        // 1. Exact Match via client_id / _internalId
                        if (s.client_id && pending._internalId && s.client_id === pending._internalId) {
                            return true;
                        }

                        // 2. Legacy Match via content & time (only if no client_id mismatch)
                        if (!s.client_id) {
                            return s.sender_id === pending.sender_id &&
                                s.content === pending.content &&
                                Math.abs(new Date(s.created_at).getTime() - new Date(pending.created_at.replace(' ', 'T')).getTime()) < 60000;
                        }

                        return false;
                    });

                    if (match) {
                        confirmedPendingIds.add(pending.id);
                        consumedServerIds.add(match.id);

                        // Transfer stable ID (if not already set by client_id)
                        if (pending._internalId && !match.client_id) {
                            match._internalId = pending._internalId;
                        }
                    }
                }

                const unconfirmedPending = pendingMessages.filter(m => !confirmedPendingIds.has(m.id));

                // For pending messages, we want them at the START (Newest)
                // Since our list is [Newest ... Oldest]
                // We should unshift them
                // But wait, are they already included in 'prev' if we used it? 
                // We reconstructed newAllMessages from server responses. Pending are separate now.
                // Inverted List: Index 0 is Bottom (Newest).
                // So Pending messages (Newest) should be at Index 0.

                return [...unconfirmedPending, ...newAllMessages];
            });

            setPage(nextPage);

        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    }, [userId, otherUserId]);

    const loadMoreMessages = useCallback(() => {
        if (!isLoading && !isMoreLoading && hasMore) {
            fetchMessages(page + 1);
        }
    }, [isLoading, isMoreLoading, hasMore, page, fetchMessages]);

    const fetchUserProfile = useCallback(async () => {
        try {
            const profile = await userService.getUserProfile(otherUserId);
            if (profile) {
                setChatUser({ username: profile.username, avatar_url: profile.avatar_url });
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            if (!chatUser) {
                setChatUser({ username: 'Kullanıcı', avatar_url: undefined });
            }
        }
    }, [otherUserId]);

    // Initial fetch
    useEffect(() => {
        fetchMessages(1);
        fetchUserProfile();
        markAsRead(otherUserId);
    }, [userId, otherUserId, fetchMessages, fetchUserProfile, markAsRead]);

    // WebSocket: Listen for new messages
    useEffect(() => {
        if (!isConnected) {
            // Fallback to polling if WebSocket is not connected (1 second)
            const interval = setInterval(() => {
                fetchMessages(1);
                markAsRead(otherUserId);
            }, 5000);
            return () => clearInterval(interval);
        }

        // Subscribe to new messages via WebSocket
        const unsubscribeMessage = onNewMessage((message: Message) => {
            console.log('[useMessages] WS Received Raw:', message);

            const msgSenderId = Number(message.sender_id);
            const msgReceiverId = Number(message.receiver_id);
            const currentUserId = Number(userId);
            const chatPartnerId = Number(otherUserId);
            const msgId = Number(message.id);

            // Validations
            const isRelevant =
                (msgSenderId === chatPartnerId && msgReceiverId === currentUserId) ||
                (msgSenderId === currentUserId && msgReceiverId === chatPartnerId);

            if (!isRelevant) {
                console.log('[useMessages] Ignored Irrelevant Message:', msgId);
                return;
            }

            setMessages(prev => {
                // 1. Deduplication (Simple)
                if (prev.some(m => Number(m.id) === msgId)) {
                    console.log('[useMessages] Duplicate ignored:', msgId);
                    return prev;
                }

                console.log('[useMessages] Appending new message:', msgId);

                // 2. Prepare new message
                // We use generateInternalId() to ensure React treats it as a fresh item if needed, 
                // but really unique "id" from server is enough for key if used correctly.
                const newMessage = {
                    ...message,
                    _internalId: generateInternalId()
                };

                // 3. Append to START (because we use inverted list)
                // If the list is inverted, index 0 is the NEWEST message.
                return [newMessage, ...prev];
            });

            // Mark as read immediately if valid
            if (msgSenderId === chatPartnerId) {
                markAsRead(chatPartnerId);
            }
        });

        // Subscribe to read receipts
        const unsubscribeRead = onMessagesRead((data) => {
            if (Number(data.readerId) === Number(otherUserId)) {
                // Update message read status
                setMessages(prev => prev.map(msg => {
                    if (data.messageIds.includes(msg.id)) {
                        return { ...msg, is_read: 1 };
                    }
                    return msg;
                }));
            }
        });

        // Subscribe to message sent ack (Update Optimistic Message)
        const unsubscribeSent = onMessageSent((data) => {
            console.log('[useMessages] Message Sent Ack:', data);
            if (data.tempId && data.messageId) {
                updateOptimisticMessage(data.tempId, data.messageId, data.createdAt);
            }
        });

        return () => {
            unsubscribeMessage();
            unsubscribeRead();
            unsubscribeSent();
        };
    }, [isConnected, userId, otherUserId, onNewMessage, onMessagesRead, onMessageSent, fetchMessages, markAsRead]);

    const addOptimisticMessage = useCallback((message: Message) => {
        // Ensure optimistic message has an _internalId
        const messageWithStableId = {
            ...message,
            _internalId: message._internalId || generateInternalId()
        };
        setMessages(prev => [messageWithStableId, ...prev]);
    }, []);

    const removeOptimisticMessage = useCallback((tempId: number) => {
        setMessages(prev => prev.filter(m => m.id !== tempId));
    }, []);

    // Update optimistic message with server response (id and created_at)
    // IMPORTANT: _internalId persists, so React doesn't unmount the component
    const updateOptimisticMessage = useCallback((tempId: number, serverId: number, serverCreatedAt: string) => {
        setMessages(prev => prev.map(m =>
            m.id === tempId
                ? { ...m, id: serverId, created_at: serverCreatedAt }
                : m
        ));
    }, []);

    return {
        messages,
        setMessages,
        isLoading,
        chatUser,
        fetchMessages,
        addOptimisticMessage,
        removeOptimisticMessage,
        updateOptimisticMessage,
        loadMoreMessages,
        hasMore,
        isMoreLoading
    };
};

export type { Message, ChatUser };
