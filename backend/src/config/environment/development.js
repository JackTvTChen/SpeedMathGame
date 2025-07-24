const baseConfig = require('../config');

/**
 * Development environment specific configuration
 * These settings extend and/or override the base configuration
 */
const devConfig = {
  // Override only what's different in development
  isDev: true,
  
  // More detailed logging
  logging: {
    level: process.env.LOG_LEVEL || 'dev',
    // Enable stack traces
    includeStackTrace: true,
  },
  
  // Less restrictive security in development
  security: {
    ...baseConfig.security,
    // Allow any origin for CORS in development for easier frontend development
    corsOrigin: process.env.CORS_ORIGIN || '*', 
  },

  // More permissive rate limiting in development
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // More requests allowed in dev
  },
};

module.exports = {
  ...baseConfig,
  ...devConfig,
}; 