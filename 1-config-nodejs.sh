#!/bin/bash
# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print formatted messages
print_message() {
    echo -e "${BLUE}[RaybanAI Setup]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

print_error() {
    echo -e "${RED}[✘] $1${NC}"
}

print_message "Starting RaybanAI setup..."
print_message "Checking for Node.js..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed"
    print_message "Please install Node.js (version 14 or higher) before continuing"
    exit 1
fi

# Create public directory if it doesn't exist
print_message "Creating public directory..."
mkdir -p public
print_success "Public directory created/confirmed"

# Install dependencies
print_message "Installing dependencies..."
cd backend && npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Go back to root directory
cd ..

# Check for .env file
print_message "Checking for .env file..."
if [ -f backend/.env ]; then
    print_success ".env file found"
else
    print_message "Creating .env file template..."
    echo "OPENAI_API_KEY=your-api-key-here" > backend/.env
    print_success "Created .env file template"
    print_message "Please edit the backend/.env file and add your OpenAI API key"
fi

# Make the test script executable
print_message "Making test script executable..."
chmod +x 2-testserver.sh
print_success "Test script is now executable"

print_message "Setup complete! You can now run the server with 'cd backend && npm start'"
print_message "Or test the API with './2-testserver.sh'"