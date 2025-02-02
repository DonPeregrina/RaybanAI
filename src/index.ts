import { readFile, writeFile } from "fs/promises";

const GPT_MODEL = "gpt-4o";  // Volvemos al modelo de visión
const COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const PORT = 3103;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Función para convertir imagen local a base64
async function imageToBase64(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await readFile(imagePath);
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    throw new Error(`Error reading image file: ${error.message}`);
  }
}

const server = Bun.serve({
  port: PORT,
  fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const baseHeaders = { ...CORS_HEADERS, 'Content-Type': 'application/json' };
    const url = new URL(request.url);
    
    console.log("Requested path:", url.pathname);

    if (url.pathname === "/api/gpt-4-vision") {
      return handleRequest(request, baseHeaders);
    }

    return new Response(
      JSON.stringify({ error: "Not Found" }), 
      { status: 404, headers: baseHeaders }
    );
  },
});

async function handleRequest(request: Request, headers: typeof CORS_HEADERS) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();
    console.log("Received request type:", body.type);

    let imageContent;
    if (body.type === "url") {
      imageContent = { url: body.imageUrl };
    } else if (body.type === "local") {
      // Convertir imagen local a base64
      const base64Image = await imageToBase64(body.imagePath);
      imageContent = { url: base64Image };
    } else if (body.type === "base64") {
      // Ya viene en base64
      imageContent = { url: body.base64Image };
    } else {
      throw new Error("Invalid image source type");
    }

    const token = process.env.OPENAI_API_KEY;
    if (!token) {
      throw new Error('OPENAI_API_KEY no está configurada');
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
    return new Response(
      JSON.stringify({ response: data.choices[0].message.content }), 
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers }
    );
  }
}

console.log(`Server listening on http://localhost:${PORT}`);