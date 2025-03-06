#!/bin/bash

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print formatted messages
print_message() {
    echo -e "${BLUE}[RaybanAI]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

print_error() {
    echo -e "${RED}[✘] $1${NC}"
}

# Header
print_message "🔄 Restarting RaybanAI server..."

# Find and kill any process using port 3103
PORT_PROCESS=$(lsof -ti:3103)
if [ ! -z "$PORT_PROCESS" ]; then
    print_message "Found process $PORT_PROCESS using port 3103. Terminating..."
    kill -9 $PORT_PROCESS
    sleep 1
    print_success "Process terminated"
else
    print_message "No process currently using port 3103"
fi

# Make sure we're in the correct directory
cd "$(dirname "$0")"
print_message "Working directory: $(pwd)"

# Start server
print_message "Starting RaybanAI server..."
cd backend && npm start