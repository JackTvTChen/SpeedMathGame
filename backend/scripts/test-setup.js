#!/usr/bin/env node

/**
 * Test Setup Script
 * 
 * A command-line tool to help with testing setup and execution.
 * 
 * Features:
 * - Setup test environment
 * - Run tests with specific filters
 * - Generate test coverage reports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const testPath = args[1] || '';
const additionalArgs = args.slice(2);

// Help command
const showHelp = () => {
  console.log(`
${colors.bright}Test Helper for Project Shooting Star${colors.reset}

Usage:
  node ${path.relative(rootDir, __filename)} [command] [test-path] [options]

Commands:
  ${colors.green}help${colors.reset}      Show this help message
  ${colors.green}run${colors.reset}       Run tests (default command)
  ${colors.green}watch${colors.reset}     Run tests in watch mode
  ${colors.green}coverage${colors.reset}  Run tests with coverage report
  ${colors.green}clear${colors.reset}     Clear Jest cache and run tests
  ${colors.green}setup${colors.reset}     Setup test environment

Options:
  test-path     Specific test file or directory to test
  --verbose     Show detailed test output
  --silent      Show minimal test output
  --no-cache    Disable Jest cache

Examples:
  node ${path.relative(rootDir, __filename)} run
  node ${path.relative(rootDir, __filename)} watch users
  node ${path.relative(rootDir, __filename)} coverage auth
  node ${path.relative(rootDir, __filename)} setup
  `);
};

// Ensure test directory exists
const ensureTestDirectoryExists = () => {
  const testDir = path.join(rootDir, 'tests');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`${colors.green}Created test directory: ${testDir}${colors.reset}`);
    
    // Create subdirectories
    ['unit', 'integration', 'e2e', '__fixtures__'].forEach(subDir => {
      const fullPath = path.join(testDir, subDir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`${colors.green}Created test subdirectory: ${fullPath}${colors.reset}`);
      }
    });
  }
  
  return testDir;
};

// Create test setup files if they don't exist
const createTestSetupFiles = (testDir) => {
  // Setup file
  const setupFilePath = path.join(testDir, 'setup.js');
  if (!fs.existsSync(setupFilePath)) {
    const setupContent = `// Jest setup file
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

// Connect to test database
beforeAll(async () => {
  const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/shooting_star_test';
  
  try {
    await mongoose.connect(testDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to test database');
  } catch (err) {
    console.error('Failed to connect to test database:', err.message);
  }
});

// Clean up database after tests
afterAll(async () => {
  // Drop the database if in test environment for clean tests
  if (process.env.NODE_ENV === 'test') {
    await mongoose.connection.dropDatabase();
    console.log('Test database dropped');
  }
  
  await mongoose.connection.close();
  console.log('Database connection closed');
});
`;
    fs.writeFileSync(setupFilePath, setupContent);
    console.log(`${colors.green}Created test setup file: ${setupFilePath}${colors.reset}`);
  }

  // Test utils file
  const utilsFilePath = path.join(testDir, 'utils.js');
  if (!fs.existsSync(utilsFilePath)) {
    const utilsContent = `// Test utilities
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Create a mock user for testing
 * @param {Object} overrides - Fields to override in the mock user
 * @returns {Object} Mock user object
 */
const mockUser = (overrides = {}) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    score: 1000,
    ...overrides
  };
};

/**
 * Generate a valid JWT token for testing
 * @param {Object} user - User object or ID to encode in the token
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id || user
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test_jwt_secret',
    { expiresIn: '1h' }
  );
};

/**
 * Create mock request and response objects for controller testing
 * @param {Object} reqOverrides - Override request properties
 * @param {Object} resOverrides - Override response properties
 * @returns {Object} { req, res, next } mock objects
 */
const mockRequestResponse = (reqOverrides = {}, resOverrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    ...reqOverrides
  };
  
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    ...resOverrides
  };
  
  const next = jest.fn();
  
  return { req, res, next };
};

