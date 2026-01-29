import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/backendApi';

interface NotificationContextType {
    unreadCount: number;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: () => void; // Simple way to clear badge locally
    decrementUnreadCount: () => void;
    setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    fetchUnreadCount: async () => { },
    markAsRead: () => { },
    decrementUnreadCount: () => { },
    setUnreadCount: () => { },
});

/**
 * Sync iOS app badge with count
 */
const syncBadgeCount = async (count: number) => {
    if (Platform.OS === 'ios') {
        try {
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.error('Failed to set badge count:', error);
        }
    }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCountState] = useState(0);
    const { user } = useAuth();

    // Wrapper to sync badge when count changes
    const setUnreadCount = useCallback((count: number) => {
        setUnreadCountState(count);
        syncBadgeCount(count);
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (user) {
            try {
                const data = await notificationService.getUnreadCount(user.id);
                const count = data.count || 0;
                setUnreadCountState(count);
                syncBadgeCount(count);
            } catch (error) {
                console.error('Failed to fetch unread notifications count', error);
            }
        } else {
            setUnreadCountState(0);
            syncBadgeCount(0);
        }
    }, [user]);

    const markAsRead = useCallback(() => {
        setUnreadCountState(0);
        syncBadgeCount(0);
    }, []);

    // Initial fetch only
    useEffect(() => {
        fetchUnreadCount();
        // Polling removed to rely on potential future WS implementation or manual refresh
    }, [fetchUnreadCount]);

    const decrementUnreadCount = useCallback(() => {
        setUnreadCountState(prev => {
            const newCount = Math.max(0, prev - 1);
            syncBadgeCount(newCount);
            return newCount;
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, markAsRead, decrementUnreadCount, setUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
