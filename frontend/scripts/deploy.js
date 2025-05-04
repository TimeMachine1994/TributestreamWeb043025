#!/usr/bin/env node

/**
 * TributeStream Frontend Deployment Script
 * 
 * This script handles the deployment of the TributeStream frontend
 * to different environments (development, staging, production).
 * 
 * Usage:
 *   node scripts/deploy.js [environment]
 * 
 * Where environment is one of:
 *   - dev (default)
 *   - staging
 *   - prod
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration for different environments
const environments = {
  dev: {
    name: 'Development',
    apiUrl: 'http://localhost:1337',
    buildCommand: 'npm run build',
    deployCommand: 'npm run preview',
    envFile: '.env.development'
  },
  staging: {
    name: 'Staging',
    apiUrl: 'https://api-staging.tributestream.com',
    buildCommand: 'npm run build',
    deployCommand: 'aws s3 sync build/ s3://tributestream-staging-frontend --delete',
    envFile: '.env.staging'
  },
  prod: {
    name: 'Production',
    apiUrl: 'https://api.tributestream.com',
    buildCommand: 'npm run build',
    deployCommand: 'aws s3 sync build/ s3://tributestream-frontend --delete && aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"',
    envFile: '.env.production'
  }
};

// Get environment from command line arguments
const targetEnv = process.argv[2] || 'dev';

// Validate environment
if (!environments[targetEnv]) {
  console.error(`❌ Invalid environment: ${targetEnv}`);
  console.error('Valid environments: dev, staging, prod');
  process.exit(1);
}

// Get environment configuration
const envConfig = environments[targetEnv];

// Log deployment start
console.log(`🚀 Starting deployment to ${envConfig.name} environment`);
console.log(`📋 Environment details:`);
console.log(`   - API URL: ${envConfig.apiUrl}`);
console.log(`   - Build command: ${envConfig.buildCommand}`);
console.log(`   - Deploy command: ${envConfig.deployCommand}`);
console.log(`   - Environment file: ${envConfig.envFile}`);

// Function to confirm deployment
function confirmDeployment() {
  return new Promise((resolve) => {
    rl.question(`\n⚠️ Are you sure you want to deploy to ${envConfig.name}? (y/n) `, (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        resolve(true);
      } else {
        console.log('❌ Deployment cancelled');
        resolve(false);
      }
    });
  });
}

// Function to check if environment file exists
function checkEnvFile() {
  const envFilePath = path.join(process.cwd(), envConfig.envFile);
  
  if (!fs.existsSync(envFilePath)) {
    console.error(`❌ Environment file not found: ${envConfig.envFile}`);
    console.error(`Please create the environment file with the required variables.`);
    return false;
  }
  
  console.log(`✅ Environment file found: ${envConfig.envFile}`);
  return true;
}

// Function to run tests before deployment
async function runTests() {
  console.log('\n🧪 Running tests before deployment...');
  
  try {
    execSync('npm run test', { stdio: 'inherit' });
    console.log('✅ Tests passed');
    return true;
  } catch (error) {
    console.error('❌ Tests failed');
    
    return new Promise((resolve) => {
      rl.question('\n⚠️ Tests failed. Continue with deployment anyway? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log('⚠️ Continuing deployment despite test failures');
          resolve(true);
        } else {
          console.log('❌ Deployment cancelled due to test failures');
          resolve(false);
        }
      });
    });
  }
}

// Function to build the application
function buildApp() {
  console.log(`\n🔨 Building application for ${envConfig.name}...`);
  
  try {
    // Copy environment file to .env
    fs.copyFileSync(
      path.join(process.cwd(), envConfig.envFile),
      path.join(process.cwd(), '.env')
    );
    
    // Run build command
    execSync(envConfig.buildCommand, { stdio: 'inherit' });
    
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.error('❌ Build failed');
    console.error(error.message);
    return false;
  }
}

// Function to deploy the application
function deployApp() {
  console.log(`\n📦 Deploying application to ${envConfig.name}...`);
  
  try {
    // Run deploy command
    execSync(envConfig.deployCommand, { stdio: 'inherit' });
    
    console.log('✅ Deployment successful');
    return true;
  } catch (error) {
    console.error('❌ Deployment failed');
    console.error(error.message);
    return false;
  }
}

// Main deployment function
async function deploy() {
  // Check environment file
  if (!checkEnvFile()) {
    rl.close();
    return;
  }
  
  // Confirm deployment
  const confirmed = await confirmDeployment();
  if (!confirmed) {
    rl.close();
    return;
  }
  
  // Run tests
  const testsPass = await runTests();
  if (!testsPass) {
    rl.close();
    return;
  }
  
  // Build application
  const buildSuccess = buildApp();
  if (!buildSuccess) {
    rl.close();
    return;
  }
  
  // Deploy application
  const deploySuccess = deployApp();
  if (!deploySuccess) {
    rl.close();
    return;
  }
  
  console.log(`\n🎉 Deployment to ${envConfig.name} completed successfully!`);
  
  // Close readline interface
  rl.close();
}

// Start deployment
deploy();