/**
 * Setup script for test environment
 * 
 * This script installs the necessary dependencies for running the test scripts
 * and sets up the test environment.
 * 
 * Usage: node setup-test-env.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Utility functions
function log(message, type = 'info') {
  const prefix = {
    info: `${colors.fg.blue}ℹ️ INFO:${colors.reset}`,
    success: `${colors.fg.green}✅ SUCCESS:${colors.reset}`,
    error: `${colors.fg.red}❌ ERROR:${colors.reset}`,
    warning: `${colors.fg.yellow}⚠️ WARNING:${colors.reset}`
  };
  
  console.log(`${prefix[type]} ${message}`);
}

function section(title) {
  console.log(`\n${colors.bg.blue}${colors.fg.white} ${title} ${colors.reset}\n`);
}

// Main function
async function setup() {
  section('SETTING UP TEST ENVIRONMENT');
  
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('package.json not found. Make sure you are running this script from the frontend directory.', 'error');
    process.exit(1);
  }
  
  // Install dependencies
  log('Installing test dependencies...');
  try {
    // Install puppeteer for browser testing
    execSync('npm install --save-dev puppeteer@latest', { stdio: 'inherit' });
    log('Puppeteer installed successfully', 'success');
    
    // Install chalk for colorful console output
    execSync('npm install --save-dev chalk@latest', { stdio: 'inherit' });
    log('Chalk installed successfully', 'success');
    
    // Install node-fetch for API requests
    execSync('npm install --save-dev node-fetch@latest', { stdio: 'inherit' });
    log('Node-fetch installed successfully', 'success');
  } catch (error) {
    log(`Failed to install dependencies: ${error.message}`, 'error');
    process.exit(1);
  }
  
  // Update package.json with test scripts
  log('Updating package.json with test scripts...');
  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Add test scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['test:auth'] = 'node scripts/test-role-auth.js';
    packageJson.scripts['test:ui'] = 'node scripts/test-role-ui.js';
    packageJson.scripts['test:all'] = 'npm run test:auth && npm run test:ui';
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('package.json updated successfully', 'success');
  } catch (error) {
    log(`Failed to update package.json: ${error.message}`, 'error');
  }
  
  // Create .env file for tests if it doesn't exist
  const envPath = path.join(__dirname, '..', '.env.test');
  if (!fs.existsSync(envPath)) {
    log('Creating .env.test file...');
    const envContent = `
# Test environment variables
FRONTEND_URL=http://localhost:5178
API_URL=http://localhost:1338
ADMIN_EMAIL=admin@tributestream.com
ADMIN_PASSWORD=Admin123!
`;
    fs.writeFileSync(envPath, envContent.trim());
    log('.env.test file created successfully', 'success');
  }
  
  // Final instructions
  section('SETUP COMPLETE');
  log('Test environment setup completed successfully', 'success');
  log('You can now run the tests with the following commands:');
  log('  npm run test:auth - Test authentication and permissions');
  log('  npm run test:ui - Test UI components and navigation');
  log('  npm run test:all - Run all tests');
  log('\nMake sure both the frontend and backend servers are running before running the tests.');
}

// Run setup
setup().catch(error => {
  log(`Setup failed: ${error.message}`, 'error');
});