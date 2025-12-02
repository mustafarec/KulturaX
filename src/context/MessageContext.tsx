import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { messageService } from '../services/backendApi';

interface MessageContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    markAsRead: (otherUserId: number) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    const refreshUnreadCount = async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        try {
            const data = await messageService.getUnreadCount(user.id);
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    const markAsRead = async (otherUserId: number) => {
        if (!user) return;
        try {
            await messageService.markMessagesRead(user.id, otherUserId);
            // Optimistically decrease count or refresh
            refreshUnreadCount();
        } catch (error) {
            console.error('Failed to mark messages as read', error);
        }
    };

    useEffect(() => {
        refreshUnreadCount();

        // Poll every 10 seconds
        const interval = setInterval(refreshUnreadCount, 10000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <MessageContext.Provider value={{ unreadCount, refreshUnreadCount, markAsRead }}>
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
