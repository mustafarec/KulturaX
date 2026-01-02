import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { messageService } from '../services/backendApi';
import * as Notifications from 'expo-notifications';

interface MessageContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    markAsRead: (otherUserId: number) => Promise<void>;
    currentChatUserId: number | null;
    setCurrentChatUserId: (userId: number | null) => void;
    dismissNotifications: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentChatUserId, setCurrentChatUserId] = useState<number | null>(null);
    const { user } = useAuth();
    const userId = user?.id;

    const refreshUnreadCount = useCallback(async () => {
        if (!userId) {
            setUnreadCount(0);
            return;
        }
        try {
            const data = await messageService.getUnreadCount(userId);
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    }, [userId]);

    const markAsRead = useCallback(async (otherUserId: number) => {
        if (!userId) return;
        try {
            await messageService.markMessagesRead(userId, otherUserId);
            // Don't await this to keep UI responsive
            refreshUnreadCount();
        } catch (error) {
            console.error('Failed to mark messages as read', error);
        }
    }, [userId, refreshUnreadCount]);

    // Dismiss all notifications from status bar
    const dismissNotifications = useCallback(async () => {
        try {
            await Notifications.dismissAllNotificationsAsync();
        } catch (error) {
            console.error('Failed to dismiss notifications', error);
        }
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, 5000); // Sync with inbox refresh
        return () => clearInterval(interval);
    }, [userId, refreshUnreadCount]);

    const value = useMemo(() => ({
        unreadCount,
        refreshUnreadCount,
        markAsRead,
        currentChatUserId,
        setCurrentChatUserId,
        dismissNotifications
    }), [unreadCount, refreshUnreadCount, markAsRead, currentChatUserId, setCurrentChatUserId, dismissNotifications]);

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};

export const useMessage = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessage must be used within a MessageProvider');
    }
    return context;
};
