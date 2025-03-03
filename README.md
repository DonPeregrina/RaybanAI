# RaybanAI

## Meta Rayban Smart Glasses GPT4 Vision API Implementation

A Node.js implementation for integrating GPT4 Vision into Meta Rayban Smart Glasses using voice commands. This project is based on the original Meta Vision by Devon Crebbin.

## Requirements

* Meta Rayban Smart Glasses
* OpenAI API Key
* Alternative Facebook/Messenger account
* Node.js (version 14 or higher)

## Installation

### Linux

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
OPENAI_API_KEY=your-key-here
```

## Configuration

1. Add your OpenAI API key to the `.env` file in the backend directory
2. Start the server:
   * Linux: `cd backend && npm start`
   * Windows: `cd backend && npm start`

## Testing

### Test the API

Run the test script to verify everything is working:

#### Linux:

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

#### Windows:

```
node test.js
```

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
│   ├── index.js     # Main server
│   ├── .env         # API keys
│   └── package.json # Dependencies
├── public/          # Generated analysis files
├── 1-setup.sh       # Installation script
├── 2-testserver.sh  # Test script
└── bookmarklet.js   # Browser integration
```

## Credits

* Original concept and implementation by Devon Crebbin https://github.com/dcrebbin/meta-vision-api
* Node.js implementation by DonPeregrina

## Disclaimer

This is an experimental integration. Meta Reality Labs may provide official SDKs in the future for more robust implementations.
