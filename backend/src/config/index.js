/**
 * Configuration loader
 * Loads the appropriate configuration based on the NODE_ENV environment variable
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const baseConfig = {
  env: process.env.NODE_ENV || 'development',
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    host: process.env.HOST || 'localhost'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'dev'
  },
  api: {
    prefix: '/api',
    version: 'v1'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5178',
    enableHelmetDefaults: process.env.ENABLE_HELMET_DEFAULTS === 'true'
  },
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/shooting-star'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// Validate critical configuration
const requiredConfig = ['database.url', 'security.jwtSecret'];
const missingConfig = requiredConfig.filter(key => {
  const value = key.split('.').reduce((obj, k) => obj && obj[k], baseConfig);
  return !value;
});

if (missingConfig.length > 0) {
  throw new Error(`Missing required configuration: ${missingConfig.join(', ')}`);
}

module.exports = baseConfig; 