module.exports = {
  mockUser,
  generateToken,
  mockRequestResponse
};
`;
    fs.writeFileSync(utilsFilePath, utilsContent);
    console.log(`${colors.green}Created test utils file: ${utilsFilePath}${colors.reset}`);
  }
  
  // Jest config file at the root
  const jestConfigPath = path.join(rootDir, 'jest.config.js');
  if (!fs.existsSync(jestConfigPath)) {
    const jestConfigContent = `module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000
};
`;
    fs.writeFileSync(jestConfigPath, jestConfigContent);
    console.log(`${colors.green}Created Jest config file: ${jestConfigPath}${colors.reset}`);
  }
  
  // Create sample test file
  const sampleTestPath = path.join(testDir, 'unit', 'sample.test.js');
  if (!fs.existsSync(sampleTestPath)) {
    const sampleTestContent = `// Sample test file
const { mockRequestResponse } = require('../utils');

describe('Sample Test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('mock request/response works', () => {
    const { req, res, next } = mockRequestResponse(
      { body: { test: 'data' } },
      {}
    );
    
    expect(req.body.test).toBe('data');
    expect(typeof res.status).toBe('function');
    expect(typeof res.json).toBe('function');
    expect(typeof next).toBe('function');
  });
});
`;
    fs.writeFileSync(sampleTestPath, sampleTestContent);
    console.log(`${colors.green}Created sample test file: ${sampleTestPath}${colors.reset}`);
  }
};

// Check if Jest is installed
const checkJestInstallation = async () => {
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasJest = 
      (packageJson.dependencies && packageJson.dependencies.jest) || 
      (packageJson.devDependencies && packageJson.devDependencies.jest);
    
    if (!hasJest) {
      console.log(`${colors.yellow}Jest not found in package.json. Installing...${colors.reset}`);
      await runCommand('npm', ['install', '--save-dev', 'jest', 'supertest']);
    }
  } catch (err) {
    console.error(`${colors.red}Error checking Jest installation: ${err.message}${colors.reset}`);
  }
};

// Run a command and return a promise
const runCommand = (cmd, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}> ${cmd} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(cmd, args, { 
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }
      resolve();
    });
  });
};

// Setup command
const setupTestEnvironment = async () => {
  console.log(`${colors.bright}Setting up test environment...${colors.reset}`);
  
  // Create test directories
  const testDir = ensureTestDirectoryExists();
  
  // Create test setup files
  createTestSetupFiles(testDir);
  
  // Check Jest installation
  await checkJestInstallation();
  
  // Update package.json scripts if needed
  const packageJsonPath = path.join(rootDir, 'package.json');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let updated = false;
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add test scripts if they don't exist
    const scriptsToAdd = {
      'test': 'NODE_ENV=test jest',
      'test:watch': 'NODE_ENV=test jest --watch',
      'test:coverage': 'NODE_ENV=test jest --coverage',
      'test:clear': 'NODE_ENV=test jest --clearCache && jest'
    };
    
    Object.entries(scriptsToAdd).forEach(([key, value]) => {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = value;
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`${colors.green}Updated package.json with test scripts${colors.reset}`);
    }
  } catch (err) {
    console.error(`${colors.red}Error updating package.json: ${err.message}${colors.reset}`);
  }
  
  console.log(`${colors.green}${colors.bright}✅ Test environment setup complete!${colors.reset}`);
  console.log(`${colors.dim}Run tests with: npm test${colors.reset}`);
};

// Main function
const main = async () => {
  try {
    switch (command) {
      case 'help':
        showHelp();
        break;
      case 'setup':
        await setupTestEnvironment();
        break;
      case 'run':
        // Build args for Jest
        const runArgs = ['test'];
        if (testPath) runArgs.push(testPath);
        runArgs.push(...additionalArgs);
        await runCommand('npm', runArgs);
        break;
      case 'watch':
        const watchArgs = ['test:watch'];
        if (testPath) watchArgs.push(testPath);
        watchArgs.push(...additionalArgs);
        await runCommand('npm', watchArgs);
        break;
      case 'coverage':
        const coverageArgs = ['test:coverage'];
        if (testPath) coverageArgs.push(testPath);
        coverageArgs.push(...additionalArgs);
        await runCommand('npm', coverageArgs);
        break;
      case 'clear':
        const clearArgs = ['test:clear'];
        if (testPath) clearArgs.push(testPath);
        clearArgs.push(...additionalArgs);
        await runCommand('npm', clearArgs);
        break;
      default:
        console.log(`${colors.yellow}Unknown command: ${command}${colors.reset}`);
        showHelp();
        break;
    }
  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
};

// Run the main function
main(); 