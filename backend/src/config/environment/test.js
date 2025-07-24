const baseConfig = require('../config');

/**
 * Test environment specific configuration
 * These settings extend and/or override the base configuration
 */
const testConfig = {
  // Override only what's different in test environment
  isDev: false,
  isTest: true,
  
  // Disable logging during tests unless specifically enabled
  logging: {
    level: process.env.LOG_LEVEL || 'silent',
  },
  
  // Test-specific database to avoid affecting development data
  database: {
    uri: process.env.TEST_DB_URI || 'mongodb://localhost:27017/shooting_star_test',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // No rate limiting during tests
  rateLimit: {
    enabled: false,
  },

  // Predictable JWT secret for tests
  security: {
    ...baseConfig.security,
    jwtSecret: 'test_jwt_secret', 
  }
};

module.exports = {
  ...baseConfig,
  ...testConfig,
}; 