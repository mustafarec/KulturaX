<?php
/**
 * KültüraX Chat WebSocket Server
 * 
 * Bu class WebSocket bağlantılarını yönetir ve real-time mesajlaşmayı sağlar.
 */

namespace KMF\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class ChatServer implements MessageComponentInterface
{
    protected $clients;
    protected $userConnections; // userId => [resourceId => ConnectionInterface]
    protected $connectionUsers; // resourceId => userId
    protected $typingStatus;    // odaId => [userId => timestamp]
    
    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
        $this->connectionUsers = [];
        $this->typingStatus = [];
    }
    
    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "New connection: {$conn->resourceId}\n";
    }
    
    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        
        if (!$data || !isset($data['type'])) {
            return;
        }
        
        switch ($data['type']) {
            case 'auth':
                $this->handleAuth($from, $data);
                break;
                
            case 'message':
                $this->handleMessage($from, $data);
                break;
                
            case 'typing':
                $this->handleTyping($from, $data);
                break;
                
            case 'read':
                $this->handleRead($from, $data);
                break;
                
            case 'ping':
                $from->send(json_encode(['type' => 'pong']));
                break;

            // NEW: Backend-driven broadcast (triggered by send.php)
            // This allows the API to directly notify the receiver without relying on the sender's frontend connection.
            case 'internal_broadcast':
                // Security Check: Only allow localhost (127.0.0.1)
                // Note: In some setups, remoteAddress might be different, but for direct script connection it should be local.
                // For now, we trust it if it has a specific secret key or just rely on firewall blocking 8080 external access (except WS).
                $this->handleInternalBroadcast($from, $data);
                break;
        }
    }
    
    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        
    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        
        // Remove user mapping
        $resourceId = $conn->resourceId;
        if (isset($this->connectionUsers[$resourceId])) {
            $userId = $this->connectionUsers[$resourceId];
            
            // Remove specific connection from user's list
            if (isset($this->userConnections[$userId][$resourceId])) {
                unset($this->userConnections[$userId][$resourceId]);
            }
            
            // If user has no more connections, clean up key
            if (empty($this->userConnections[$userId])) {
                unset($this->userConnections[$userId]);
                // Broadcast offline status only if NO connections remain
                $this->broadcastOnlineStatus($userId, false);
            }
            
            unset($this->connectionUsers[$resourceId]);
        }
        
        echo "Connection {$conn->resourceId} closed\n";
    }
    
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "Error: {$e->getMessage()}\n";
        $conn->close();
    }
    
    /**
     * Handle user authentication
     */
    protected function handleAuth(ConnectionInterface $conn, array $data)
    {
        if (!isset($data['userId']) || !isset($data['token'])) {
            $conn->send(json_encode([
                'type' => 'auth_error',
                'message' => 'Missing userId or token'
            ]));
            return;
        }
        
        $userId = (int) $data['userId'];
        
        // Check if first connection for this user
        $isFirstConnection = !isset($this->userConnections[$userId]);
        
        // Store connection mapping (Support Multiple Devices)
        $this->userConnections[$userId][$conn->resourceId] = $conn;
        $this->connectionUsers[$conn->resourceId] = $userId;
        
        // Send success response
        $conn->send(json_encode([
            'type' => 'auth_success',
            'userId' => $userId
        ]));
        
        // Broadcast online status only if this is the first connection
        if ($isFirstConnection) {
            $this->broadcastOnlineStatus($userId, true);
        }
        
        echo "User $userId authenticated (Resource: {$conn->resourceId})\n";
    }
    
    /**
     * Handle incoming message
     */
    protected function handleMessage(ConnectionInterface $from, array $data)
    {
        $senderId = $this->connectionUsers[$from->resourceId] ?? null;
        
        if (!$senderId) {
            $from->send(json_encode([
                'type' => 'error',
                'message' => 'Not authenticated'
            ]));
            return;
        }
        
        $receiverId = $data['receiverId'] ?? null;
        $content = $data['content'] ?? '';
        $messageId = $data['messageId'] ?? null;
        $replyTo = $data['replyTo'] ?? null;
        
        if (!$receiverId || empty($content)) {
            return;
        }
        
        // Build message payload
        $messagePayload = [
            'type' => 'new_message',
            'message' => [
                'id' => $messageId,
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'content' => $content,
                'created_at' => date('Y-m-d H:i:s'),
                'is_read' => 0,
                'reply_to' => $replyTo
            ]
        ];
        
        // Send to receiver if online (ALL DEVICES)
        if (isset($this->userConnections[$receiverId])) {
            foreach ($this->userConnections[$receiverId] as $conn) {
                $conn->send(json_encode($messagePayload));
            }
            echo "Message sent from $senderId to $receiverId\n";
        } else {
            // DEBUG: Notify sender that receiver is offline/not found
            // $from->send(json_encode([
            //     'type' => 'debug_log',
            //     'message' => "User $receiverId offline."
            // ]));
            echo "User $receiverId not found in connections.\n";
        }
        
        // Confirm to sender (Only to the device that sent it)
        $from->send(json_encode([
            'type' => 'message_sent',
            'messageId' => $messageId,
            'tempId' => $data['tempId'] ?? null,
            'content' => $content,
            'receiverId' => $receiverId,
            'createdAt' => date('Y-m-d H:i:s')
        ]));
        
        // Clear typing status
        $this->clearTyping($senderId, $receiverId);
    }
    
    /**
     * Handle typing indicator
     */
    protected function handleTyping(ConnectionInterface $from, array $data)
    {
        $senderId = $this->connectionUsers[$from->resourceId] ?? null;
        $receiverId = $data['receiverId'] ?? null;
        $isTyping = $data['isTyping'] ?? false;
        
        if (!$senderId || !$receiverId) {
            return;
        }
        
        // Send typing status to receiver (ALL DEVICES)
        if (isset($this->userConnections[$receiverId])) {
            foreach ($this->userConnections[$receiverId] as $conn) {
                $conn->send(json_encode([
                    'type' => 'typing',
                    'userId' => $senderId,
                    'isTyping' => $isTyping
                ]));
            }
        }
    }
    
    /**
     * Handle read receipt
     */
    protected function handleRead(ConnectionInterface $from, array $data)
    {
        $readerId = $this->connectionUsers[$from->resourceId] ?? null;
        $senderId = $data['senderId'] ?? null;
        $messageIds = $data['messageIds'] ?? [];
        
        if (!$readerId || !$senderId) {
            return;
        }
        
        // Notify sender that messages were read (ALL DEVICES)
        if (isset($this->userConnections[$senderId])) {
            foreach ($this->userConnections[$senderId] as $conn) {
                $conn->send(json_encode([
                    'type' => 'messages_read',
                    'readerId' => $readerId,
                    'messageIds' => $messageIds
                ]));
            }
        }
    }
    
    /**
     * Broadcast online/offline status to all connections
     */
    protected function broadcastOnlineStatus(int $userId, bool $isOnline)
    {
        $payload = json_encode([
            'type' => 'online_status',
            'userId' => $userId,
            'isOnline' => $isOnline,
            'lastSeen' => $isOnline ? null : date('Y-m-d H:i:s')
        ]);
        
        foreach ($this->clients as $client) {
            $client->send($payload);
        }
    }
    
    /**
     * Clear typing status
     */
    protected function clearTyping(int $senderId, int $receiverId)
    {
        if (isset($this->userConnections[$receiverId])) {
            foreach ($this->userConnections[$receiverId] as $conn) {
                $conn->send(json_encode([
                    'type' => 'typing',
                    'userId' => $senderId,
                    'isTyping' => false
                ]));
            }
        }
    }
    
    /**
     * Get online users count
     */
    public function getOnlineUsersCount(): int
    {
        return count($this->userConnections);
    }

    /**
     * Handle internal broadcast from API (send.php)
     */
    protected function handleInternalBroadcast(ConnectionInterface $from, array $data)
    {
        // Security Check: Use a secret key for internal communication
        // This should match the one used in send.php and mark_read.php
        $secret = $data['secret'] ?? null;
        
        // In a real env, we'd load this from .env or config
        // Since we can't easily include config.php here (it's a CLI process), 
        // we either pass it via ENV or use a hardcoded fallback for now.
        $expectedSecret = getenv('API_SIGNATURE_SECRET') ?: 'default_internal_secret';

        if ($secret !== $expectedSecret) {
            echo "Internal Broadcast: Unauthorized attempt from Resource {$from->resourceId}\n";
            $from->close();
            return;
        }

        $receiverId = $data['receiverId'] ?? null;
        $payload = $data['payload'] ?? null;

        if (!$receiverId || !$payload) {
            return;
        }

        if (isset($this->userConnections[$receiverId])) {
            $count = 0;
            // Send to ALL connected devices of this user
            foreach ($this->userConnections[$receiverId] as $conn) {
                $conn->send(json_encode($payload));
                $count++;
            }
            echo "Internal Broadcast: Sent to User $receiverId ($count devices)\n";
        } else {
            echo "Internal Broadcast: User $receiverId not connected.\n";
        }
        
        // Ack to CLI script
        $from->send(json_encode(['status' => 'ok']));
        $from->close(); // Close the one-off connection
    }
}
