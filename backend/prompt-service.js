/**
 * Prompt Service - Manages prompt retrieval from both local and MongoDB sources
 */
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Default prompt constants
const DEFAULT_PROMPTS = {
  "NutritionAnalysis": "You are a food analyzer. You will analyze the main components (carbs, fat, protein, etc) from this image and give back an estimation in grams of each and total calories. Be precise and concise.",
  "GeneralAnalysis": "Describe what you see in this image with detailed information."
};

// Local prompts file path
const PROMPTS_FILE = path.join(__dirname, '..', 'public', 'prompts.json');

/**
 * Initialize prompts file if it doesn't exist
 * @returns {Promise<void>}
 */
async function initializePromptsFile() {
  try {
    await fs.access(PROMPTS_FILE);
    console.log('Prompts file exists, skipping initialization');
  } catch (error) {
    // File doesn't exist, create it
    console.log('Creating default prompts file');
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(DEFAULT_PROMPTS, null, 2));
  }
}

/**
 * Get prompt from local file
 * @param {string} category - Prompt category
 * @returns {Promise<string>} - The prompt text
 */
async function getLocalPrompt(category = 'NutritionAnalysis') {
  try {
    // Ensure prompts file exists
    await initializePromptsFile();
    
    // Read prompts from file
    const promptsData = await fs.readFile(PROMPTS_FILE, 'utf8');
    const prompts = JSON.parse(promptsData);
    
    // Return requested prompt or default if not found
    if (prompts[category]) {
      console.log(`Found local prompt for category '${category}'`);
      return prompts[category];
    } else {
      console.log(`Local prompt for category '${category}' not found, using default`);
      return DEFAULT_PROMPTS.NutritionAnalysis;
    }
  } catch (error) {
    console.error('Error reading local prompt:', error);
    return DEFAULT_PROMPTS.NutritionAnalysis;
  }
}

/**
 * Get prompt from MongoDB
 * @param {string} mongoUri - MongoDB connection URI
 * @param {string} mongoDb - MongoDB database name
 * @param {string} promptCollection - MongoDB collection for prompts
 * @param {string} category - Prompt category
 * @returns {Promise<string>} - The prompt text
 */
async function getMongoPrompt(mongoUri, mongoDb, promptCollection, category = 'NutritionAnalysis') {
  try {
    // Connect to MongoDB
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    
    await client.connect();
    console.log('Connected to MongoDB for prompt retrieval');
    
    // Get database and collection
    const db = client.db(mongoDb);
    const collection = db.collection(promptCollection);
    
    // Find prompt by category
    const promptDoc = await collection.findOne({ Category: category });
    
    // Close connection
    await client.close();
    
    // Return prompt if found
    if (promptDoc && promptDoc.Prompt) {
      console.log(`Found MongoDB prompt for category '${category}': ${promptDoc.Prompt.substring(0, 50)}...`);
      return promptDoc.Prompt;
    } else {
      console.log(`MongoDB prompt for category '${category}' not found, falling back to local`);
      return await getLocalPrompt(category);
    }
  } catch (error) {
    console.error('Error retrieving prompt from MongoDB:', error);
    console.log('Falling back to local prompt');
    return await getLocalPrompt(category);
  }
}

/**
 * Get prompt based on configuration
 * @param {Object} config - Application configuration
 * @param {boolean} config.useMongoPrompt - Whether to use MongoDB for prompts
 * @param {boolean} config.mongoEnabled - Whether MongoDB is enabled
 * @param {string} mongoUri - MongoDB connection URI
 * @param {string} mongoDb - MongoDB database name
 * @param {string} promptCollection - MongoDB collection for prompts
 * @param {string} category - Prompt category
 * @returns {Promise<string>} - The prompt text
 */
async function getPrompt(config, mongoUri, mongoDb, promptCollection, category = 'NutritionAnalysis') {
  // Use MongoDB prompt if enabled and configured
  if (config.useMongoPrompt && config.mongoEnabled && mongoUri) {
    try {
      return await getMongoPrompt(mongoUri, mongoDb, promptCollection, category);
    } catch (error) {
      console.error('Failed to get MongoDB prompt:', error);
      console.log('Falling back to local prompt');
      return await getLocalPrompt(category);
    }
  } else {
    // Otherwise use local prompt
    console.log('Using local prompt as configured');
    return await getLocalPrompt(category);
  }
}

/**
 * Save a prompt to the local file
 * @param {string} category - Prompt category
 * @param {string} promptText - The prompt text
 * @returns {Promise<boolean>} - Success indicator
 */
async function saveLocalPrompt(category, promptText) {
  try {
    // Ensure prompts file exists
    await initializePromptsFile();
    
    // Read current prompts
    const promptsData = await fs.readFile(PROMPTS_FILE, 'utf8');
    const prompts = JSON.parse(promptsData);
    
    // Update prompt
    prompts[category] = promptText;
    
    // Save updated prompts
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
    
    console.log(`Local prompt for category '${category}' updated`);
    return true;
  } catch (error) {
    console.error('Error saving local prompt:', error);
    return false;
  }
}

/**
 * Get all available prompts (local or MongoDB based on config)
 * @param {Object} config - Application configuration
 * @param {boolean} config.useMongoPrompt - Whether to use MongoDB for prompts
 * @param {boolean} config.mongoEnabled - Whether MongoDB is enabled
 * @param {string} mongoUri - MongoDB connection URI
 * @param {string} mongoDb - MongoDB database name
 * @param {string} promptCollection - MongoDB collection for prompts
 * @returns {Promise<Object>} - Object with category:prompt pairs
 */
async function getAllPrompts(config, mongoUri, mongoDb, promptCollection) {
  // If using MongoDB and it's enabled
  if (config.useMongoPrompt && config.mongoEnabled && mongoUri) {
    try {
      // Connect to MongoDB
      const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
      });
      
      await client.connect();
      
      // Get database and collection
      const db = client.db(mongoDb);
      const collection = db.collection(promptCollection);
      
      // Get all prompts
      const mongoDocs = await collection.find({}).toArray();
      
      // Close connection
      await client.close();
      
      // Convert to category:prompt format
      const prompts = {};
      mongoDocs.forEach(doc => {
        if (doc.Category && doc.Prompt) {
          prompts[doc.Category] = doc.Prompt;
        }
      });
      
      console.log(`Retrieved ${Object.keys(prompts).length} prompts from MongoDB`);
      return prompts;
    } catch (error) {
      console.error('Error retrieving prompts from MongoDB:', error);
      console.log('Falling back to local prompts');
      return await getLocalPrompts();
    }
  } else {
    // Otherwise use local prompts
    return await getLocalPrompts();
  }
}

/**
 * Get all local prompts
 * @returns {Promise<Object>} - Object with category:prompt pairs
 */
async function getLocalPrompts() {
  try {
    // Ensure prompts file exists
    await initializePromptsFile();
    
    // Read prompts from file
    const promptsData = await fs.readFile(PROMPTS_FILE, 'utf8');
    return JSON.parse(promptsData);
  } catch (error) {
    console.error('Error reading local prompts:', error);
    return DEFAULT_PROMPTS;
  }
}

module.exports = {
  getPrompt,
  saveLocalPrompt,
  getAllPrompts,
  getLocalPrompts,
  getMongoPrompt,
  initializePromptsFile,
  DEFAULT_PROMPTS
};