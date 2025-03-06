const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { MongoClient, ObjectId, Binary } = require('mongodb');
const promptService = require('./prompt-service');

// Load environment variables
dotenv.config();

// Constants and Configuration
const GPT_MODEL = "gpt-4o";
const COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const PORT = process.env.PORT || 3103;
const DEDUPE_WINDOW_MS = 3000; // 3 segundos en milisegundos

// Paths
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LOG_FILE = path.join(PUBLIC_DIR, "vision_log.json");
const CONFIG_FILE = path.join(PUBLIC_DIR, "config.json");

// MongoDB Configuration
const MONGO_ENABLED = process.env.MONGO_ENABLED === 'true' || false;
const MONGO_URI = process.env.MONGO_URI || '';
const MONGO_DB = process.env.MONGO_DB || 'raybanai_db';
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || 'image_analysis';
const MONGO_PROMPT_COL = process.env.MONGO_PROMPT_COL || 'prompts';

// Cache para evitar procesamiento duplicado
const requestCache = new Map();

const app = express();

// Middleware
app.use(cors());
// Aumentar límite de tamaño para solicitudes JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Default configuration with new prompt settings
let appConfig = {
  mongoEnabled: MONGO_ENABLED,
  useMongoPrompt: false, // Default to using local prompts
  defaultCategory: 'NutritionAnalysis'
};

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

// Load configuration file
async function loadConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    appConfig = JSON.parse(configData);
    console.log('Configuration loaded:', appConfig);
  } catch (error) {
    console.log('No configuration file found, using defaults');
    await saveConfig();
  }
}

// Save configuration file
async function saveConfig() {
  try {
    await ensureDirectoryExists(PUBLIC_DIR);
    await fs.writeFile(CONFIG_FILE, JSON.stringify(appConfig, null, 2));
    console.log('Configuration saved');
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
}

// Función para limpiar entradas antiguas en el cache
function cleanupOldCacheEntries() {
  const now = Date.now();
  for (const [key, timestamp] of requestCache.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS) {
      requestCache.delete(key);
    }
  }
}

// Ejecutar limpieza periódica cada 30 segundos
setInterval(cleanupOldCacheEntries, 30000);

// Función para verificar si una petición es duplicada
function isDuplicateRequest(imageUrl) {
  const now = Date.now();
  if (requestCache.has(imageUrl)) {
    const lastTime = requestCache.get(imageUrl);
    if (now - lastTime < DEDUPE_WINDOW_MS) {
      return true;
    }
  }
  // Actualizamos el timestamp de la última solicitud
  requestCache.set(imageUrl, now);
  return false;
}

// Save analysis to log file
async function saveToLog(imageUrl, response, promptUsed, mongoId = null) {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(PUBLIC_DIR);

    const logEntry = {
      timestamp: new Date().toISOString(),
      imageUrl,
      response,
      promptUsed,
      mongoId
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

// Save to MongoDB
async function saveToMongoDB(prompt, output, imageData) {
  try {
    if (!appConfig.mongoEnabled || !MONGO_URI) {
      console.log('MongoDB storage is disabled');
      return null;
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,  // Aumentado a 15 segundos
      connectTimeoutMS: 15000
    });
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLLECTION);
    
    const document = {
      timestamp: new Date(),
      prompt: prompt,
      openai_output: output,
      extracted_info: null,
      image: new Binary(imageData)
    };
    
    const result = await collection.insertOne(document);
    console.log(`Data saved to MongoDB with ID: ${result.insertedId}`);
    
    await client.close();
    return result.insertedId;
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return null;
  }
}

// Initialize app configuration
async function initApp() {
  await ensureDirectoryExists(PUBLIC_DIR);
  await loadConfig();
  await promptService.initializePromptsFile();
}

// Routes
// Get configuration
app.get('/api/config', (req, res) => {
  // Añadir el nombre de la colección de prompts a la respuesta
  const configResponse = {
    ...appConfig,
    promptCollection: MONGO_PROMPT_COL
  };
  res.status(200).json(configResponse);
});

