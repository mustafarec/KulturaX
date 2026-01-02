/**
 * WebSocket Service for KültüraX
 * 
 * Handles WebSocket connection, reconnection, and message handling.
 */

type MessageHandler = (data: any) => void;

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
    private messageHandlers: Map<string, MessageHandler[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private isConnecting = false;

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
                console.log('WebSocket connected');
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
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnecting = false;
                this.stopHeartbeat();
                config.onDisconnect?.();
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
                config.onError?.(error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
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
    sendMessage(receiverId: number, content: string, tempId: number, replyTo?: { id: number; username: string; content: string }): void {
        this.send({
            type: 'message',
            receiverId,
            content,
            tempId,
            replyTo
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
     */
    on(type: string, handler: MessageHandler): void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)!.push(handler);
    }

    /**
     * Unsubscribe from message type
     */
    off(type: string, handler: MessageHandler): void {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

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
            console.log('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        setTimeout(() => {
            if (this.config) {
                this.connect(this.config);
            }
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, 30000); // Every 30 seconds
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
