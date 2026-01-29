import { useState, useCallback } from 'react';
import { Clipboard } from 'react-native';
import { messageService } from '../../services/api';
import webSocketService from '../../services/WebSocketService';
import Toast from 'react-native-toast-message';

interface Message {
    id: number;
    _internalId?: string; // Stable ID for React keys to prevent re-mounting
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    is_read?: number | boolean;
    reactions?: { user_id: number; emoji: string; username: string }[];
    reply_to?: { id: number; username: string; content: string } | null;
}

interface UseMessageActionsOptions {
    otherUserId: number;
    fetchMessages: () => Promise<void>;
    addOptimisticMessage: (message: Message) => void;
    removeOptimisticMessage: (tempId: number) => void;
    updateOptimisticMessage: (tempId: number, serverId: number, serverCreatedAt: string) => void;
    userId: number | undefined;
    chatUsername: string;
}

export const useMessageActions = ({
    otherUserId,
    fetchMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
    updateOptimisticMessage,
    userId,
    chatUsername
}: UseMessageActionsOptions) => {
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<{ id: number; content: string; username: string } | null>(null);
    const [newMessageId, setNewMessageId] = useState<number | null>(null);

    // Context menu state
    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
    const [selectedMessageContent, setSelectedMessageContent] = useState<string>('');
    const [selectedMessageIsOwn, setSelectedMessageIsOwn] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);

    const handleSend = useCallback(async (scrollToBottom: () => void) => {
        if (!inputText.trim() || !userId || sending) {
            console.log('[handleSend] Early exit:', { text: inputText, userId, sending });
            return;
        }

        const messageContent = inputText.trim();
        const tempId = Date.now();
        // Generate a unique client ID for sync
        const clientId = `msg_${tempId}_${Math.random().toString(36).substr(2, 9)}`;

        // Optimistic UI
        const optimisticMessage: Message = {
            id: tempId,
            _internalId: clientId, // Use this as stable ID
            sender_id: userId,
            receiver_id: otherUserId,
            content: messageContent,
            created_at: (() => {
                const now = new Date();
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            })(),
        };

        addOptimisticMessage(optimisticMessage);
        setNewMessageId(tempId);
        setInputText('');



        setSending(true);
        try {
            let response;
            if (editingMessageId) {
                await messageService.editMessage(editingMessageId, messageContent);
                setEditingMessageId(null);
                Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Mesaj başarıyla düzenlendi.' });
                await fetchMessages(); // For edits, we need to refresh
            } else if (replyToMessage) {
                response = await messageService.sendWithReply(otherUserId, messageContent, replyToMessage.id, clientId);
                setReplyToMessage(null);
                // Update optimistic message with server data
                if (response?.id && response?.created_at) {
                    updateOptimisticMessage(tempId, response.id, response.created_at);

                    // Broadcast via WebSocket for Real-time Delivery & Inbox Update
                    webSocketService.sendMessage(
                        otherUserId,
                        messageContent,
                        tempId,
                        undefined,
                        response.id // Pass the Server ID
                    );
                }
            } else {
                response = await messageService.send(otherUserId, messageContent, clientId);
                // Update optimistic message with server data
                if (response?.id && response?.created_at) {
                    updateOptimisticMessage(tempId, response.id, response.created_at);

                    console.log('[handleSend] HTTP Success, Sending WS...'); // DEBUG
                    // Broadcast via WebSocket for Real-time Delivery & Inbox Update
                    webSocketService.sendMessage(
                        otherUserId,
                        messageContent,
                        tempId,
                        undefined,
                        response.id // Pass the Server ID
                    );
                } else {
                    console.warn('[handleSend] HTTP Response Invalid:', response);
                }
            }

            setNewMessageId(null);
        } catch (error) {
            console.error('Failed to send message:', error);
            removeOptimisticMessage(tempId);
            setNewMessageId(null);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Mesaj gönderilemedi.' });
        } finally {
            setSending(false);
        }
    }, [inputText, userId, sending, editingMessageId, replyToMessage, otherUserId, fetchMessages, addOptimisticMessage, removeOptimisticMessage, updateOptimisticMessage]);

    const handleLongPress = useCallback((messageId: number, content: string, isOwn: boolean) => {
        setSelectedMessageId(messageId);
        setSelectedMessageContent(content);
        setSelectedMessageIsOwn(isOwn);
        setShowContextMenu(true);
    }, []);

    const handleEmojiSelect = useCallback(async (emoji: string) => {
        if (!selectedMessageId) return;

        try {
            await messageService.addReaction(selectedMessageId, emoji);
            await fetchMessages();
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }

        closeContextMenu();
    }, [selectedMessageId, fetchMessages]);

    const handleCopy = useCallback(() => {
        Clipboard.setString(selectedMessageContent);
        Toast.show({ type: 'success', text1: 'Kopyalandı', text2: 'Mesaj panoya kopyalandı.', visibilityTime: 2000 });
        closeContextMenu();
    }, [selectedMessageContent]);

    const handleUnsend = useCallback(async () => {
        if (!selectedMessageId) return;

        try {
            await messageService.unsendMessage(selectedMessageId);
            Toast.show({ type: 'success', text1: 'Geri Alındı', text2: 'Mesaj başarıyla geri alındı.', visibilityTime: 2000 });
            await fetchMessages();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'Mesaj geri alınamadı.' });
        }
        closeContextMenu();
    }, [selectedMessageId, fetchMessages]);

    const handleEdit = useCallback(() => {
        if (!selectedMessageId) return;

        setEditingMessageId(selectedMessageId);
        setInputText(selectedMessageContent);
        closeContextMenu();

        Toast.show({ type: 'info', text1: 'Mesaj Düzenleniyor', text2: 'Mesajı düzenleyip göndere basarak güncelleyin.', visibilityTime: 2000 });
    }, [selectedMessageId, selectedMessageContent]);

    const handleReply = useCallback(() => {
        if (!selectedMessageId) return;

        setReplyToMessage({
            id: selectedMessageId,
            content: selectedMessageContent,
            username: selectedMessageIsOwn ? 'Siz' : chatUsername
        });

        closeContextMenu();
    }, [selectedMessageId, selectedMessageContent, selectedMessageIsOwn, chatUsername]);

    const handleReplyFromSwipe = useCallback((id: number, content: string, username: string) => {
        setReplyToMessage({ id, content, username });
    }, []);

    const closeContextMenu = useCallback(() => {
        setShowContextMenu(false);
        setSelectedMessageId(null);
        setSelectedMessageContent('');
    }, []);

    const cancelEditOrReply = useCallback(() => {
        setReplyToMessage(null);
        setEditingMessageId(null);
        setInputText('');
    }, []);

    return {
        // Input state
        inputText,
        setInputText,
        sending,
        newMessageId,

        // Edit/Reply state
        editingMessageId,
        replyToMessage,

        // Context menu state
        selectedMessageId,
        selectedMessageContent,
        selectedMessageIsOwn,
        showContextMenu,

        // Actions
        handleSend,
        handleLongPress,
        handleEmojiSelect,
        handleCopy,
        handleUnsend,
        handleEdit,
        handleReply,
        handleReplyFromSwipe,
        closeContextMenu,
        cancelEditOrReply
    };
};
