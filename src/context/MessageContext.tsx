import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { messageService } from '../services/backendApi';
import * as Notifications from 'expo-notifications';

// Polling interval - 15s for shared hosting (was 5s)
const POLLING_INTERVAL = 15000;

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

    // Track app state for smart polling
    const appState = useRef(AppState.currentState);
    const [isActive, setIsActive] = useState(true);

    // Listen to app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // Only poll when app is active
            setIsActive(nextAppState === 'active');
            appState.current = nextAppState;
        });
        return () => subscription?.remove();
    }, []);

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

    // OPTIMIZED: Smart polling
    // - Only polls when app is active
    // - Pauses when user is in a chat (they'll see messages via WebSocket/chat hook)
    // - Uses 15s interval instead of 5s to reduce server load
    useEffect(() => {
        refreshUnreadCount();

        // Skip polling if app is inactive or user is in a chat
        if (!isActive || currentChatUserId) {
            return;
        }

        const interval = setInterval(refreshUnreadCount, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [userId, refreshUnreadCount, isActive, currentChatUserId]);

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
