const { MongoClient, Binary } = require('mongodb');

// Configuration will be loaded from .env via the main application
let mongoClient = null;
let isConnected = false;

/**
 * Connect to MongoDB
 * @param {string} uri - MongoDB connection string
 * @param {string} dbName - Database name
 * @returns {Object} MongoDB collection object
 */
async function connectToMongoDB(uri, dbName, collectionName) {
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
      console.log('Connected successfully to MongoDB');
    }
    
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);
    isConnected = true;
    
    return collection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    isConnected = false;
    return null;
  }
}

/**
 * Save data to MongoDB
 * @param {string} uri - MongoDB connection string
 * @param {string} dbName - Database name
 * @param {string} collectionName - Collection name
 * @param {string} prompt - The prompt used for analysis
 * @param {string} openaiOutput - The response from OpenAI
 * @param {Buffer} imageData - The binary image data
 * @returns {string|null} The ID of the inserted document, or null if failed
 */
async function saveToMongoDB(uri, dbName, collectionName, prompt, openaiOutput, imageData) {
  try {
    const collection = await connectToMongoDB(uri, dbName, collectionName);
    
    if (!collection) {
      console.warn('Could not connect to MongoDB. Data will not be stored.');
      return null;
    }

    const document = {
        timestamp: new Date(),
        prompt: prompt,
        openai_output: output,
        extracted_info: null,
        image: new Binary(imageData)  // Usa Binary directamente, no ObjectId.Binary
      };

    const result = await collection.insertOne(document);
    console.log(`Data saved to MongoDB with ID: ${result.insertedId}`);
    return result.insertedId;
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return null;
  }
}

/**
 * Close MongoDB connection
 */
async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    console.log('MongoDB connection closed');
    mongoClient = null;
    isConnected = false;
  }
}

/**
 * Check if MongoDB is connected
 * @returns {boolean} True if connected, false otherwise
 */
function checkConnection() {
  return isConnected;
}

module.exports = {
  saveToMongoDB,
  closeConnection,
  checkConnection
};