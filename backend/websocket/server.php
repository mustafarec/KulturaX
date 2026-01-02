<?php
/**
 * KültüraX WebSocket Server Starter
 * 
 * Usage: php server.php
 * 
 * Server will listen on port 8080 for WebSocket connections.
 */

require __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use KMF\WebSocket\ChatServer;

$port = getenv('WS_PORT') ?: 8080;

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new ChatServer()
        )
    ),
    $port
);

echo "=================================\n";
echo "  KültüraX WebSocket Server\n";
echo "  Running on port $port\n";
echo "=================================\n";

$server->run();
