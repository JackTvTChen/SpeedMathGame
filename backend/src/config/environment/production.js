const baseConfig = require('../config');

/**
 * Production environment specific configuration
 * These settings extend and/or override the base configuration
 */
const prodConfig = {
  // Override only what's different in production
  isDev: false,
  
  // Less verbose logging in production
  logging: {
    level: process.env.LOG_LEVEL || 'combined',
    // Disable stack traces in production for security
    includeStackTrace: false,
  },
  
  // Stricter security in production
  security: {
    ...baseConfig.security,
    // Must specify exact CORS origin in production
    corsOrigin: process.env.CORS_ORIGIN || 'https://app.shootingstar.com', 
    // Additional security headers
    enableHelmetDefaults: true,
  },
  
  // Stricter rate limiting in production
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Fewer requests in production
  },
  
  // Cache settings for production
  cache: {
    enabled: true,
    ttl: 60, // Cache lifetime in seconds
  },
};

module.exports = {
  ...baseConfig,
  ...prodConfig,
}; 