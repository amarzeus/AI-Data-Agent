#!/bin/bash

# AI Data Agent - Enhanced Startup Script
# This script starts both backend and frontend servers with network accessibility

echo "🤖 AI Data Agent - Starting Application"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :$1 >/dev/null 2>&1
    else
        netstat -an | grep :$1 >/dev/null 2>&1
    fi
}

# Function to find a free port starting from a preferred port
find_free_port() {
    local preferred_port=$1
    local port=$preferred_port
    while check_port $port; do
        port=$((port + 1))
    done
    echo $port
}

# Function to get local IP addresses
get_local_ips() {
    if command -v hostname >/dev/null 2>&1; then
        hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^(10\.|172\.|192\.168\.|169\.254\.)' | head -1
    fi
}

# Function to get network interfaces
get_network_info() {
    echo -e "${BLUE}🌐 Network Information:${NC}"
    echo "----------------------------------------"

    # Get primary local IP
    LOCAL_IP=$(get_local_ips)
    if [ -n "$LOCAL_IP" ]; then
        echo -e "📡 Local IP: ${GREEN}$LOCAL_IP${NC}"
    fi

    # Get all available IPs
    echo -e "📋 All Interfaces:"
    if command -v ip >/dev/null 2>&1; then
        ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print "   " $2}' | sed 's/\/.*//'
    elif command -v ifconfig >/dev/null 2>&1; then
        ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print "   " $2}'
    fi

    echo ""
}

# Check if setup has been completed
echo ""
echo -e "${BLUE}🔍 Checking setup...${NC}"

if [ ! -d "backend/venv" ]; then
    echo -e "${RED}❌ Backend virtual environment not found${NC}"
    echo "Please run the setup script first: ./setup.sh"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}❌ Frontend dependencies not installed${NC}"
    echo "Please run the setup script first: ./setup.sh"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Backend configuration not found${NC}"
    echo "Please run the setup script first: ./setup.sh"
    exit 1
fi

# Check if Google API key is configured
if ! grep -q "GOOGLE_API_KEY=AIza" backend/.env; then
    echo -e "${YELLOW}⚠️  Google Gemini API key not configured${NC}"
    echo "Please edit backend/.env and add your API key"
    echo "Get your API key from: https://aistudio.google.com/"
    echo ""
    echo "Example: GOOGLE_API_KEY=AIzaSyD_your_actual_api_key_here"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Setup verification completed${NC}"

# Find available ports
echo ""
echo -e "${BLUE}🔍 Finding available ports...${NC}"

BACKEND_PORT=$(find_free_port 8000)
FRONTEND_PORT=$(find_free_port 3000)

echo -e "${GREEN}✅ Backend will use port ${BACKEND_PORT}${NC}"
echo -e "${GREEN}✅ Frontend will use port ${FRONTEND_PORT}${NC}"

# Get network information
get_network_info

# Start backend
echo ""
echo -e "${PURPLE}🚀 Starting backend server...${NC}"

cd backend
source venv/bin/activate

export PORT=$BACKEND_PORT

# Start backend in background
python main.py &
BACKEND_PID=$!

echo -e "${GREEN}✅ Backend server started on port ${BACKEND_PORT} (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo ""
echo -e "${CYAN}⚛️ Starting frontend application...${NC}"

cd ../frontend

# Set environment variables for React to connect to backend
export REACT_APP_API_URL="http://localhost:$BACKEND_PORT"
export PORT=$FRONTEND_PORT

# Start frontend in background
npm start &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Frontend application started on port ${FRONTEND_PORT} (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}🎉 AI Data Agent is now running!${NC}"
echo ""
echo -e "${PURPLE}📱 Access your application:${NC}"

# Show local access
echo -e "${BLUE}🏠 Local Access:${NC}"
echo "   🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "   🔌 Backend API: http://localhost:$BACKEND_PORT"
echo "   📚 API Documentation: http://localhost:$BACKEND_PORT/docs"

# Show network access if available
if [ -n "$LOCAL_IP" ]; then
    echo ""
    echo -e "${BLUE}🌍 Network Access (from other devices):${NC}"
    echo "   🌐 Frontend: http://$LOCAL_IP:$FRONTEND_PORT"
    echo "   🔌 Backend API: http://$LOCAL_IP:$BACKEND_PORT"
    echo "   📚 API Documentation: http://$LOCAL_IP:$BACKEND_PORT/docs"
fi

echo ""
echo -e "${YELLOW}🔧 To stop the application:${NC}"
echo "   Press Ctrl+C"
echo "   Or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${GREEN}💡 Tips:${NC}"
echo "   - Upload Excel files using drag-and-drop"
echo "   - Ask questions in plain English"
echo "   - Create visualizations from AI suggestions"
echo "   - Export results as images or data files"
echo "   - Access from any device on your network using the network IP above"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID