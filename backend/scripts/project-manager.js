#!/usr/bin/env node

/**
 * Project Manager Script
 * 
 * A command-line tool to manage various aspects of the project.
 * Serves as a central hub for running other scripts and tasks.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
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
const projectRoot = path.resolve(rootDir, '..');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Available script categories and commands
const scripts = {
  'Configuration': {
    'config-list': {
      description: 'List all environment variables',
      command: 'npm run config list',
      cwd: projectRoot
    },
    'config-check': {
      description: 'Check required environment variables',
      command: 'npm run config check',
      cwd: projectRoot
    },
    'config-create': {
      description: 'Create a .env file template',
      command: 'npm run config create',
      cwd: projectRoot
    }
  },
  'API Development': {
    'generate-api': {
      description: 'Generate RESTful API endpoints',
      command: 'npm run generate-api',
      cwd: projectRoot
    },
    'swagger': {
      description: 'Generate Swagger documentation',
      command: 'npm run docs swagger',
      cwd: projectRoot
    },
    'postman': {
      description: 'Generate Postman collection',
      command: 'npm run docs postman',
      cwd: projectRoot
    }
  },
  'Testing': {
    'test-setup': {
      description: 'Set up test environment',
      command: 'npm run test-setup setup',
      cwd: projectRoot
    },
    'run-tests': {
      description: 'Run all tests',
      command: 'cd backend && npm test',
      cwd: projectRoot
    },
    'test-watch': {
      description: 'Run tests in watch mode',
      command: 'cd backend && npm run test:watch',
      cwd: projectRoot
    },
    'test-coverage': {
      description: 'Generate test coverage report',
      command: 'cd backend && npm run test:coverage',
      cwd: projectRoot
    }
  },
  'Development': {
    'frontend': {
      description: 'Start frontend development server',
      command: 'cd project-shooting-star && npm run dev',
      cwd: projectRoot
    },
    'backend': {
      description: 'Start backend development server',
      command: 'cd backend && npm run dev',
      cwd: projectRoot
    },
    'dev': {
      description: 'Start both frontend and backend',
      command: 'npm run dev',
      cwd: projectRoot
    },
    'lint': {
      description: 'Run ESLint on backend',
      command: 'cd backend && npm run lint',
      cwd: projectRoot
    },
    'lint:fix': {
      description: 'Fix ESLint errors on backend',
      command: 'cd backend && npm run lint:fix',
      cwd: projectRoot
    }
  },
  'Database': {
    'db:seed': {
      description: 'Seed database with sample data',
      command: 'cd backend && node src/utils/seeder.js',
      cwd: projectRoot
    },
    'db:clear': {
      description: 'Clear all data from database',
      command: 'cd backend && node src/utils/seeder.js --clear',
      cwd: projectRoot
    },
    'db:reset': {
      description: 'Reset database (clear and reseed)',
      command: 'cd backend && node src/utils/seeder.js --reset',
      cwd: projectRoot
    }
  },
  'Deployment': {
    'build': {
      description: 'Build frontend for production',
      command: 'cd project-shooting-star && npm run build',
      cwd: projectRoot
    },
    'start:prod': {
      description: 'Start backend in production mode',
      command: 'cd backend && npm start',
      cwd: projectRoot
    }
  }
};

// Main menu display
const showMainMenu = async () => {
  console.clear();
  console.log(`\n${colors.bright}Project Shooting Star - Project Manager${colors.reset}\n`);
  
  // Display categories
  let categoryIndex = 1;
  const categories = Object.keys(scripts);
  
  console.log(`${colors.cyan}Categories:${colors.reset}`);
  categories.forEach(category => {
    console.log(`  ${colors.green}${categoryIndex}.${colors.reset} ${category}`);
    categoryIndex++;
  });
  
  console.log(`\n  ${colors.red}0.${colors.reset} Exit`);
  
  // Get user selection
  const selection = await new Promise((resolve) => {
    rl.question(`\n${colors.cyan}Select a category (0-${categories.length}): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  // Process selection
  if (selection === '0') {
    console.log(`\n${colors.green}Goodbye!${colors.reset}`);
    rl.close();
    return;
  }
  
  const categoryNum = parseInt(selection);
  if (isNaN(categoryNum) || categoryNum < 1 || categoryNum > categories.length) {
    console.log(`\n${colors.red}Invalid selection. Please try again.${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return showMainMenu();
  }
  
  const selectedCategory = categories[categoryNum - 1];
  await showCategoryMenu(selectedCategory);
};

// Category menu display
const showCategoryMenu = async (category) => {
  console.clear();
  console.log(`\n${colors.bright}Category: ${colors.cyan}${category}${colors.reset}\n`);
  
  // Display commands
  let commandIndex = 1;
  const commands = Object.keys(scripts[category]);
  
  console.log(`${colors.cyan}Available commands:${colors.reset}`);
  commands.forEach(command => {
    console.log(`  ${colors.green}${commandIndex}.${colors.reset} ${command} - ${scripts[category][command].description}`);
    commandIndex++;
  });
  
  console.log(`\n  ${colors.yellow}B.${colors.reset} Back to main menu`);
  console.log(`  ${colors.red}0.${colors.reset} Exit`);
  
  // Get user selection
  const selection = await new Promise((resolve) => {
    rl.question(`\n${colors.cyan}Select a command (0-${commands.length}, B): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  // Process selection
  if (selection === '0') {
    console.log(`\n${colors.green}Goodbye!${colors.reset}`);
    rl.close();
    return;
  }
  
  if (selection.toLowerCase() === 'b') {
    return showMainMenu();
  }
  
  const commandNum = parseInt(selection);
  if (isNaN(commandNum) || commandNum < 1 || commandNum > commands.length) {
    console.log(`\n${colors.red}Invalid selection. Please try again.${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return showCategoryMenu(category);
  }
  
  const selectedCommand = commands[commandNum - 1];
  await runCommand(category, selectedCommand);
};

// Run a command
const runCommand = async (category, command) => {
  console.clear();
  console.log(`\n${colors.bright}Running: ${colors.cyan}${command}${colors.reset} (${colors.dim}${scripts[category][command].description}${colors.reset})\n`);
  
  try {
    const commandStr = scripts[category][command].command;
    const cwd = scripts[category][command].cwd || projectRoot;
    
    // Handle interactive commands with spawn
    const child = spawn(commandStr, {
      shell: true,
      stdio: 'inherit',
      cwd
    });
    
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
    
    console.log(`\n${colors.green}Command completed successfully.${colors.reset}`);
  } catch (err) {
    console.error(`\n${colors.red}Error: ${err.message}${colors.reset}`);
  }
  
  console.log('\n');
  
  const next = await new Promise((resolve) => {
    rl.question(`${colors.cyan}What would you like to do next? ${colors.reset}(${colors.green}B${colors.reset}ack to category, ${colors.yellow}M${colors.reset}ain menu, ${colors.red}E${colors.reset}xit): `, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
  
  if (next === 'e') {
    console.log(`\n${colors.green}Goodbye!${colors.reset}`);
    rl.close();
    return;
  } else if (next === 'm') {
    return showMainMenu();
  } else {
    return showCategoryMenu(category);
  }
};

// Project status summary
const showProjectStatus = async () => {
  console.clear();
  console.log(`\n${colors.bright}Project Shooting Star - Status${colors.reset}\n`);
  
  try {
    // Check backend dependencies
    console.log(`${colors.cyan}Backend dependencies:${colors.reset}`);
    try {
      const backendNodeModules = path.join(rootDir, 'node_modules');
      if (fs.existsSync(backendNodeModules)) {
        console.log(`  ${colors.green}✓${colors.reset} Installed`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Not installed`);
      }
    } catch (err) {
      console.log(`  ${colors.red}✗${colors.reset} Error checking: ${err.message}`);
    }
    
    // Check frontend dependencies
    console.log(`${colors.cyan}Frontend dependencies:${colors.reset}`);
    try {
      const frontendNodeModules = path.join(projectRoot, 'project-shooting-star', 'node_modules');
      if (fs.existsSync(frontendNodeModules)) {
        console.log(`  ${colors.green}✓${colors.reset} Installed`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Not installed`);
      }
    } catch (err) {
      console.log(`  ${colors.red}✗${colors.reset} Error checking: ${err.message}`);
    }
    
    // Check configuration
    console.log(`${colors.cyan}Configuration:${colors.reset}`);
    try {
      const envFile = path.join(rootDir, '.env');
      if (fs.existsSync(envFile)) {
        console.log(`  ${colors.green}✓${colors.reset} .env file exists`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} .env file missing`);
      }
    } catch (err) {
      console.log(`  ${colors.red}✗${colors.reset} Error checking: ${err.message}`);
    }
    
    // Check git status (if in git repo)
    console.log(`${colors.cyan}Git status:${colors.reset}`);
    try {
      const gitDir = path.join(projectRoot, '.git');
      if (fs.existsSync(gitDir)) {
        try {
          const gitStatus = execSync('git status --porcelain', { cwd: projectRoot }).toString();
          if (gitStatus.trim() === '') {
            console.log(`  ${colors.green}✓${colors.reset} Repository is clean`);
          } else {
            const changes = gitStatus.split('\n').filter(Boolean).length;
            console.log(`  ${colors.yellow}!${colors.reset} ${changes} uncommitted change(s)`);
          }
        } catch (err) {
          console.log(`  ${colors.red}✗${colors.reset} Error running git status`);
        }
      } else {
        console.log(`  ${colors.yellow}!${colors.reset} Not a git repository`);
      }
    } catch (err) {
      console.log(`  ${colors.red}✗${colors.reset} Error checking: ${err.message}`);
    }
    
    // Show server status
    console.log(`${colors.cyan}Server status:${colors.reset}`);
    try {
      const checkPort = (port) => {
        try {
          execSync(`lsof -i:${port} -sTCP:LISTEN -t`);
          return true;
        } catch (err) {
          return false;
        }
      };
      
      if (checkPort(3000)) {
        console.log(`  ${colors.green}✓${colors.reset} Backend server running on port 3000`);
      } else {
        console.log(`  ${colors.yellow}!${colors.reset} Backend server not running`);
      }
      
      if (checkPort(5173)) {
        console.log(`  ${colors.green}✓${colors.reset} Frontend server running on port 5173`);
      } else {
        console.log(`  ${colors.yellow}!${colors.reset} Frontend server not running`);
      }
    } catch (err) {
      console.log(`  ${colors.red}✗${colors.reset} Error checking server status: ${err.message}`);
    }
  } catch (err) {
    console.error(`\n${colors.red}Error checking project status: ${err.message}${colors.reset}`);
  }
  
  console.log('\n');
  
  const next = await new Promise((resolve) => {
    rl.question(`${colors.cyan}Press Enter to continue to main menu...${colors.reset}`, () => {
      resolve();
    });
  });
  
  return showMainMenu();
};

// Custom project menu
const showCustomActions = async () => {
  console.clear();
  console.log(`\n${colors.bright}Project Shooting Star - Quick Actions${colors.reset}\n`);
  
  const actions = [
    {
      name: 'Start full development environment',
      command: 'npm run dev',
      cwd: projectRoot
    },
    {
      name: 'Install all dependencies',
      command: 'npm run install-all',
      cwd: projectRoot
    },
    {
      name: 'Generate API documentation',
      command: 'npm run docs swagger',
      cwd: projectRoot
    },
    {
      name: 'Run all tests',
      command: 'cd backend && npm test',
      cwd: projectRoot
    },
    {
      name: 'Clean build and install',
      command: 'rm -rf node_modules && cd backend && rm -rf node_modules && cd ../project-shooting-star && rm -rf node_modules && cd .. && npm install && cd backend && npm install && cd ../project-shooting-star && npm install',
      cwd: projectRoot
    }
  ];
  
  // Display actions
  console.log(`${colors.cyan}Quick Actions:${colors.reset}`);
  actions.forEach((action, index) => {
    console.log(`  ${colors.green}${index + 1}.${colors.reset} ${action.name}`);
  });
  
  console.log(`\n  ${colors.yellow}B.${colors.reset} Back to main menu`);
  console.log(`  ${colors.red}0.${colors.reset} Exit`);
  
  // Get user selection
  const selection = await new Promise((resolve) => {
    rl.question(`\n${colors.cyan}Select an action (0-${actions.length}, B): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  // Process selection
  if (selection === '0') {
    console.log(`\n${colors.green}Goodbye!${colors.reset}`);
    rl.close();
    return;
  }
  
  if (selection.toLowerCase() === 'b') {
    return showMainMenu();
  }
  
  const actionNum = parseInt(selection);
  if (isNaN(actionNum) || actionNum < 1 || actionNum > actions.length) {
    console.log(`\n${colors.red}Invalid selection. Please try again.${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return showCustomActions();
  }
  
  const selectedAction = actions[actionNum - 1];
  
  console.clear();
  console.log(`\n${colors.bright}Running: ${colors.cyan}${selectedAction.name}${colors.reset}\n`);
  
  try {
    const child = spawn(selectedAction.command, {
      shell: true,
      stdio: 'inherit',
      cwd: selectedAction.cwd
    });
    
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
    
    console.log(`\n${colors.green}Command completed successfully.${colors.reset}`);
  } catch (err) {
    console.error(`\n${colors.red}Error: ${err.message}${colors.reset}`);
  }
  
  console.log('\n');
  
  const next = await new Promise((resolve) => {
    rl.question(`${colors.cyan}Press Enter to return to quick actions...${colors.reset}`, () => {
      resolve();
    });
  });
  
  return showCustomActions();
};

// Start the application
const start = async () => {
  console.clear();
  console.log(`\n${colors.bright}${colors.green}Project Shooting Star - Project Manager${colors.reset}\n`);
  console.log(`${colors.dim}A comprehensive project management tool${colors.reset}\n`);
  
  console.log(`${colors.cyan}Select an option:${colors.reset}`);
  console.log(`  ${colors.green}1.${colors.reset} Show project status`);
  console.log(`  ${colors.green}2.${colors.reset} Main menu`);
  console.log(`  ${colors.green}3.${colors.reset} Quick actions`);
  console.log(`  ${colors.red}0.${colors.reset} Exit`);
  
  const selection = await new Promise((resolve) => {
    rl.question(`\n${colors.cyan}Select an option (0-3): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  switch (selection) {
    case '0':
      console.log(`\n${colors.green}Goodbye!${colors.reset}`);
      rl.close();
      break;
    case '1':
      await showProjectStatus();
      break;
    case '2':
      await showMainMenu();
      break;
    case '3':
      await showCustomActions();
      break;
    default:
      console.log(`\n${colors.red}Invalid selection. Please try again.${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await start();
  }
};

// Handle ctrl+c
process.on('SIGINT', () => {
  console.log(`\n${colors.green}Goodbye!${colors.reset}`);
  rl.close();
  process.exit(0);
});

// Start the application
start(); 