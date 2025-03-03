#!/bin/bash

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print formatted messages
print_message() {
    echo -e "${BLUE}[MongoDB Test]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

print_error() {
    echo -e "${RED}[✘] $1${NC}"
}

# Header
print_message "Testing MongoDB connection and storage..."

# Check if MongoDB is enabled
print_message "Checking MongoDB configuration..."
MONGO_TEST=$(curl -s http://localhost:3103/api/mongo-test)

if [[ $MONGO_TEST == *"MongoDB disabled"* ]]; then
    print_error "MongoDB is disabled. Enable it in the configuration page."
    echo -e "\nConfiguration details:"
    echo $MONGO_TEST | json_pp
    exit 1
fi

if [[ $MONGO_TEST == *"error"* ]]; then
    print_error "MongoDB connection failed!"
    echo -e "\nError details:"
    echo $MONGO_TEST | json_pp
    exit 1
fi

print_success "MongoDB connection successful!"
echo -e "\nConnection details:"
echo $MONGO_TEST | json_pp

# Test image storage
print_message "Testing image storage in MongoDB..."
TEST_IMAGE="https://patijinich.com/wp-content/uploads/2012/10/04_GreenChilaquilesRoastedTomatilloSauce_101_Cropped-copy.jpg"

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"url\",\"imageUrl\":\"$TEST_IMAGE\"}" \
    http://localhost:3103/api/raybanai)

if [[ $? -eq 0 && $RESPONSE == *"response"* ]]; then
    print_success "Image analysis and storage successful!"
    echo -e "\nAnalysis response:"
    echo $RESPONSE | json_pp
    
    # Check if MongoDB history is available
    print_message "Verifying MongoDB history..."
    sleep 2  # Wait a moment for data to be stored
    
    HISTORY=$(curl -s http://localhost:3103/api/mongo-history)
    
    if [[ $HISTORY == *"error"* ]]; then
        print_error "Failed to retrieve MongoDB history!"
        echo $HISTORY | json_pp
    else
        print_success "MongoDB history retrieved successfully!"
        COUNT=$(echo $HISTORY | json_pp | grep -c "_id")
        print_message "Found $COUNT records in MongoDB"
    fi
else
    print_error "Image analysis or storage failed!"
    echo $RESPONSE
fi