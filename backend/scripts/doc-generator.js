#!/usr/bin/env node

/**
 * Documentation Generator Script
 * 
 * A command-line tool to generate API documentation.
 * 
 * Features:
 * - Generate OpenAPI/Swagger documentation
 * - Create markdown documentation
 * - Output various documentation formats
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const docsDir = path.join(rootDir, 'docs');

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Help command
const showHelp = () => {
  console.log(`
${colors.bright}Documentation Generator for Project Shooting Star${colors.reset}

Usage:
  node ${path.relative(rootDir, __filename)} [command]

Commands:
  ${colors.green}help${colors.reset}      Show this help message
  ${colors.green}swagger${colors.reset}   Generate OpenAPI/Swagger documentation
  ${colors.green}markdown${colors.reset}  Generate Markdown documentation
  ${colors.green}postman${colors.reset}   Generate Postman collection

Examples:
  node ${path.relative(rootDir, __filename)} swagger
  node ${path.relative(rootDir, __filename)} markdown
  `);
};

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${colors.green}Created directory: ${dirPath}${colors.reset}`);
  }
  return dirPath;
};

// Check if swagger-jsdoc and swagger-ui-express are installed
const checkSwaggerDependencies = () => {
  // Check package.json for swagger dependencies
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const hasSwaggerJsdoc = dependencies && dependencies['swagger-jsdoc'];
    const hasSwaggerUI = dependencies && dependencies['swagger-ui-express'];
    
    if (!hasSwaggerJsdoc || !hasSwaggerUI) {
      console.log(`${colors.yellow}Installing Swagger dependencies...${colors.reset}`);
      execSync('npm install --save swagger-jsdoc swagger-ui-express', {
        cwd: rootDir,
        stdio: 'inherit'
      });
    }
  } catch (err) {
    console.error(`${colors.red}Error checking Swagger dependencies: ${err.message}${colors.reset}`);
  }
};

// Generate Swagger/OpenAPI documentation
const generateSwaggerDocs = () => {
  console.log(`${colors.bright}Generating OpenAPI/Swagger documentation...${colors.reset}`);
  
  // Create docs directory if it doesn't exist
  ensureDirectoryExists(docsDir);
  
  // Check and install dependencies
  checkSwaggerDependencies();
  
  // Path to swagger definition
  const swaggerPath = path.join(rootDir, 'src', 'config', 'swagger.js');
  
  // Check if swagger definition exists, create if not
  if (!fs.existsSync(swaggerPath)) {
    console.log(`${colors.yellow}Swagger definition not found. Creating...${colors.reset}`);
    
    // Make sure the directory exists
    ensureDirectoryExists(path.dirname(swaggerPath));
    
    const swaggerDefinition = `const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./index');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Project Shooting Star API',
    version: '1.0.0',
    description: 'API documentation for Project Shooting Star',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      url: 'https://example.com',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: \`http://localhost:\${config.server.port}/api\`,
      description: 'Development server',
    },
    {
      url: 'https://api.example.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Profile',
      description: 'User profile endpoints',
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Path to the API docs (use glob patterns)
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/*.js',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
`;
    
    fs.writeFileSync(swaggerPath, swaggerDefinition);
    console.log(`${colors.green}Created Swagger definition at ${swaggerPath}${colors.reset}`);
  }
  
  // Generate swagger.json file
  const swaggerOutputPath = path.join(docsDir, 'swagger.json');
  
  try {
    // Generate the swagger spec from our definition
    const swaggerSpec = require(swaggerPath);
    
    // Write to file
    fs.writeFileSync(
      swaggerOutputPath,
      JSON.stringify(swaggerSpec, null, 2)
    );
    
    console.log(`${colors.green}Generated Swagger JSON at ${swaggerOutputPath}${colors.reset}`);
    
    // Also create swagger route if it doesn't exist
    const swaggerRoutePath = path.join(rootDir, 'src', 'routes', 'swagger.routes.js');
    
    if (!fs.existsSync(swaggerRoutePath)) {
      const swaggerRouteContent = `const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

const router = express.Router();

// Serve swagger docs
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Serve swagger.json
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router;
`;
      
      fs.writeFileSync(swaggerRoutePath, swaggerRouteContent);
      console.log(`${colors.green}Created Swagger routes at ${swaggerRoutePath}${colors.reset}`);
      
      // Update main routes index to include swagger
      updateRoutesIndex('swagger', 'docs');
    }
    
    // Add a basic example for documentation
    createExampleDocumentation();
    
    console.log(`${colors.green}${colors.bright}✅ Swagger documentation generation complete!${colors.reset}`);
    console.log(`${colors.cyan}Access documentation at:${colors.reset} http://localhost:3000/api/docs`);
  } catch (err) {
    console.error(`${colors.red}Error generating Swagger docs: ${err.message}${colors.reset}`);
  }
};

// Generate Markdown documentation
const generateMarkdownDocs = () => {
  console.log(`${colors.bright}Generating Markdown documentation...${colors.reset}`);
  
  // Create docs directory if it doesn't exist
  const markdownDir = ensureDirectoryExists(path.join(docsDir, 'markdown'));
  
  // Create API docs file
  const apiDocsPath = path.join(markdownDir, 'api.md');
  
  // Scan routes folder for endpoints
  const routesDir = path.join(rootDir, 'src', 'routes');
  
  try {
    // Get list of route files
    const routeFiles = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('.routes.js') || file.endsWith('.js'))
      .filter(file => file !== 'index.js' && file !== 'swagger.routes.js');
    
    let apiContent = `# Project Shooting Star API Documentation\n\n`;
    apiContent += `Generated on: ${new Date().toISOString()}\n\n`;
    apiContent += `## Table of Contents\n\n`;
    
    // Generate TOC from route files
    routeFiles.forEach(file => {
      const routeName = file.replace('.routes.js', '').replace('.js', '');
      apiContent += `- [${routeName.charAt(0).toUpperCase() + routeName.slice(1)}](#${routeName})\n`;
    });
    
    apiContent += `\n\n`;
    
    // Process each route file to extract endpoints
    routeFiles.forEach(file => {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const routeName = file.replace('.routes.js', '').replace('.js', '');
      
      apiContent += `## ${routeName.charAt(0).toUpperCase() + routeName.slice(1)}\n\n`;
      
      // Parse route methods (basic parsing, not comprehensive)
      const routePattern = /\.route\(['"]([^'"]+)['"]\)[.\n\s]+(get|post|put|delete|patch)\(/gm;
      const simpleRoutePattern = /\.(get|post|put|delete|patch)\(['"]([^'"]+)['"],/gm;
      
      let match;
      let endpoints = [];
      
      // Parse route() style endpoints
      while ((match = routePattern.exec(content)) !== null) {
        const path = match[1];
        const method = match[2].toUpperCase();
        endpoints.push({ path, method });
      }
      
      // Parse simple style endpoints
      routePattern.lastIndex = 0;
      while ((match = simpleRoutePattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        endpoints.push({ path, method });
      }
      
      // Write endpoints to docs
      endpoints.forEach(endpoint => {
        apiContent += `### ${endpoint.method} ${endpoint.path}\n\n`;
        apiContent += `\`\`\`\n${endpoint.method} /api/${routeName}${endpoint.path}\n\`\`\`\n\n`;
        apiContent += `#### Description\n\n`;
        apiContent += `(Add description here)\n\n`;
        apiContent += `#### Parameters\n\n`;
        apiContent += `(Add parameters here)\n\n`;
        apiContent += `#### Responses\n\n`;
        apiContent += `(Add response examples here)\n\n`;
        apiContent += `---\n\n`;
      });
    });
    
    fs.writeFileSync(apiDocsPath, apiContent);
    console.log(`${colors.green}Generated Markdown API docs at ${apiDocsPath}${colors.reset}`);
    
    // Generate README file
    const readmePath = path.join(markdownDir, 'README.md');
    
    const readmeContent = `# Project Shooting Star Documentation

## Overview

This directory contains documentation for the Project Shooting Star API.

## API Documentation

For detailed API documentation, see [API Docs](./api.md).

## Getting Started

1. Install dependencies: \`npm install\`
2. Set up environment variables (copy \`.env.example\` to \`.env\`)
3. Start the server: \`npm run dev\`
4. Access API at \`http://localhost:3000/api\`
5. Access Swagger docs at \`http://localhost:3000/api/docs\`
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`${colors.green}Generated README at ${readmePath}${colors.reset}`);
    
    console.log(`${colors.green}${colors.bright}✅ Markdown documentation generation complete!${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error generating Markdown docs: ${err.message}${colors.reset}`);
  }
};

// Generate Postman collection
const generatePostmanCollection = () => {
  console.log(`${colors.bright}Generating Postman collection...${colors.reset}`);
  
  // Create docs directory if it doesn't exist
  ensureDirectoryExists(docsDir);
  
  // Generate Swagger first to use as a base
  if (!fs.existsSync(path.join(docsDir, 'swagger.json'))) {
    generateSwaggerDocs();
  }
  
  // Path to the output file
  const postmanPath = path.join(docsDir, 'postman_collection.json');
  
  try {
    // Check if swagger-to-postman-collection is installed
    try {
      require.resolve('swagger-to-postman-collection');
    } catch (e) {
      console.log(`${colors.yellow}Installing swagger-to-postman-collection...${colors.reset}`);
      execSync('npm install --save-dev swagger-to-postman-collection', {
        cwd: rootDir,
        stdio: 'inherit'
      });
    }
    
    // Convert Swagger to Postman
    const swaggerPath = path.join(docsDir, 'swagger.json');
    const swaggerData = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    
    // Dynamically import the converter to avoid issues if it's not installed yet
    const converter = require('swagger-to-postman-collection');
    
    // Convert swagger to postman collection
    converter.convert({ type: 'swagger2', data: swaggerData }, (err, conversionResult) => {
      if (err) {
        console.error(`${colors.red}Conversion Error: ${err.message}${colors.reset}`);
        return;
      }
      
      if (!conversionResult.result) {
        console.error(`${colors.red}Conversion failed: ${conversionResult.reason}${colors.reset}`);
        return;
      }
      
      // Get the postman collection object
      const collection = conversionResult.output[0].data;
      
      // Add auth information
      collection.auth = {
        type: 'bearer',
        bearer: [{
          key: 'token',
          value: '{{token}}',
          type: 'string'
        }]
      };
      
      // Add environment variables
      const environmentVars = {
        id: 'env_id',
        name: 'Project Shooting Star Environment',
        values: [
          {
            key: 'baseUrl',
            value: 'http://localhost:3000/api',
            enabled: true
          },
          {
            key: 'token',
            value: '',
            enabled: true
          }
        ]
      };
      
      // Write output files
      fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2));
      console.log(`${colors.green}Generated Postman collection at ${postmanPath}${colors.reset}`);
      
      const envPath = path.join(docsDir, 'postman_environment.json');
      fs.writeFileSync(envPath, JSON.stringify(environmentVars, null, 2));
      console.log(`${colors.green}Generated Postman environment at ${envPath}${colors.reset}`);
      
      console.log(`${colors.green}${colors.bright}✅ Postman collection generation complete!${colors.reset}`);
      console.log(`${colors.cyan}Import both files into Postman to use the collection.${colors.reset}`);
    });
  } catch (err) {
    console.error(`${colors.red}Error generating Postman collection: ${err.message}${colors.reset}`);
  }
};

// Update routes index to include new routes
const updateRoutesIndex = (routeName, routePath) => {
  const indexPath = path.join(rootDir, 'src', 'routes', 'index.js');
  
  // Check if index file exists, skip if not
  if (!fs.existsSync(indexPath)) {
    return;
  }
  
  // Read existing index file
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if route is already imported
  if (indexContent.includes(`require('./${routeName}.routes')`)) {
    return;
  }
  
  // Add import
  const importPattern = /const express = require\('express'\);\n/;
  const importReplacement = `const express = require('express');\nconst ${routeName}Routes = require('./${routeName}.routes');\n`;
  
  // Add route mount
  const mountPattern = /const router = express.Router\(\);\n/;
  const mountReplacement = `const router = express.Router();\n\n// Mount documentation routes\nrouter.use('/${routePath}', ${routeName}Routes);\n`;
  
  // Apply replacements if patterns found
  if (importPattern.test(indexContent)) {
    indexContent = indexContent.replace(importPattern, importReplacement);
  }
  
  if (mountPattern.test(indexContent)) {
    indexContent = indexContent.replace(mountPattern, mountReplacement);
  }
  
  // Write updated content
  fs.writeFileSync(indexPath, indexContent);
};

// Create an example controller with JSDoc for Swagger
const createExampleDocumentation = () => {
  // Example JSDoc annotations for a controller
  const examplePath = path.join(rootDir, 'src', 'docs', 'example.js');
  ensureDirectoryExists(path.dirname(examplePath));
  
  const exampleContent = `/**
 * This file contains examples of JSDoc annotations for Swagger documentation.
 * It is not used in the actual application, just for reference.
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Retrieve a list of users from the database
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve a single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: A single user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the user
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email
 *         role:
 *           type: string
 *           description: User's role
 *           enum: [user, admin]
 *         score:
 *           type: number
 *           description: User's score
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was last updated
 *       example:
 *         id: 60d21b4667d0d8992e610c85
 *         name: John Doe
 *         email: john@example.com
 *         role: user
 *         score: 1000
 *         createdAt: 2021-06-22T14:30:00.000Z
 *         updatedAt: 2021-06-22T14:30:00.000Z
 */

// This is just an example, not actual code
`;
  
  fs.writeFileSync(examplePath, exampleContent);
  console.log(`${colors.green}Created Swagger documentation example at ${examplePath}${colors.reset}`);
};

// Main function
const main = async () => {
  try {
    switch (command) {
      case 'help':
        showHelp();
        break;
      case 'swagger':
        generateSwaggerDocs();
        break;
      case 'markdown':
        generateMarkdownDocs();
        break;
      case 'postman':
        generatePostmanCollection();
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