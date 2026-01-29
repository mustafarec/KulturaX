import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { messageService } from '../services/backendApi';
import * as Notifications from 'expo-notifications';
import { useWebSocket } from './WebSocketContext';

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

    const refreshUnreadCount = useCallback(async () => {
        if (!userId) {
            setUnreadCount(0);
            return;
        }
        try {
            const data = await messageService.getUnreadCount(userId);
            console.log('[MessageContext] Fetched unread count:', data);
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    }, [userId]);

    const markAsRead = useCallback(async (otherUserId: number) => {
        if (!userId) return;
        try {
            await messageService.markMessagesRead(userId, otherUserId);
            // Wait for refresh to ensure UI is in sync immediately
            await refreshUnreadCount();
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

    // Listen to app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // Refresh unread count when app becomes active
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('[MessageContext] App became active, refreshing unread count...');
                refreshUnreadCount();
            }

            setIsActive(nextAppState === 'active');
            appState.current = nextAppState;
        });
        return () => subscription?.remove();
    }, [refreshUnreadCount]);

    // WebSocket Listener for Real-time Unread Count
    useEffect(() => {
        refreshUnreadCount();
    }, [userId, refreshUnreadCount]);

    // WebSocket Listener for Real-time Unread Count
    const { onNewMessage } = useWebSocket();

    useEffect(() => {
        const unsubscribe = onNewMessage((message: any) => {
            console.log('[MessageContext] WS New Message:', message); // DEBUG LOG
            // If we are NOT currently chatting with this user, increment unread count
            const senderId = message.sender_id;
            console.log('[MessageContext] CurrentChatUser:', currentChatUserId, 'Sender:', senderId); // DEBUG LOG

            if (currentChatUserId !== senderId) {
                setUnreadCount(prev => {
                    console.log('[MessageContext] Incrementing count from', prev, 'to', prev + 1);
                    return prev + 1;
                });
            } else {
                console.log('[MessageContext] Skipped increment (User currently active)');
            }
        });
        return unsubscribe;
    }, [onNewMessage, currentChatUserId]);

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