// Update configuration
app.post('/api/config', async (req, res) => {
  try {
    const { mongoEnabled, useMongoPrompt, defaultCategory } = req.body;
    
    // Update config
    if (mongoEnabled !== undefined) appConfig.mongoEnabled = mongoEnabled === true;
    if (useMongoPrompt !== undefined) appConfig.useMongoPrompt = useMongoPrompt === true;
    if (defaultCategory) appConfig.defaultCategory = defaultCategory;
    
    // Save to file
    await saveConfig();
    
    res.status(200).json({ success: true, config: appConfig });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Get prompts (local or mongo based on config)
app.get('/api/prompts', async (req, res) => {
  try {
    const prompts = await promptService.getAllPrompts(
      appConfig, 
      MONGO_URI, 
      MONGO_DB, 
      MONGO_PROMPT_COL
    );
    res.status(200).json(prompts);
  } catch (error) {
    console.error('Error retrieving prompts:', error);
    res.status(500).json({ error: 'Failed to retrieve prompts' });
  }
});

// Update local prompt
app.post('/api/prompts', async (req, res) => {
  try {
    const { category, prompt } = req.body;
    
    if (!category || !prompt) {
      return res.status(400).json({ error: 'Category and prompt are required' });
    }
    
    const success = await promptService.saveLocalPrompt(category, prompt);
    
    if (success) {
      res.status(200).json({ success: true, message: 'Prompt updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update prompt' });
    }
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Get history from local storage
app.get('/api/history', async (req, res) => {
  try {
    const logData = await fs.readFile(LOG_FILE, 'utf8');
    res.status(200).json(JSON.parse(logData));
  } catch (error) {
    res.status(404).json({ error: "No history found" });
  }
});

// Modificar el endpoint de prueba de MongoDB para incluir información sobre prompts
app.get('/api/mongo-test', async (req, res) => {
  try {
    // Enviamos información sobre la configuración
    const config = {
      mongoEnabled: appConfig.mongoEnabled,
      mongoUri: MONGO_URI ? (MONGO_URI.substring(0, 20) + '...') : 'not set', // No mostrar URI completa por seguridad
      mongoDb: MONGO_DB,
      mongoCollection: MONGO_COLLECTION,
      useMongoPrompt: appConfig.useMongoPrompt,
      promptCollection: MONGO_PROMPT_COL  // Añadir esta línea
    };

    // Si MongoDB no está habilitado, solo enviamos esta información
    if (!appConfig.mongoEnabled || !MONGO_URI) {
      return res.status(200).json({
        status: "MongoDB disabled",
        config
      });
    }

    // Intentamos conectar a MongoDB
    console.log('Testing MongoDB connection...');
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,  // Aumentado a 15 segundos
      connectTimeoutMS: 15000
    });
    
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    // Verificamos si podemos acceder a la colección
    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLLECTION);
    
    // Contar documentos
    const count = await collection.countDocuments();
    console.log(`Found ${count} documents in collection`);
    
    // Probar acceso a colección de prompts
    let promptCount = 0;
    let promptsInfo = {};
    try {
      const promptCollection = db.collection(MONGO_PROMPT_COL);
      promptCount = await promptCollection.countDocuments();
      console.log(`Found ${promptCount} prompts in collection`);
      
      // Si hay prompts, obtener una muestra
      if (promptCount > 0) {
        const promptSamples = await promptCollection.find({}).limit(5).toArray();
        promptsInfo = {
          count: promptCount,
          samples: promptSamples.map(doc => ({
            id: doc._id,
            category: doc.Category || doc.category || 'unknown',
            promptPreview: doc.Prompt ? `${doc.Prompt.substring(0, 50)}...` : 'No prompt field found'
          }))
        };
      }
    } catch (promptError) {
      console.error('Error accessing prompt collection:', promptError);
      promptsInfo = { error: promptError.message };
    }
    
    // Cerramos la conexión
    await client.close();
    
    // Enviamos la respuesta
    res.status(200).json({
      status: "success",
      connectionSuccessful: true,
      documentCount: count,
      promptsInfo: promptsInfo,
      config
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    
    // Enviamos detalles del error
    res.status(500).json({
      status: "error",
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
  }
});


// MongoDB API endpoints
app.get('/api/mongo-history', async (req, res) => {
  try {
    // Verificar si MongoDB está habilitado
    if (!appConfig.mongoEnabled || !MONGO_URI) {
      return res.status(404).json({
        error: "MongoDB is not enabled or configured",
        isMongoEnabled: appConfig.mongoEnabled
      });
    }
    
    // Crear un cliente MongoDB
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    
    // Conectar al cliente
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Obtener la base de datos y colección
    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLLECTION);
    
    console.log(`Querying collection: ${MONGO_COLLECTION}`);
    
    // Corregido: usar solo exclusión, no mezclar con inclusión
    const entries = await collection.find({}, {
      projection: { 
        image: 0  // Solo excluimos la imagen, sin intentar incluir otros campos
      }
    }).sort({ timestamp: -1 }).limit(50).toArray();
    
    console.log(`Found ${entries.length} entries`);
    
    // Cerrar la conexión
    await client.close();
    
    // Enviar respuesta
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error retrieving MongoDB history:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve history from MongoDB',
      message: error.message,
      stack: error.stack
    });
  }
});

// Endpoint para obtener una imagen específica de MongoDB por ID
app.get('/api/mongo-image/:id', async (req, res) => {
  try {
    // Verificar si MongoDB está habilitado
    if (!appConfig.mongoEnabled || !MONGO_URI) {
      return res.status(404).json({ error: "MongoDB is not enabled or configured" });
    }
    
    const id = req.params.id;
    
    // Validar el ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ID format" });
    }
    
    // Crear el ObjectId
    const objectId = new ObjectId(id);
    
    // Conectar a MongoDB
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    await client.connect();
    
    // Obtener la base de datos y colección
    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLLECTION);
    
    // Buscar el documento
    const entry = await collection.findOne({ _id: objectId });
    
    // Cerrar la conexión
    await client.close();
    
    // Verificar si se encontró el documento
    if (!entry || !entry.image) {
      return res.status(404).json({ error: "Image not found" });
    }
    
    // Establecer el tipo de contenido adecuado
    res.setHeader('Content-Type', 'image/jpeg');
    
    // Enviar los datos binarios de la imagen
    res.send(entry.image.buffer);
  } catch (error) {
    console.error('Error retrieving image from MongoDB:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve image from MongoDB',
      message: error.message,
      stack: error.stack
    });
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

    const imageUrl = body.imageUrl || body.url;
    
    // Verificar si es una petición duplicada
    if (isDuplicateRequest(imageUrl)) {
      console.log(`Duplicate request detected for image: ${imageUrl}`);
      return res.status(429).json({ 
        error: "Duplicate request", 
        message: "Request for this image was processed less than 3 seconds ago"
      });
    }

    const token = process.env.OPENAI_API_KEY;
    if (!token) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get the prompt based on configuration
    const promptCategory = body.category || appConfig.defaultCategory || 'NutritionAnalysis';
    console.log(`Using prompt category: ${promptCategory}`);
    
    const prompt = await promptService.getPrompt(
      appConfig,
      MONGO_URI,
      MONGO_DB,
      MONGO_PROMPT_COL,
      promptCategory
    );
    
    console.log(`Prompt to use (first 50 chars): ${prompt.substring(0, 50)}...`);

    console.log('Making request to OpenAI...');
    
    const openAIBody = {
      model: GPT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
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

    // Save to MongoDB if enabled
    let mongoId = null;
    if (appConfig.mongoEnabled && MONGO_URI) {
      try {
        console.log('Saving to MongoDB...');
        
        // Fetch the image data
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageData = Buffer.from(imageResponse.data, 'binary');
        
        // Save to MongoDB
        mongoId = await saveToMongoDB(
          prompt, // Using the actual prompt that was used
          analysisResponse,
          imageData
        );
        
        if (mongoId) {
          console.log(`Saved to MongoDB with ID: ${mongoId}`);
        } else {
          console.log('Failed to save to MongoDB');
        }
      } catch (mongoError) {
        console.error('Error saving to MongoDB:', mongoError);
      }
    }

    // Save the response to local storage
    await saveToLog(imageUrl, analysisResponse, prompt, mongoId);

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

// Endpoint para probar la recuperación de prompts
app.get('/api/prompt-debug', async (req, res) => {
  try {
    const category = req.query.category || appConfig.defaultCategory || 'NutritionAnalysis';
    const source = req.query.source || 'auto'; // 'auto', 'mongo', 'local'
    
    let prompt;
    let sourceUsed;
    
    if (source === 'mongo') {
      // Forzar uso de MongoDB
      prompt = await promptService.getMongoPrompt(
        MONGO_URI,
        MONGO_DB,
        MONGO_PROMPT_COL,
        category
      );
      sourceUsed = 'mongo';
    } else if (source === 'local') {
      // Forzar uso de local
      prompt = await promptService.getLocalPrompt(category);
      sourceUsed = 'local';
    } else {
      // Usar configuración actual
      prompt = await promptService.getPrompt(
        appConfig,
        MONGO_URI,
        MONGO_DB,
        MONGO_PROMPT_COL,
        category
      );
      sourceUsed = appConfig.useMongoPrompt && appConfig.mongoEnabled ? 'mongo' : 'local';
    }
    
    // Información de diagnóstico
    const diagnosticInfo = {
      config: {
        mongoEnabled: appConfig.mongoEnabled,
        useMongoPrompt: appConfig.useMongoPrompt,
        defaultCategory: appConfig.defaultCategory,
        mongoDb: MONGO_DB,
        promptCollection: MONGO_PROMPT_COL,
        requestedCategory: category,
        sourceRequested: source,
        sourceUsed: sourceUsed
      },
      promptInfo: {
        length: prompt ? prompt.length : 0,
        preview: prompt ? (prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt) : 'No prompt found'
      }
    };
    
    res.status(200).json({
      prompt,
      diagnosticInfo
    });
  } catch (error) {
    console.error('Error in prompt debug endpoint:', error);
    res.status(500).json({
      error: 'Failed to retrieve prompt',
      message: error.message,
      stack: error.stack
    });
  }
});

// Initialize and start server
initApp().then(() => {
  app.listen(PORT, () => {
    console.log(`RaybanAI server listening on http://localhost:${PORT}`);
    console.log(`MongoDB integration: ${appConfig.mongoEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Prompt source: ${appConfig.useMongoPrompt ? 'MongoDB' : 'Local'}`);
    console.log(`Default prompt category: ${appConfig.defaultCategory}`);
    console.log(`Duplicate request prevention: ${DEDUPE_WINDOW_MS/1000} seconds`);
  });
});