#!/bin/bash

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print formatted messages
print_message() {
    echo -e "${BLUE}[RaybanAI Test]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

print_error() {
    echo -e "${RED}[✘] $1${NC}"
}

# Test image URL
IMAGE_URL="https://patijinich.com/wp-content/uploads/2012/10/04_GreenChilaquilesRoastedTomatilloSauce_101_Cropped-copy.jpg"
API_URL="http://localhost:3103/api/raybanai"

print_message "Testing RaybanAI API"
print_message "Image: Mexican Green Chilaquiles"
print_message "URL: $IMAGE_URL"

# Make the request
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"url\",\"imageUrl\":\"$IMAGE_URL\"}" \
    $API_URL)

# Check if curl request was successful
if [ $? -eq 0 ]; then
    print_success "Request successful!"
    echo -e "\nResponse:"
    echo $response | json_pp
else
    print_error "Request failed"
    echo $response
fi