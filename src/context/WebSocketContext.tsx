/**
 * WebSocket Context
 * 
 * Provides global WebSocket state and connection management.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import webSocketService from '../services/WebSocketService';
import { useAuth } from './AuthContext';
import Toast from 'react-native-toast-message';

// WebSocket server URL - Shared hosting'de çalışmaz, VPS gerektirir
// VPS varsa: 'ws://YOUR_SERVER_IP:8080' şeklinde güncelle
// Boş bırakılırsa polling kullanılır (5 saniyede bir)
const WS_URL = 'ws://46.225.26.133:8080';

interface WebSocketContextType {
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    sendMessage: (receiverId: number, content: string, tempId: number, replyTo?: any) => void;
    sendTyping: (receiverId: number, isTyping: boolean) => void;
    sendReadReceipt: (senderId: number, messageIds: number[]) => void;
    onNewMessage: (handler: (message: any) => void) => () => void;
    onTyping: (handler: (data: { userId: number; isTyping: boolean }) => void) => () => void;
    onMessagesRead: (handler: (data: { readerId: number; messageIds: number[] }) => void) => () => void;
    onOnlineStatus: (handler: (data: { userId: number; isOnline: boolean }) => void) => () => void;
    onMessageSent: (handler: (data: { messageId: number; tempId: number; content: string; receiverId: number; createdAt: string }) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
        // Skip WebSocket if no URL configured (use polling instead)
        if (!WS_URL) {
            return;
        }

        // If already connected, just update state and return to avoid partial reconnection
        if (webSocketService.isConnected) {
            setIsConnected(true);
            return;
        }

        if (!user?.id) {
            return;
        }

        webSocketService.connect({
            url: WS_URL,
            userId: user.id,
            token: String(user.id),
            onConnect: () => {
                setIsConnected(true);
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onError: (error) => { } // Suppress logs
        });
    }, [user?.id]);

    const disconnect = useCallback(() => {
        webSocketService.disconnect();
        setIsConnected(false);
    }, []);

    // Connect when user is authenticated
    useEffect(() => {
        // Initial check: if already connected, sync state
        // The service might have stayed connected if context re-mounted
        if (webSocketService.isConnected) { // Assuming we add a getter for this in service, or we just trust the callbacks
            // Actually, the service doesn't expose isConnected property publicly in the interface yet, let's look at the class.
            // It has 'private ws: WebSocket | null'.
        }

        if (user?.id) {
            connect();
        }

        return () => {
            // Only disconnect if we are unmounting permanently? 
            // Actually, in App.tsx, this Provider wraps everything. It unmounts only on close.
            disconnect();
        };
    }, [user?.id, connect, disconnect]);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && user?.id) {
                connect();
            } else if (nextAppState === 'background') {
                // Keep connection alive in background for notifications
                // Or disconnect to save battery:
                // disconnect();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [user?.id, connect]);

    // Message handlers
    const sendMessage = useCallback((receiverId: number, content: string, tempId: number, replyTo?: any) => {
        webSocketService.sendMessage(receiverId, content, tempId, replyTo);
    }, []);

    const sendTyping = useCallback((receiverId: number, isTyping: boolean) => {
        webSocketService.sendTyping(receiverId, isTyping);
    }, []);

    const sendReadReceipt = useCallback((senderId: number, messageIds: number[]) => {
        webSocketService.sendReadReceipt(senderId, messageIds);
    }, []);

    // Event subscription helpers
    const onNewMessage = useCallback((handler: (message: any) => void) => {
        const wrappedHandler = (data: any) => {
            handler(data.message);
        };
        webSocketService.on('new_message', wrappedHandler);
        return () => webSocketService.off('new_message', wrappedHandler);
    }, []);

    const onTyping = useCallback((handler: (data: { userId: number; isTyping: boolean }) => void) => {
        webSocketService.on('typing', handler);
        return () => webSocketService.off('typing', handler);
    }, []);

    const onMessagesRead = useCallback((handler: (data: { readerId: number; messageIds: number[] }) => void) => {
        webSocketService.on('messages_read', handler);
        return () => webSocketService.off('messages_read', handler);
    }, []);

    const onOnlineStatus = useCallback((handler: (data: { userId: number; isOnline: boolean }) => void) => {
        webSocketService.on('online_status', handler);
        return () => webSocketService.off('online_status', handler);
    }, []);

    const onMessageSent = useCallback((handler: (data: { messageId: number; tempId: number; content: string; receiverId: number; createdAt: string }) => void) => {
        webSocketService.on('message_sent', handler);
        return () => webSocketService.off('message_sent', handler);
    }, []);

    const value: WebSocketContextType = useMemo(() => ({
        isConnected,
        connect,
        disconnect,
        sendMessage,
        sendTyping,
        sendReadReceipt,
        onNewMessage,
        onTyping,
        onMessagesRead,
        onOnlineStatus,
        onMessageSent
    }), [isConnected, connect, disconnect, sendMessage, sendTyping, sendReadReceipt, onNewMessage, onTyping, onMessagesRead, onOnlineStatus, onMessageSent]);

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export default WebSocketContext;
