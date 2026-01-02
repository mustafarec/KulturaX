#!/bin/bash
# KültüraX WebSocket Server Startup Script
# 
# Usage:
#   ./start_server.sh        - Start server
#   ./start_server.sh stop   - Stop server
#   ./start_server.sh status - Check status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/websocket.pid"
LOG_FILE="$SCRIPT_DIR/websocket.log"

start_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Server is already running (PID: $PID)"
            exit 1
        fi
    fi
    
    echo "Starting WebSocket server..."
    cd "$SCRIPT_DIR"
    nohup php server.php > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Server started (PID: $!)"
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Stopping server (PID: $PID)..."
            kill $PID
            rm "$PID_FILE"
            echo "Server stopped"
        else
            echo "Server not running"
            rm "$PID_FILE"
        fi
    else
        echo "No PID file found"
    fi
}

status_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Server is running (PID: $PID)"
        else
            echo "Server is not running (stale PID file)"
        fi
    else
        echo "Server is not running"
    fi
}

case "$1" in
    stop)
        stop_server
        ;;
    status)
        status_server
        ;;
    *)
        start_server
        ;;
esac
