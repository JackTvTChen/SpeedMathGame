const mongoose = require('mongoose');
const config = require('../config');

/**
 * Database connection utility
 * 
 * Provides methods for connecting to MongoDB and handling connection events.
 */

// Track connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Connect to MongoDB
 * @returns {Promise} Resolves when connected, rejects on error
 */
const connect = async () => {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    const dbUri = config.database.uri;
    
    if (!dbUri) {
      throw new Error('Database URI is not defined in environment variables');
    }
    
    console.log(`Connecting to MongoDB at ${dbUri.replace(/\/\/(.+):(.+)@/, '//***:***@')}`);
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Connect to MongoDB
    await mongoose.connect(dbUri, options);
    
    isConnected = true;
    connectionAttempts = 0;
    console.log('MongoDB connected successfully');
    
    // Set up event listeners for connection
    setupConnectionHandlers();
    
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    
    // Attempt to reconnect with exponential backoff
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      connectionAttempts++;
      const delay = Math.pow(2, connectionAttempts) * 1000;
      console.log(`Retrying connection in ${delay/1000} seconds. Attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connect();
    }
    
    throw err;
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise} Resolves when disconnected
 */
const disconnect = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err.message);
    throw err;
  }
};

/**
 * Set up MongoDB connection event handlers
 */
const setupConnectionHandlers = () => {
  const db = mongoose.connection;
  
  db.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
    isConnected = false;
  });
  
  db.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });
  
  db.on('reconnected', () => {
    console.log('MongoDB reconnected');
    isConnected = true;
  });
  
  // For graceful shutdown
  process.on('SIGINT', async () => {
    await disconnect();
    process.exit(0);
  });
};

/**
 * Check if connected to MongoDB
 * @returns {Boolean} True if connected
 */
const isConnectedToDB = () => {
  return isConnected;
};

/**
 * Get the Mongoose connection object
 * @returns {Object} Mongoose connection
 */
const getConnection = () => {
  return mongoose.connection;
};

module.exports = {
  connect,
  disconnect,
  isConnected: isConnectedToDB,
  getConnection,
}; 