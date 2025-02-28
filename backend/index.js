const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Constants and Configuration
const GPT_MODEL = "gpt-4o";
const COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const PORT = process.env.PORT || 3103;

// Paths
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LOG_FILE = path.join(PUBLIC_DIR, "vision_log.json");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure directories exist
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory ensured: ${dirPath}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Save analysis to log file
async function saveToLog(imageUrl, response) {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(PUBLIC_DIR);

    const logEntry = {
      timestamp: new Date().toISOString(),
      imageUrl,
      response,
    };

    // Read or create log file
    let logs = [];
    try {
      const existingData = await fs.readFile(LOG_FILE, 'utf8');
      logs = JSON.parse(existingData);
    } catch (error) {
      console.log('Creating new log file');
    }

    // Add new entry and save
    logs.push(logEntry);
    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
    console.log('Log saved successfully in:', LOG_FILE);

    // Save individual file
    const timestamp = new Date().getTime();
    const individualLogFile = path.join(PUBLIC_DIR, `analysis_${timestamp}.json`);
    await fs.writeFile(individualLogFile, JSON.stringify(logEntry, null, 2));
    console.log(`Individual analysis saved in: ${individualLogFile}`);

  } catch (error) {
    console.error('Error saving log:', error);
    console.error('Detailed error:', {
      message: error.message,
      code: error.code,
      path: error.path,
      stack: error.stack
    });
  }
}

// Routes
app.get('/api/history', async (req, res) => {
  try {
    const logData = await fs.readFile(LOG_FILE, 'utf8');
    res.status(200).json(JSON.parse(logData));
  } catch (error) {
    res.status(404).json({ error: "No history found" });
  }
});

// Main API endpoint - support both paths for backward compatibility
app.post(['/api/raybanai', '/api/gpt-4-vision'], async (req, res) => {
  try {
    const body = req.body;
    console.log('Received request:', JSON.stringify(body, null, 2));

    if (!body.imageUrl && !body.type) {
      throw new Error("No image URL or type provided");
    }

    const token = process.env.OPENAI_API_KEY;
    if (!token) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Making request to OpenAI...');
    
    const openAIBody = {
      model: GPT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image?" },
            {
              type: "image_url",
              image_url: {
                url: body.imageUrl || body.url,
                detail: "auto"
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    const response = await axios.post(COMPLETIONS_ENDPOINT, openAIBody, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });

    const analysisResponse = response.data.choices[0].message.content;

    // Save the response
    await saveToLog(body.imageUrl || body.url, analysisResponse);

    return res.status(200).json({ response: analysisResponse });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      details: 'Check server logs for more information'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`RaybanAI server listening on http://localhost:${PORT}`);
});