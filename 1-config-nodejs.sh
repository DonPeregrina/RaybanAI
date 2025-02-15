#!/bin/bash

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions for formatted messages
print_message() {
    echo -e "${BLUE}[RaybanAI]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

print_error() {
    echo -e "${RED}[✘] $1${NC}"
}

# Check if script is running from RaybanAI folder
if [[ $(basename "$PWD") != "RaybanAI" ]]; then
    print_error "This script must be executed from the RaybanAI folder"
    exit 1
fi

# Update system
print_message "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
print_message "Installing system dependencies..."
sudo apt install -y curl git build-essential

# Install Node.js
print_message "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed successfully"
else
    print_success "Node.js is already installed"
fi

# Verify versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js version: $NODE_VERSION"
print_success "npm version: $NPM_VERSION"

# Final messages
print_success "Environment setup completed!"
print_message "Project structure should be:"
echo "
RaybanAI/
├── backend/
│   ├── index.js
│   ├── .env
│   └── package.json
└── bookmarklet.js
"
print_message "Next steps:"
print_message "1. Navigate to backend directory: cd backend"
print_message "2. Install dependencies: npm install"
print_message "3. Configure your OpenAI API key in .env file"
print_message "4. Start the server: npm start"