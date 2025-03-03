# RaybanAI

## Meta Rayban Smart Glasses GPT4 Vision API Implementation

A Node.js implementation for integrating GPT4 Vision into Meta Rayban Smart Glasses using voice commands. This project is based on the original Meta Vision by Devon Crebbin.

## Features

- Analyze images via OpenAI's GPT-4o Vision API
- Store analysis results locally in JSON format
- Optional MongoDB integration for more robust storage
- Web dashboard for configuration and history viewing
- Messenger integration for receiving images
- Easy setup with convenient scripts

## Requirements

* Meta Rayban Smart Glasses
* OpenAI API Key
* Alternative Facebook/Messenger account
* Node.js (version 14 or higher)
* MongoDB Atlas account (optional)

## Installation

### Linux/macOS

1. Clone the repository
2. Navigate to the RaybanAI directory
3. Run the installation script:

```
chmod +x 1-setup.sh
./1-setup.sh
```

This will install all necessary dependencies and set up your environment.

### Windows

1. Install Node.js
2. Clone the repository
3. Navigate to the RaybanAI directory
4. Open PowerShell as administrator and run:

```
cd backend
npm install
```

5. Create a `.env` file in the backend directory with your OpenAI API key:

```
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
PORT=3103

# MongoDB Configuration (optional)
MONGO_ENABLED=false
MONGO_URI=
MONGO_DB=
MONGO_COLLECTION=
```

## Configuration

### Local Storage Only

For a simple setup using only local storage:

1. Edit your `.env` file to disable MongoDB:

```
MONGO_ENABLED=false
```

2. Start the server:
   ```
   cd backend && npm start
   ```

### With MongoDB Integration

For advanced storage capabilities with MongoDB:

1. Create a MongoDB Atlas account if you don't have one
2. Create a cluster and database
3. Edit your `.env` file with MongoDB details:

```
MONGO_ENABLED=true
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
MONGO_DB=your-database-name
MONGO_COLLECTION=raybanai_images
```

4. Start the server:
   ```
   cd backend && npm start
   ```

You can also enable/disable MongoDB from the web dashboard at any time.

## Running the Server

The easiest way to start the server is using the provided restart script:

```
chmod +x restart.sh
./restart.sh
```

This will automatically terminate any existing process using port 3103 and start a new server instance.

Once the server is running, you can access the dashboard at `http://localhost:3103`.

## Testing

### Basic API Test

Run the test script to verify your setup:

```
./2-testserver.sh
```

Example output:

```
[RaybanAI Test] Testing RaybanAI API
[RaybanAI Test] Image: Mexican Green Chilaquiles
[RaybanAI Test] URL: https://patijinich.com/wp-content/uploads/2012/10/04_GreenChilaquilesRoastedTomatilloSauce_101_Cropped-copy.jpg
[✔] Request successful!

Response:
{
   "response" : "The image shows a skillet containing chilaquiles. This dish is a traditional Mexican breakfast featuring tortilla chips smothered in salsa (usually red or green) and topped with ingredients such as cheese, crema (Mexican sour cream), onions, and cilantro."
}
```

### MongoDB Test

If you're using MongoDB, you can test the integration with:

```
./mongo-test.sh
```

This will verify:
- MongoDB connection status
- Image analysis and storage
- Retrieval of stored data

## Web Dashboard

RaybanAI includes a web dashboard accessible at `http://localhost:3103` with the following features:

- Server status monitoring
- MongoDB configuration
- View analysis history (both local and MongoDB)
- Testing tools

### Configuration Page

Access `http://localhost:3103/config.html` to:
- Enable/disable MongoDB storage
- View MongoDB connection status

### MongoDB History

Access `http://localhost:3103/mongo-history.html` to:
- View images stored in MongoDB
- See analysis results
- View prompts used for analysis

## Messenger Integration

1. Login to messenger.com with an alternative messenger/facebook account
2. Create a new bookmark in your browser
3. Copy the code from `bookmarklet.js` into the bookmark's URL field
4. Click the bookmark to activate the observer

If you encounter any issues:
1. Verify the image URL is still accessible
2. Check if your OpenAI API key is valid
3. Ensure the server is running
4. Verify your network connection

## Voice Commands

1. "Hey Meta, send a photo to [alternative account name]"
2. Meta: "Send a photo to [alternative account name]"
3. You: "Yes"

The API will analyze the image and respond with a description.

## Project Structure

```
RaybanAI/
├── backend/          # Server code
│   ├── index.js      # Main server
│   ├── mongo-service.js # MongoDB integration
│   ├── .env          # API keys and configuration
│   └── package.json  # Dependencies
├── public/           # Web dashboard and assets
│   ├── index.html    # Main dashboard
│   ├── config.html   # Configuration page
│   └── mongo-history.html # MongoDB history viewer
├── 1-setup.sh        # Installation script
├── 2-testserver.sh   # Basic API test script
├── mongo-test.sh     # MongoDB test script
├── restart.sh        # Server restart script
└── bookmarklet.js    # Browser integration
```

## Troubleshooting

### MongoDB Connection Issues

If you experience MongoDB connection problems:

1. Verify your connection string in the `.env` file
2. Make sure your IP is whitelisted in MongoDB Atlas
3. Check the MongoDB console logs for specific errors
4. Use the `/api/mongo-test` endpoint for diagnostics
5. Increase timeouts if needed in index.js

### Image Processing Errors

If image analysis fails:

1. Verify the image URL is accessible
2. Check your OpenAI API key is valid
3. Make sure the image format is supported by OpenAI (JPEG, PNG, etc.)
4. Check server logs for detailed error messages

## Credits

* Original concept and implementation by Devon Crebbin
* Node.js implementation by DonPeregrina
* MongoDB integration and dashboard by DonPeregrina

## Disclaimer

This is an experimental integration. Meta Reality Labs may provide official SDKs in the future for more robust implementations.