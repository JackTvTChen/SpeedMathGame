const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Determine the environment
const environment = process.env.NODE_ENV || 'development';

// Define the path to the environment file
const envPath = path.resolve(process.cwd(), '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.warn(
    '.env file not found. Please create one based on the .env.example file. Using default values for now.'
  );
}

// Load environment variables
dotenv.config();

// Base configuration object with defaults
const config = {
  env: environment,
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    bodyLimit: '1mb',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'dev',
  },
  
  // API configuration
  api: {
    prefix: '/api',
    version: 'v1',
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default_insecure_jwt_secret_do_not_use_in_production',
    jwtExpire: process.env.JWT_EXPIRE || '24h',
    jwtCookieExpire: process.env.JWT_COOKIE_EXPIRE || '86400000', // 24 hours in milliseconds
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  
  // Database configuration
  database: {
    uri: process.env.DB_URI || 'mongodb://localhost:27017/shooting_star_dev',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Maximum 100 requests per windowMs
  },
};

// Validate critical configuration settings
function validateConfig(config) {
  const errors = [];
  
  // In production, ensure JWT secret is set and secure
  if (config.env === 'production' && 
      (config.security.jwtSecret === 'default_insecure_jwt_secret_do_not_use_in_production' ||
       config.security.jwtSecret.length < 32)) {
    errors.push('JWT_SECRET is not set or too short for production environment');
  }
  
  // In production, ensure CORS origin is not wildcard
  if (config.env === 'production' && config.security.corsOrigin === '*') {
    errors.push('CORS_ORIGIN should not be wildcard (*) in production environment');
  }
  
  // Log errors but don't halt in development, halt in production
  if (errors.length > 0) {
    const errorMessage = `Configuration validation errors:\n${errors.join('\n')}`;
    
    if (config.env === 'production') {
      throw new Error(errorMessage);
    } else {
      console.warn(errorMessage);
    }
  }
}

// Validate the configuration
validateConfig(config);

module.exports = config; 