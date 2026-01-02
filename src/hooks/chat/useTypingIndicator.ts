import { useState, useEffect, useRef, useCallback } from 'react';
import { messageService } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';

interface UseTypingIndicatorOptions {
    otherUserId: number;
}

export const useTypingIndicator = ({ otherUserId }: UseTypingIndicatorOptions) => {
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // WebSocket integration
    const { isConnected, onTyping, sendTyping } = useWebSocket();

    // Listen for typing events
    useEffect(() => {
        if (!isConnected) {
            // Fallback to polling if WebSocket is not connected
            const checkTyping = async () => {
                try {
                    const result = await messageService.getTyping(otherUserId);
                    setIsTyping(result?.is_typing || false);
                } catch (error) {
                    console.error('Failed to check typing status:', error);
                    setIsTyping(false);
                }
            };

            checkTyping();
            const typingInterval = setInterval(checkTyping, 1000);
            return () => clearInterval(typingInterval);
        }

        // Subscribe to typing events via WebSocket
        const unsubscribe = onTyping((data) => {
            if (data.userId === otherUserId) {
                setIsTyping(data.isTyping);

                // Auto-clear typing after 3 seconds of no updates
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                if (data.isTyping) {
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 3000);
                }
            }
        });

        return () => {
            unsubscribe();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [isConnected, otherUserId, onTyping]);

    const lastSentRef = useRef<number>(0);

    // Send typing indicator (Throttled to once every 2.5s)
    const sendTypingIndicator = useCallback(() => {
        const now = Date.now();
        if (now - lastSentRef.current < 2500) return;

        lastSentRef.current = now;

        if (isConnected) {
            // Use WebSocket
            sendTyping(otherUserId, true);
        } else {
            // Fallback to HTTP
            messageService.setTyping(otherUserId);
        }
    }, [isConnected, otherUserId, sendTyping]);

    return {
        isTyping,
        sendTypingIndicator
    };
};
