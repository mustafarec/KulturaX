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
    protected $userConnections; // userId => ConnectionInterface
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
        }
    }
    
    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        
        // Remove user mapping
        $resourceId = $conn->resourceId;
        if (isset($this->connectionUsers[$resourceId])) {
            $userId = $this->connectionUsers[$resourceId];
            unset($this->userConnections[$userId]);
            unset($this->connectionUsers[$resourceId]);
            
            // Broadcast offline status
            $this->broadcastOnlineStatus($userId, false);
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
        
        // TODO: Validate token with database
        // For now, we trust the token
        
        // Store connection mapping
        $this->userConnections[$userId] = $conn;
        $this->connectionUsers[$conn->resourceId] = $userId;
        
        // Send success response
        $conn->send(json_encode([
            'type' => 'auth_success',
            'userId' => $userId
        ]));
        
        // Broadcast online status
        $this->broadcastOnlineStatus($userId, true);
        
        echo "User $userId authenticated\n";
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
        
        // Send to receiver if online
        if (isset($this->userConnections[$receiverId])) {
            $this->userConnections[$receiverId]->send(json_encode($messagePayload));
        }
        
        // Confirm to sender
        $from->send(json_encode([
            'type' => 'message_sent',
            'messageId' => $messageId,
            'tempId' => $data['tempId'] ?? null
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
        
        // Send typing status to receiver
        if (isset($this->userConnections[$receiverId])) {
            $this->userConnections[$receiverId]->send(json_encode([
                'type' => 'typing',
                'userId' => $senderId,
                'isTyping' => $isTyping
            ]));
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
        
        // Notify sender that messages were read
        if (isset($this->userConnections[$senderId])) {
            $this->userConnections[$senderId]->send(json_encode([
                'type' => 'messages_read',
                'readerId' => $readerId,
                'messageIds' => $messageIds
            ]));
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
            $this->userConnections[$receiverId]->send(json_encode([
                'type' => 'typing',
                'userId' => $senderId,
                'isTyping' => false
            ]));
        }
    }
    
    /**
     * Get online users count
     */
    public function getOnlineUsersCount(): int
    {
        return count($this->userConnections);
    }
}
