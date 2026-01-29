/**
 * WebSocket Service for KültüraX
 * 
 * Handles WebSocket connection, reconnection, and message handling.
 */

import Toast from 'react-native-toast-message';

type MessageHandler = (data: any) => void;

// WebSocket Constants
const WS_RECONNECT_MAX_ATTEMPTS = 5;
const WS_RECONNECT_INITIAL_DELAY = 1000; // 1 second
const WS_RECONNECT_MAX_DELAY = 30000; // 30 seconds
const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface WebSocketConfig {
    url: string;
    userId: number;
    token: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private config: WebSocketConfig | null = null;
    // OPTIMIZED: Set instead of Array for O(1) handler removal
    private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = WS_RECONNECT_MAX_ATTEMPTS;
    private reconnectDelay = WS_RECONNECT_INITIAL_DELAY;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private isConnecting = false;

    public get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * Connect to WebSocket server
     */
    connect(config: WebSocketConfig): void {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
            console.log('WebSocket already connected or connecting');
            return;
        }

        this.config = config;
        this.isConnecting = true;

        try {
            this.ws = new WebSocket(config.url);

            this.ws.onopen = () => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;

                // Authenticate
                this.send({
                    type: 'auth',
                    userId: config.userId,
                    token: config.token
                });

                // Start heartbeat
                this.startHeartbeat();

                config.onConnect?.();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    // Fail silently
                }
            };

            this.ws.onclose = () => {
                this.isConnecting = false;
                this.stopHeartbeat();
                config.onDisconnect?.();
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                this.isConnecting = false;
                config.onError?.(error);
            };
        } catch (error) {
            this.isConnecting = false;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        this.stopHeartbeat();
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Send message to server
     */
    send(data: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, message not sent:', data);
        }
    }

    /**
     * Send chat message
     */
    sendMessage(receiverId: number, content: string, tempId: number, replyTo?: { id: number; username: string; content: string }, messageId?: number): void {
        this.send({
            type: 'message',
            receiverId,
            content,
            tempId,
            replyTo,
            messageId // Send Server ID if available
        });
    }

    /**
     * Send typing indicator
     */
    sendTyping(receiverId: number, isTyping: boolean): void {
        this.send({
            type: 'typing',
            receiverId,
            isTyping
        });
    }

    /**
     * Send read receipt
     */
    sendReadReceipt(senderId: number, messageIds: number[]): void {
        this.send({
            type: 'read',
            senderId,
            messageIds
        });
    }

    /**
     * Subscribe to message type
     * OPTIMIZED: Using Set for O(1) add/remove
     */
    on(type: string, handler: MessageHandler): void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);
    }

    /**
     * Unsubscribe from message type
     * OPTIMIZED: Set.delete() is O(1) vs Array.indexOf() which is O(n)
     */
    off(type: string, handler: MessageHandler): void {
        this.messageHandlers.get(type)?.delete(handler);
    }

    /**
     * Check if connected
     */
    // Removed duplicate isConnected method

    /**
     * Handle incoming message
     */
    private handleMessage(data: any): void {
        const handlers = this.messageHandlers.get(data.type);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }

        // Also call 'all' handlers
        const allHandlers = this.messageHandlers.get('all');
        if (allHandlers) {
            allHandlers.forEach(handler => handler(data));
        }
    }

    /**
     * Attempt to reconnect
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.config) {
            return;
        }

        this.reconnectAttempts++;

        setTimeout(() => {
            if (this.config) {
                this.connect(this.config);
            }
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, WS_RECONNECT_MAX_DELAY);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, WS_HEARTBEAT_INTERVAL);
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}

// Singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
