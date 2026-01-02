import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    const fetchUnreadCount = useCallback(async () => {
        if (user) {
            try {
                const data = await notificationService.getUnreadCount(user.id);
                setUnreadCount(data.count);
            } catch (error) {
                console.error('Failed to fetch unread notifications count', error);
            }
        } else {
            setUnreadCount(0);
        }
    }, [user]);

    const markAsRead = useCallback(() => {
        // Optimistically clear the count. 
        // Actual marking as read on server should happen when viewing the list.
        // But for the badge, we might want to keep it until the user actually sees them.
        // For now, let's assume visiting the screen triggers a fetch or we manually clear it.
        // If we want to clear it only when "seen", we might not need this method exposed 
        // if the screen handles the "mark read" API call and then we refetch.
        // But let's keep it for flexibility.
        setUnreadCount(0);
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchUnreadCount();

        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const decrementUnreadCount = useCallback(() => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    return (
        <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, markAsRead, decrementUnreadCount, setUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
