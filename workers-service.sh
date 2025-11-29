#!/bin/bash

# EKO Workers Service Manager
# Start/stop workers as a background service

PROJECT_DIR="$HOME/Desktop/ekoleadgenerator/eko-lead-dashboard"
PID_FILE="/tmp/eko-workers.pid"
LOG_FILE="/tmp/eko-workers.log"

case "$1" in
    start)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            echo "✅ Workers already running (PID: $(cat $PID_FILE))"
            exit 0
        fi

        echo "🚀 Starting EKO workers..."
        cd "$PROJECT_DIR"
        
        # Start workers in background with nohup
        nohup npm run workers:dev > "$LOG_FILE" 2>&1 &
        WORKER_PID=$!
        
        # Save PID
        echo $WORKER_PID > "$PID_FILE"
        
        echo "✅ Workers started (PID: $WORKER_PID)"
        echo "📊 Logs: tail -f $LOG_FILE"
        echo "🛑 To stop: ./workers-service.sh stop"
        ;;
        
    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "⚠️  No workers running"
            exit 0
        fi
        
        WORKER_PID=$(cat "$PID_FILE")
        
        if kill -0 $WORKER_PID 2>/dev/null; then
            echo "🛑 Stopping workers (PID: $WORKER_PID)..."
            kill $WORKER_PID
            
            # Wait for graceful shutdown
            sleep 3
            
            # Force kill if still running
            if kill -0 $WORKER_PID 2>/dev/null; then
                kill -9 $WORKER_PID
            fi
            
            echo "✅ Workers stopped"
        else
            echo "⚠️  Workers not running (stale PID file)"
        fi
        
        rm -f "$PID_FILE"
        
        # Kill any remaining worker processes
        pkill -f "tsx.*start-workers" 2>/dev/null
        ;;
        
    restart)
        echo "🔄 Restarting workers..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    status)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            echo "✅ Workers running (PID: $(cat $PID_FILE))"
            echo "📊 Recent logs:"
            tail -10 "$LOG_FILE" 2>/dev/null
        else
            echo "❌ Workers not running"
        fi
        ;;
        
    logs)
        if [ -f "$LOG_FILE" ]; then
            echo "📊 Worker logs:"
            tail -f "$LOG_FILE"
        else
            echo "❌ No log file found"
        fi
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start workers in background"
        echo "  stop    - Stop workers"
        echo "  restart - Restart workers"
        echo "  status  - Check worker status"
        echo "  logs    - Follow worker logs"
        exit 1
        ;;
esac