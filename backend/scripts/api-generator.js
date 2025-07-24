#!/usr/bin/env node

/**
 * API Generator Script
 * 
 * A command-line tool to generate RESTful API route boilerplate.
 * 
 * Features:
 * - Generate controller, route, and model files
 * - Creates CRUD operations boilerplate
 * - Adds route to main routes index file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
const srcDir = path.join(rootDir, 'src');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${colors.green}Created directory: ${dirPath}${colors.reset}`);
  }
};

// Main function
const main = async () => {
  console.log(`\n${colors.bright}API Resource Generator${colors.reset}\n`);

  // Get resource name
  const resourceName = await new Promise((resolve) => {
    rl.question(`${colors.cyan}Enter resource name (singular, e.g., 'game'): ${colors.reset}`, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });

  if (!resourceName) {
    console.log(`${colors.red}Error: Resource name is required${colors.reset}`);
    rl.close();
    return;
  }

  // Format resource name variations
  const resourceNameCapitalized = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  const resourceNamePlural = resourceName.endsWith('y') 
    ? `${resourceName.slice(0, -1)}ies` 
    : resourceName.endsWith('s') 
      ? `${resourceName}es` 
      : `${resourceName}s`;
  
  // Get fields
  console.log(`\n${colors.yellow}Define fields for ${resourceNameCapitalized} model:${colors.reset}`);
  console.log(`${colors.dim}Format: fieldName:type:required (e.g., name:String:true)${colors.reset}`);
  console.log(`${colors.dim}Available types: String, Number, Boolean, Date, ObjectId${colors.reset}`);
  console.log(`${colors.dim}Enter empty line when done${colors.reset}\n`);
  
  const fields = [];
  let fieldInput = true;
  
  while (fieldInput) {
    const field = await new Promise((resolve) => {
      rl.question(`${colors.cyan}Field (or press Enter to finish): ${colors.reset}`, (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!field) {
      fieldInput = false;
      continue;
    }
    
    const [name, type = 'String', required = 'false'] = field.split(':');
    
    if (!name) {
      console.log(`${colors.red}Error: Field name is required${colors.reset}`);
      continue;
    }
    
    fields.push({ name, type, required: required === 'true' });
    console.log(`${colors.green}✓ Added field: ${name} (${type})${colors.reset}`);
  }
  
  // Ask for authentication requirement
  const requiresAuth = await new Promise((resolve) => {
    rl.question(`\n${colors.cyan}Does this resource require authentication? (y/n): ${colors.reset}`, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
  
  // Ask for owner field if authentication is required
  let ownerField = null;
  if (requiresAuth) {
    ownerField = await new Promise((resolve) => {
      rl.question(`${colors.cyan}Enter field name for owner reference (default: 'user'): ${colors.reset}`, (answer) => {
        resolve(answer.trim() || 'user');
      });
    });
    
    // Add owner field to the model if it doesn't exist
    if (!fields.some(f => f.name === ownerField)) {
      fields.push({
        name: ownerField,
        type: 'ObjectId',
        required: true,
        ref: 'User'
      });
      console.log(`${colors.green}✓ Added owner field: ${ownerField} (ObjectId, ref: 'User')${colors.reset}`);
    }
  }
  
  // Create directories
  ensureDirectoryExists(path.join(srcDir, 'models'));
  ensureDirectoryExists(path.join(srcDir, 'controllers'));
  ensureDirectoryExists(path.join(srcDir, 'routes'));
  
  // Generate model
  await generateModel(resourceName, resourceNameCapitalized, fields);
  
  // Generate controller
  await generateController(resourceName, resourceNameCapitalized, resourceNamePlural, fields, requiresAuth, ownerField);
  
  // Generate routes
  await generateRoutes(resourceName, resourceNamePlural, requiresAuth);
  
  // Update main routes index
  await updateRoutesIndex(resourceName, resourceNamePlural);
  
  console.log(`\n${colors.green}${colors.bright}✅ API Resource Generation Complete!${colors.reset}`);
  console.log(`${colors.dim}The following files were created:${colors.reset}`);
  console.log(`  - src/models/${resourceNameCapitalized}.js`);
  console.log(`  - src/controllers/${resourceName}.controller.js`);
  console.log(`  - src/routes/${resourceName}.routes.js`);
  console.log(`${colors.dim}Routes index was updated with the new resource routes.${colors.reset}`);
  
  // Show usage example
  console.log(`\n${colors.cyan}API Endpoints Created:${colors.reset}`);
  console.log(`  GET    /api/${resourceNamePlural}          - Get all ${resourceNamePlural}`);
  console.log(`  GET    /api/${resourceNamePlural}/:id      - Get a single ${resourceName}`);
  console.log(`  POST   /api/${resourceNamePlural}          - Create a new ${resourceName}`);
  console.log(`  PUT    /api/${resourceNamePlural}/:id      - Update a ${resourceName}`);
  console.log(`  DELETE /api/${resourceNamePlural}/:id      - Delete a ${resourceName}`);
  
  rl.close();
};

// Generate model file
const generateModel = async (resourceName, resourceNameCapitalized, fields) => {
  const modelPath = path.join(srcDir, 'models', `${resourceNameCapitalized}.js`);
  
  // Check if file already exists
  if (fs.existsSync(modelPath)) {
    const overwrite = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Model file already exists. Overwrite? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (!overwrite) {
      console.log(`${colors.yellow}Skipping model generation${colors.reset}`);
      return;
    }
  }
  
  let modelContent = `const mongoose = require('mongoose');\n\n`;
  
  // Add schema definition
  modelContent += `const ${resourceName}Schema = new mongoose.Schema({\n`;
  
  // Add fields
  fields.forEach(field => {
    if (field.type === 'ObjectId') {
      modelContent += `  ${field.name}: {\n`;
      modelContent += `    type: mongoose.Schema.Types.ObjectId,\n`;
      if (field.ref) {
        modelContent += `    ref: '${field.ref}',\n`;
      }
      modelContent += `    required: ${field.required}\n`;
      modelContent += `  },\n`;
    } else {
      modelContent += `  ${field.name}: {\n`;
      modelContent += `    type: ${field.type},\n`;
      modelContent += `    required: ${field.required}\n`;
      modelContent += `  },\n`;
    }
  });
  
  // Add timestamps
  modelContent += `}, {\n  timestamps: true\n});\n\n`;
  
  // Add model export
  modelContent += `module.exports = mongoose.model('${resourceNameCapitalized}', ${resourceName}Schema);\n`;
  
  // Write to file
  fs.writeFileSync(modelPath, modelContent);
  console.log(`${colors.green}✓ Created model at ${modelPath}${colors.reset}`);
};

// Generate controller file
const generateController = async (resourceName, resourceNameCapitalized, resourceNamePlural, fields, requiresAuth, ownerField) => {
  const controllerPath = path.join(srcDir, 'controllers', `${resourceName}.controller.js`);
  
  // Check if file already exists
  if (fs.existsSync(controllerPath)) {
    const overwrite = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Controller file already exists. Overwrite? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (!overwrite) {
      console.log(`${colors.yellow}Skipping controller generation${colors.reset}`);
      return;
    }
  }
  
  let controllerContent = `const ${resourceNameCapitalized} = require('../models/${resourceNameCapitalized}');\n`;
  controllerContent += `const { ErrorResponse } = require('../utils/errorResponse');\n`;
  controllerContent += `const asyncHandler = require('../middleware/async');\n\n`;
  
  // Get all function
  controllerContent += `// @desc    Get all ${resourceNamePlural}\n`;
  controllerContent += `// @route   GET /api/${resourceNamePlural}\n`;
  controllerContent += `// @access  ${requiresAuth ? 'Private' : 'Public'}\n`;
  controllerContent += `exports.get${resourceNameCapitalized}s = asyncHandler(async (req, res, next) => {\n`;
  
  if (requiresAuth) {
    controllerContent += `  // Build query\n`;
    controllerContent += `  let query;\n\n`;
    controllerContent += `  // If user is not admin, show only their ${resourceNamePlural}\n`;
    controllerContent += `  if (req.user.role !== 'admin') {\n`;
    controllerContent += `    query = ${resourceNameCapitalized}.find({ ${ownerField}: req.user.id });\n`;
    controllerContent += `  } else {\n`;
    controllerContent += `    query = ${resourceNameCapitalized}.find();\n`;
    controllerContent += `  }\n\n`;
    controllerContent += `  // Execute query\n`;
    controllerContent += `  const ${resourceNamePlural} = await query;\n\n`;
  } else {
    controllerContent += `  const ${resourceNamePlural} = await ${resourceNameCapitalized}.find();\n\n`;
  }
  
  controllerContent += `  res.status(200).json({\n`;
  controllerContent += `    success: true,\n`;
  controllerContent += `    count: ${resourceNamePlural}.length,\n`;
  controllerContent += `    data: ${resourceNamePlural}\n`;
  controllerContent += `  });\n`;
  controllerContent += `});\n\n`;
  
  // Get single function
  controllerContent += `// @desc    Get single ${resourceName}\n`;
  controllerContent += `// @route   GET /api/${resourceNamePlural}/:id\n`;
  controllerContent += `// @access  ${requiresAuth ? 'Private' : 'Public'}\n`;
  controllerContent += `exports.get${resourceNameCapitalized} = asyncHandler(async (req, res, next) => {\n`;
  controllerContent += `  const ${resourceName} = await ${resourceNameCapitalized}.findById(req.params.id);\n\n`;
  controllerContent += `  if (!${resourceName}) {\n`;
  controllerContent += `    return next(\n`;
  controllerContent += `      new ErrorResponse(\`${resourceNameCapitalized} not found with id of \${req.params.id}\`, 404)\n`;
  controllerContent += `    );\n`;
  controllerContent += `  }\n\n`;
  
  if (requiresAuth) {
    controllerContent += `  // Make sure user is the owner or an admin\n`;
    controllerContent += `  if (\n`;
    controllerContent += `    ${resourceName}.${ownerField}.toString() !== req.user.id &&\n`;
    controllerContent += `    req.user.role !== 'admin'\n`;
    controllerContent += `  ) {\n`;
    controllerContent += `    return next(\n`;
    controllerContent += `      new ErrorResponse(\`User \${req.user.id} is not authorized to access this ${resourceName}\`, 401)\n`;
    controllerContent += `    );\n`;
    controllerContent += `  }\n\n`;
  }
  
  controllerContent += `  res.status(200).json({\n`;
  controllerContent += `    success: true,\n`;
  controllerContent += `    data: ${resourceName}\n`;
  controllerContent += `  });\n`;
  controllerContent += `});\n\n`;
  
  // Create function
  controllerContent += `// @desc    Create new ${resourceName}\n`;
  controllerContent += `// @route   POST /api/${resourceNamePlural}\n`;
  controllerContent += `// @access  ${requiresAuth ? 'Private' : 'Public'}\n`;
  controllerContent += `exports.create${resourceNameCapitalized} = asyncHandler(async (req, res, next) => {\n`;
  
  if (requiresAuth) {
    controllerContent += `  // Add user to req.body\n`;
    controllerContent += `  req.body.${ownerField} = req.user.id;\n\n`;
  }
  
  controllerContent += `  const ${resourceName} = await ${resourceNameCapitalized}.create(req.body);\n\n`;
  controllerContent += `  res.status(201).json({\n`;
  controllerContent += `    success: true,\n`;
  controllerContent += `    data: ${resourceName}\n`;
  controllerContent += `  });\n`;
  controllerContent += `});\n\n`;
  
  // Update function
  controllerContent += `// @desc    Update ${resourceName}\n`;
  controllerContent += `// @route   PUT /api/${resourceNamePlural}/:id\n`;
  controllerContent += `// @access  ${requiresAuth ? 'Private' : 'Public'}\n`;
  controllerContent += `exports.update${resourceNameCapitalized} = asyncHandler(async (req, res, next) => {\n`;
  controllerContent += `  let ${resourceName} = await ${resourceNameCapitalized}.findById(req.params.id);\n\n`;
  controllerContent += `  if (!${resourceName}) {\n`;
  controllerContent += `    return next(\n`;
  controllerContent += `      new ErrorResponse(\`${resourceNameCapitalized} not found with id of \${req.params.id}\`, 404)\n`;
  controllerContent += `    );\n`;
  controllerContent += `  }\n\n`;
  
  if (requiresAuth) {
    controllerContent += `  // Make sure user is the owner or an admin\n`;
    controllerContent += `  if (\n`;
    controllerContent += `    ${resourceName}.${ownerField}.toString() !== req.user.id &&\n`;
    controllerContent += `    req.user.role !== 'admin'\n`;
    controllerContent += `  ) {\n`;
    controllerContent += `    return next(\n`;
    controllerContent += `      new ErrorResponse(\`User \${req.user.id} is not authorized to update this ${resourceName}\`, 401)\n`;
    controllerContent += `    );\n`;
    controllerContent += `  }\n\n`;
  }
  
  controllerContent += `  ${resourceName} = await ${resourceNameCapitalized}.findByIdAndUpdate(req.params.id, req.body, {\n`;
  controllerContent += `    new: true,\n`;
  controllerContent += `    runValidators: true\n`;
  controllerContent += `  });\n\n`;
  controllerContent += `  res.status(200).json({\n`;
  controllerContent += `    success: true,\n`;
  controllerContent += `    data: ${resourceName}\n`;
  controllerContent += `  });\n`;
  controllerContent += `});\n\n`;
  
  // Delete function
  controllerContent += `// @desc    Delete ${resourceName}\n`;
  controllerContent += `// @route   DELETE /api/${resourceNamePlural}/:id\n`;
  controllerContent += `// @access  ${requiresAuth ? 'Private' : 'Public'}\n`;
  controllerContent += `exports.delete${resourceNameCapitalized} = asyncHandler(async (req, res, next) => {\n`;
  controllerContent += `  const ${resourceName} = await ${resourceNameCapitalized}.findById(req.params.id);\n\n`;
  controllerContent += `  if (!${resourceName}) {\n`;
  controllerContent += `    return next(\n`;
  controllerContent += `      new ErrorResponse(\`${resourceNameCapitalized} not found with id of \${req.params.id}\`, 404)\n`;
  controllerContent += `    );\n`;
  controllerContent += `  }\n\n`;
  
  if (requiresAuth) {
    controllerContent += `  // Make sure user is the owner or an admin\n`;
    controllerContent += `  if (\n`;
    controllerContent += `    ${resourceName}.${ownerField}.toString() !== req.user.id &&\n`;
    controllerContent += `    req.user.role !== 'admin'\n`;
    controllerContent += `  ) {\n`;
    controllerContent += `    return next(\n`;
    controllerContent += `      new ErrorResponse(\`User \${req.user.id} is not authorized to delete this ${resourceName}\`, 401)\n`;
    controllerContent += `    );\n`;
    controllerContent += `  }\n\n`;
  }
  
  controllerContent += `  await ${resourceName}.remove();\n\n`;
  controllerContent += `  res.status(200).json({\n`;
  controllerContent += `    success: true,\n`;
  controllerContent += `    data: {}\n`;
  controllerContent += `  });\n`;
  controllerContent += `});\n`;
  
  // Write to file
  fs.writeFileSync(controllerPath, controllerContent);
  console.log(`${colors.green}✓ Created controller at ${controllerPath}${colors.reset}`);
};

// Generate routes file
const generateRoutes = async (resourceName, resourceNamePlural, requiresAuth) => {
  const routesPath = path.join(srcDir, 'routes', `${resourceName}.routes.js`);
  
  // Check if file already exists
  if (fs.existsSync(routesPath)) {
    const overwrite = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Routes file already exists. Overwrite? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (!overwrite) {
      console.log(`${colors.yellow}Skipping routes generation${colors.reset}`);
      return;
    }
  }
  
  let routesContent = `const express = require('express');\n`;
  routesContent += `const {\n`;
  routesContent += `  get${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}s,\n`;
  routesContent += `  get${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)},\n`;
  routesContent += `  create${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)},\n`;
  routesContent += `  update${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)},\n`;
  routesContent += `  delete${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}\n`;
  routesContent += `} = require('../controllers/${resourceName}.controller');\n\n`;
  
  if (requiresAuth) {
    routesContent += `const { protect, authorize } = require('../middleware/auth');\n\n`;
  }
  
  routesContent += `const router = express.Router();\n\n`;
  
  // Add routes
  if (requiresAuth) {
    routesContent += `router\n`;
    routesContent += `  .route('/')\n`;
    routesContent += `  .get(protect, get${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}s)\n`;
    routesContent += `  .post(protect, create${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)});\n\n`;
    
    routesContent += `router\n`;
    routesContent += `  .route('/:id')\n`;
    routesContent += `  .get(protect, get${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)})\n`;
    routesContent += `  .put(protect, update${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)})\n`;
    routesContent += `  .delete(protect, delete${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)});\n\n`;
  } else {
    routesContent += `router\n`;
    routesContent += `  .route('/')\n`;
    routesContent += `  .get(get${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}s)\n`;
    routesContent += `  .post(create${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)});\n\n`;
    
    routesContent += `router\n`;
    routesContent += `  .route('/:id')\n`;
    routesContent += `  .get(get${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)})\n`;
    routesContent += `  .put(update${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)})\n`;
    routesContent += `  .delete(delete${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)});\n\n`;
  }
  
  routesContent += `module.exports = router;\n`;
  
  // Write to file
  fs.writeFileSync(routesPath, routesContent);
  console.log(`${colors.green}✓ Created routes at ${routesPath}${colors.reset}`);
};

// Update routes index file
const updateRoutesIndex = async (resourceName, resourceNamePlural) => {
  const indexPath = path.join(srcDir, 'routes', 'index.js');
  
  // Check if index file exists, create if not
  if (!fs.existsSync(indexPath)) {
    let indexContent = `const express = require('express');\n\n`;
    indexContent += `// Import route files\n`;
    indexContent += `const ${resourceName}Routes = require('./${resourceName}.routes');\n\n`;
    indexContent += `const router = express.Router();\n\n`;
    indexContent += `// Mount routers\n`;
    indexContent += `router.use('/${resourceNamePlural}', ${resourceName}Routes);\n\n`;
    indexContent += `module.exports = router;\n`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`${colors.green}✓ Created routes index at ${indexPath}${colors.reset}`);
    return;
  }
  
  // Read existing index file
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if route is already imported
  if (indexContent.includes(`require('./${resourceName}.routes')`)) {
    console.log(`${colors.yellow}Route already imported in index file${colors.reset}`);
  } else {
    // Add import
    const importPattern = /\/\/ Import route files\n/;
    const importReplacement = `// Import route files\nconst ${resourceName}Routes = require('./${resourceName}.routes');\n`;
    
    if (importPattern.test(indexContent)) {
      indexContent = indexContent.replace(importPattern, importReplacement);
    } else {
      // Fallback if pattern not found
      const routerPattern = /const router = express.Router\(\);\n\n/;
      if (routerPattern.test(indexContent)) {
        indexContent = indexContent.replace(
          routerPattern, 
          `const router = express.Router();\n\n// Import route files\nconst ${resourceName}Routes = require('./${resourceName}.routes');\n\n`
        );
      } else {
        // Last resort, add at the top after first require
        indexContent = indexContent.replace(
          /const express = require\('express'\);\n/,
          `const express = require('express');\nconst ${resourceName}Routes = require('./${resourceName}.routes');\n`
        );
      }
    }
  }
  
  // Check if route is already mounted
  if (indexContent.includes(`router.use('/${resourceNamePlural}'`)) {
    console.log(`${colors.yellow}Route already mounted in index file${colors.reset}`);
  } else {
    // Add mount
    const mountPattern = /\/\/ Mount routers\n/;
    const mountReplacement = `// Mount routers\nrouter.use('/${resourceNamePlural}', ${resourceName}Routes);\n`;
    
    if (mountPattern.test(indexContent)) {
      indexContent = indexContent.replace(mountPattern, mountReplacement);
    } else {
      // Fallback if pattern not found
      const modulePattern = /module.exports = router;\n/;
      if (modulePattern.test(indexContent)) {
        indexContent = indexContent.replace(
          modulePattern,
          `// Mount routers\nrouter.use('/${resourceNamePlural}', ${resourceName}Routes);\n\nmodule.exports = router;\n`
        );
      } else {
        // Last resort, add at the end
        indexContent += `\n// Mount routers\nrouter.use('/${resourceNamePlural}', ${resourceName}Routes);\n\n`;
      }
    }
  }
  
  // Write updated content
  fs.writeFileSync(indexPath, indexContent);
  console.log(`${colors.green}✓ Updated routes index at ${indexPath}${colors.reset}`);
};

// Start the program
main().catch(err => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  rl.close();
}); 