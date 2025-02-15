import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';

dotenv.config();

const app = express();
const GPT_MODEL = "gpt-4o";  // Volvemos al modelo de visión
const COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const PORT = 3103;
app.use(cors());
app.use(express.json());

// Convert local image to base64
async function imageToBase64(imagePath) {
  try {
    const imageBuffer = await readFile(imagePath);
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    throw new Error(`Error reading image file: ${error.message}`);
  }
}

app.post('/api/raybanai', async (req, res) => {
  try {
    const { type, imageUrl, imagePath, base64Image } = req.body;
    let imageContent;

    if (type === "url") {
      imageContent = { url: imageUrl };
    } else if (type === "local") {
      const base64 = await imageToBase64(imagePath);
      imageContent = { url: base64 };
    } else if (type === "base64") {
      imageContent = { url: base64Image };
    } else {
      throw new Error("Invalid image source type");
    }

    const token = process.env.OPENAI_API_KEY;
    if (!token) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(COMPLETIONS_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              { type: "image_url", image_url: imageContent }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    res.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});