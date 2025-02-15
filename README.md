# RaybanAI
### Meta Rayban Smart Glasses GPT4 Vision API Implementation

A Node.js implementation for integrating GPT4 Vision into Meta Rayban Smart Glasses using voice commands. This project is based on the original [Meta Vision](https://github.com/dcrebbin/meta-vision) by [Devon Crebbin](https://github.com/dcrebbin).

## Requirements

- [Meta Rayban Smart Glasses](https://about.fb.com/news/2023/09/new-ray-ban-meta-smart-glasses/)
- [OpenAI API Key](https://platform.openai.com/)
- Alternative Facebook/Messenger account
- Node.js (version 14 or higher)

## Installation

### Linux

1. Clone the repository
2. Navigate to the RaybanAI directory
3. Run the installation script:
```bash
chmod +x 1-setup.sh
./1-setup.sh
```

This will install all necessary dependencies and set up your environment.

### Windows

1. Install [Node.js](https://nodejs.org/)
2. Clone the repository
3. Navigate to the RaybanAI directory
4. Open PowerShell as administrator and run:
```powershell
npm install
```
5. Create a `.env` file with your OpenAI API key:
```
OPENAI_API_KEY=your-key-here
```

## Configuration

1. Add your OpenAI API key to the `.env` file
2. Start the server:
   - Linux: `./2-testserver.sh`
   - Windows: `node backend/index.js`

## Testing

### Test the API
Run the test script to verify everything is working:

Linux:
```bash
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

Windows:
```powershell
node test.js
```

### Messenger Integration

1. Login to [messenger.com](https://www.messenger.com) with an alternative messenger/facebook account
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
├── 1-setup.sh       # Installation script
├── 2-testserver.sh  # Test script
└── bookmarklet.js   # Browser integration
```

## Credits
- Original concept and implementation by [Devon Crebbin](https://github.com/dcrebbin)
- Node.js implementation by [DonPeregrina](https://github.com/DonPeregrina)

## Disclaimer
This is an experimental integration. Meta Reality Labs may provide official SDKs in the future for more robust implementations.