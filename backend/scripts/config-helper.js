#!/usr/bin/env node

/**
 * Config Helper Script
 * 
 * A command-line tool to help with configuration management.
 * 
 * Features:
 * - Check and validate environment configuration
 * - List all available environment variables with current values
 * - Create environment-specific .env files
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Get base directory
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const envArg = args[1] || process.env.NODE_ENV || 'development';

// Define environment variable categories
const envCategories = {
  server: ['PORT', 'NODE_ENV'],
  logging: ['LOG_LEVEL'],
  security: ['JWT_SECRET', 'JWT_EXPIRE', 'CORS_ORIGIN'],
  database: ['DB_URI', 'DB_USER', 'DB_PASSWORD', 'TEST_DB_URI'],
  rateLimit: ['RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX'],
};

// Define environment variable descriptions
const envDescriptions = {
  PORT: 'Port number the server will listen on',
  NODE_ENV: 'Environment (development, production, test)',
  LOG_LEVEL: 'Morgan logging level (dev, combined, common, short, tiny)',
  JWT_SECRET: 'Secret key for JWT token generation',
  JWT_EXPIRE: 'JWT token expiration time (e.g., 24h, 30d)',
  CORS_ORIGIN: 'Allowed origins for CORS (URL or * for any)',
  DB_URI: 'MongoDB connection URI',
  DB_USER: 'Database username if not in URI',
  DB_PASSWORD: 'Database password if not in URI',
  TEST_DB_URI: 'Test database URI for running tests',
  RATE_LIMIT_WINDOW_MS: 'Rate limiting window in milliseconds',
  RATE_LIMIT_MAX: 'Maximum number of requests in rate limit window',
};

// Required variables per environment
const requiredVars = {
  development: ['PORT', 'NODE_ENV', 'LOG_LEVEL', 'JWT_SECRET'],
  production: ['PORT', 'NODE_ENV', 'LOG_LEVEL', 'JWT_SECRET', 'CORS_ORIGIN', 'DB_URI'],
  test: ['PORT', 'NODE_ENV', 'JWT_SECRET', 'TEST_DB_URI'],
};

// Default values
const defaultValues = {
  PORT: '3000',
  NODE_ENV: 'development',
  LOG_LEVEL: 'dev',
  JWT_SECRET: 'default_insecure_jwt_secret_do_not_use_in_production',
  JWT_EXPIRE: '24h',
  CORS_ORIGIN: '*',
  DB_URI: 'mongodb://localhost:27017/shooting_star_dev',
  TEST_DB_URI: 'mongodb://localhost:27017/shooting_star_test',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
};

// Get all environment variables from all categories
const getAllEnvVars = () => {
  return Object.values(envCategories).flat();
};

// Get current values for all environment variables
const getCurrentValues = () => {
  const result = {};
  getAllEnvVars().forEach(varName => {
    result[varName] = process.env[varName] || defaultValues[varName] || '';
  });
  return result;
};

// Check if required variables are set for a given environment
const checkRequiredVars = (env) => {
  const currentValues = getCurrentValues();
  const missing = [];
  
  if (!requiredVars[env]) {
    console.log(`${colors.yellow}⚠️ Unknown environment: ${env}${colors.reset}`);
    return [];
  }
  
  requiredVars[env].forEach(varName => {
    if (!currentValues[varName]) {
      missing.push(varName);
    }
  });
  
  return missing;
};

// Format current values for display
const formatCurrentValues = () => {
  const currentValues = getCurrentValues();
  let output = '';
  
  Object.entries(envCategories).forEach(([category, vars]) => {
    output += `\n${colors.bright}${colors.cyan}${category.toUpperCase()}${colors.reset}\n`;
    
    vars.forEach(varName => {
      const value = currentValues[varName] || '';
      const required = requiredVars[envArg]?.includes(varName);
      const isSet = Boolean(process.env[varName]);
      
      // Format the variable name
      let formattedName = `${varName}`;
      if (required) {
        formattedName = `${colors.bright}${formattedName}*${colors.reset}`;
      }
      
      // Format the value
      let formattedValue = value;
      if (varName === 'JWT_SECRET' && value) {
        formattedValue = value.substring(0, 3) + '...' + value.substring(value.length - 3);
      } else if (varName.includes('PASSWORD') && value) {
        formattedValue = '********';
      }
      
      // Format the source
      let source = isSet ? 'env' : value ? 'default' : 'not set';
      let formattedSource;
      if (source === 'env') {
        formattedSource = `${colors.green}(${source})${colors.reset}`;
      } else if (source === 'default') {
        formattedSource = `${colors.yellow}(${source})${colors.reset}`;
      } else {
        formattedSource = `${colors.red}(${source})${colors.reset}`;
      }
      
      output += `  ${formattedName.padEnd(25)} ${formattedValue.padEnd(30)} ${formattedSource}\n`;
      
      // Add description if available
      if (envDescriptions[varName]) {
        output += `      ${colors.dim}${envDescriptions[varName]}${colors.reset}\n`;
      }
    });
  });
  
  return output;
};

// Command: help
const showHelp = () => {
  console.log(`
${colors.bright}Config Helper for Project Shooting Star${colors.reset}

Usage:
  node ${path.relative(rootDir, __filename)} [command] [environment]

Commands:
  ${colors.green}help${colors.reset}      Show this help message
  ${colors.green}check${colors.reset}     Check if all required environment variables are set
  ${colors.green}list${colors.reset}      List all environment variables with current values
  ${colors.green}create${colors.reset}    Create a .env file template for specified environment

Environments:
  development (default)
  production
  test

Examples:
  node ${path.relative(rootDir, __filename)} list
  node ${path.relative(rootDir, __filename)} check production
  node ${path.relative(rootDir, __filename)} create test
  `);
};

// Command: check
const checkConfig = () => {
  console.log(`${colors.bright}Checking configuration for ${colors.cyan}${envArg}${colors.reset} environment\n`);
  
  const missing = checkRequiredVars(envArg);
  
  if (missing.length > 0) {
    console.log(`${colors.red}❌ Missing required variables:${colors.reset}`);
    missing.forEach(varName => {
      console.log(`  ${colors.yellow}${varName}${colors.reset}: ${envDescriptions[varName] || ''}`);
    });
    console.log(`\n${colors.yellow}ℹ️ Add these variables to your .env file or set them as environment variables.${colors.reset}`);
    return false;
  } else {
    console.log(`${colors.green}✅ All required variables for ${envArg} environment are set!${colors.reset}`);
    return true;
  }
};

// Command: list
const listConfig = () => {
  console.log(`${colors.bright}Configuration for ${colors.cyan}${envArg}${colors.reset} environment\n`);
  console.log(`${colors.dim}Variables marked with * are required for this environment${colors.reset}`);
  console.log(formatCurrentValues());
};

// Command: create
const createEnvFile = () => {
  const targetFile = path.join(rootDir, envArg === 'development' ? '.env' : `.env.${envArg}`);
  
  // Check if file already exists
  if (fs.existsSync(targetFile)) {
    console.log(`${colors.yellow}⚠️ File ${targetFile} already exists.${colors.reset}`);
    console.log(`   Use a different environment name or delete the existing file.`);
    return;
  }
  
  // Generate template content
  let content = `# Environment configuration for ${envArg}\n`;
  content += `# Generated on ${new Date().toISOString()}\n\n`;
  
  Object.entries(envCategories).forEach(([category, vars]) => {
    content += `# ${category.charAt(0).toUpperCase() + category.slice(1)} Configuration\n`;
    
    vars.forEach(varName => {
      const required = requiredVars[envArg]?.includes(varName);
      const defaultValue = defaultValues[varName] || '';
      
      // Add description if available
      if (envDescriptions[varName]) {
        content += `# ${envDescriptions[varName]}\n`;
      }
      
      // Mark required variables
      if (required) {
        content += `# Required for ${envArg} environment\n`;
      }
      
      // Add variable with default value
      content += `${varName}=${defaultValue}\n\n`;
    });
  });
  
  // Write file
  fs.writeFileSync(targetFile, content);
  console.log(`${colors.green}✅ Created ${targetFile} with template for ${envArg} environment${colors.reset}`);
};

// Execute the requested command
switch (command) {
  case 'check':
    checkConfig();
    break;
  case 'list':
    listConfig();
    break;
  case 'create':
    createEnvFile();
    break;
  case 'help':
  default:
    showHelp();
    break;
} 