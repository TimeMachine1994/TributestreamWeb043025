#!/usr/bin/env node

import http from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load configuration from .env file if it exists
let STRAPI_URL = 'http://localhost:1338'; // Default fallback
let STRAPI_PORT = 1338;

// Path to potential .env file
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const [key, value] = line.split('=');
      if (key === 'PUBLIC_STRAPI_URL' && value) {
        STRAPI_URL = value.trim();
      }
      if (key === 'PUBLIC_STRAPI_PORT' && value) {
        STRAPI_PORT = parseInt(value.trim(), 10);
      }
    }
    
    // If we have both URL and port, construct the full URL
    if (STRAPI_URL && STRAPI_PORT) {
      // Only add port if not already in URL and not standard HTTP/HTTPS port
      if (!STRAPI_URL.includes(':') &&
          !(STRAPI_URL.startsWith('http://') && STRAPI_PORT === 80) &&
          !(STRAPI_URL.startsWith('https://') && STRAPI_PORT === 443)) {
        STRAPI_URL = `${STRAPI_URL}:${STRAPI_PORT}`;
      }
    }
  } catch (error) {
    console.log(`⚠️ Error reading .env file: ${error.message}`);
  }
}

const BACKEND_PATH = path.resolve(__dirname, '../../backend/database');

console.log('📊 TributeStream Backend Connection Checker');
console.log('------------------------------------------');
console.log(`🔍 Checking if Strapi is running at ${STRAPI_URL}...`);

// Function to start Strapi
function startStrapi() {
  console.log('🚀 Starting Strapi backend...');
  console.log(`📁 Backend path: ${BACKEND_PATH}`);
  
  const strapiProcess = exec('npm run develop', { cwd: BACKEND_PATH });
  
  strapiProcess.stdout.on('data', (data) => {
    console.log(`🟢 Strapi: ${data.trim()}`);
    
    // Check for successful startup message
    if (data.includes('Server listening on') || data.includes('To access the server')) {
      console.log('✅ Strapi backend started successfully!');
      console.log('🔗 You can now access the family dashboard');
    }
  });
  
  strapiProcess.stderr.on('data', (data) => {
    console.log(`🔴 Strapi Error: ${data.trim()}`);
  });
  
  strapiProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`❌ Strapi process exited with code ${code}`);
    }
  });
  
  console.log('⏳ Starting Strapi (this may take a minute)...');
  console.log('📝 Look for the "Server listening on" message');
}

// Test connection to Strapi
const req = http.request(`${STRAPI_URL}/api/tributes`, { method: 'GET', timeout: 5000 }, (res) => {
  // Any response (even 403 Forbidden) means the server is running
  // We just need to know if Strapi is responding, not if we have access
  if (res.statusCode !== 404) {
    console.log('✅ Strapi backend is running!');
    process.exit(0);
  } else {
    console.log(`⚠️ Strapi responded with status code: ${res.statusCode}`);
    console.log('🔄 Starting Strapi backend...');
    startStrapi();
  }
});

req.on('error', (err) => {
  console.log(`❌ Strapi connection error: ${err.message}`);
  console.log('💡 This usually means Strapi is not running');
  startStrapi();
});

req.on('timeout', () => {
  console.log('⏱️ Connection to Strapi timed out');
  req.destroy();
  startStrapi();
});

req.end();