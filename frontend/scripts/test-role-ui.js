/**
 * Test script for role-based UI components and navigation
 * 
 * This script tests the UI components and navigation based on user roles
 * in the TributeStream application by:
 * 1. Testing UI adaptation based on user roles
 * 2. Testing navigation options based on role permissions
 * 3. Testing direct URL access to restricted pages
 * 
 * Usage: node test-role-ui.js
 */

import puppeteer from 'puppeteer';
import chalk from 'chalk';

// Configuration
const FRONTEND_URL = 'http://localhost:5178';
const API_URL = 'http://localhost:1338';

// Test users
const TEST_USERS = {
  funeralDirector: {
    email: 'funeral_director@test.com',
    password: 'Test123!',
    role: 'funeral_director'
  },
  familyContact: {
    email: 'family_contact@test.com',
    password: 'Test123!',
    role: 'family_contact'
  },
  regularUser: {
    email: 'regular_user@test.com',
    password: 'Test123!',
    role: 'authenticated'
  }
};

// Utility functions
const log = {
  info: (message) => console.log(chalk.blue('ℹ️ INFO: ') + message),
  success: (message) => console.log(chalk.green('✅ SUCCESS: ') + message),
  error: (message) => console.log(chalk.red('❌ ERROR: ') + message),
  warning: (message) => console.log(chalk.yellow('⚠️ WARNING: ') + message),
  section: (title) => console.log('\n' + chalk.bgBlue.white(' ' + title + ' ') + '\n')
};

// Helper functions
async function loginUser(page, credentials) {
  try {
    log.info(`Logging in as: ${credentials.email}`);
    
    // Navigate to login page
    await page.goto(`${FRONTEND_URL}/login`);
    
    // Fill in login form
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', credentials.email);
    await page.type('input[name="password"]', credentials.password);
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    
    // Check if login was successful
    const url = page.url();
    if (url.includes('/login')) {
      log.error('Login failed');
      return false;
    }
    
    log.success(`Login successful for: ${credentials.email}`);
    return true;
  } catch (error) {
    log.error(`Error during login: ${error.message}`);
    return false;
  }
}

async function checkElementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function testNavigation(page, path, expectedStatus = 'success') {
  try {
    log.info(`Testing navigation to: ${path}`);
    
    // Navigate to the path
    const response = await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'networkidle0' });
    
    // Check if navigation was successful
    const url = page.url();
    
    if (expectedStatus === 'success') {
      if (url.includes(path)) {
        log.success(`Navigation to ${path} successful`);
        return true;
      } else {
        log.error(`Navigation to ${path} failed. Redirected to: ${url}`);
        return false;
      }
    } else if (expectedStatus === 'redirect') {
      if (!url.includes(path)) {
        log.success(`Navigation to ${path} correctly redirected to: ${url}`);
        return true;
      } else {
        log.error(`Navigation to ${path} should have been redirected but wasn't`);
        return false;
      }
    }
  } catch (error) {
    log.error(`Error testing navigation: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  log.section('ROLE-BASED UI AND NAVIGATION TESTING');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test for each user role
    for (const [roleName, userData] of Object.entries(TEST_USERS)) {
      log.section(`TESTING ${roleName.toUpperCase()} ROLE`);
      
      // Login as the user
      const loginSuccess = await loginUser(page, userData);
      if (!loginSuccess) {
        log.error(`Could not login as ${roleName}. Skipping tests for this role.`);
        continue;
      }
      
      // Test 1: Check UI adaptation based on user role
      log.info('Testing UI adaptation based on user role');
      
      // Check navbar elements
      await page.goto(`${FRONTEND_URL}/`);
      
      // All authenticated users should see the Family Dashboard link
      const hasFamilyDashboard = await checkElementExists(page, 'a[href="/family-dashboard"]');
      if (hasFamilyDashboard) {
        log.success('Family Dashboard link is visible');
      } else {
        log.error('Family Dashboard link is not visible but should be');
      }
      
      // Only Funeral Directors should see the Create Tribute link
      const hasCreateTribute = await checkElementExists(page, 'a[href="/createTribute"]');
      if (roleName === 'funeralDirector' && hasCreateTribute) {
        log.success('Create Tribute link is visible for Funeral Director');
      } else if (roleName !== 'funeralDirector' && !hasCreateTribute) {
        log.success('Create Tribute link is correctly hidden for non-Funeral Director');
      } else if (roleName === 'funeralDirector' && !hasCreateTribute) {
        log.error('Create Tribute link is not visible but should be for Funeral Director');
      } else {
        log.error('Create Tribute link is visible but should be hidden for non-Funeral Director');
      }
      
      // Test 2: Test navigation options based on role permissions
      log.info('Testing navigation options based on role permissions');
      
      // Family Dashboard should be accessible to all authenticated users
      await testNavigation(page, '/family-dashboard', 'success');
      
      // Create Tribute should only be accessible to Funeral Directors
      if (roleName === 'funeralDirector') {
        await testNavigation(page, '/createTribute', 'success');
      } else {
        await testNavigation(page, '/createTribute', 'redirect');
      }
      
      // Test 3: Test direct URL access to restricted pages
      log.info('Testing direct URL access to restricted pages');
      
      // Try to access Create Tribute directly
      if (roleName === 'funeralDirector') {
        await testNavigation(page, '/createTribute', 'success');
      } else {
        await testNavigation(page, '/createTribute', 'redirect');
      }
      
      // Logout
      await page.goto(`${FRONTEND_URL}/`);
      const logoutButton = await page.$('button:has-text("Logout")');
      if (logoutButton) {
        await Promise.all([
          logoutButton.click(),
          page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);
        log.success('Logged out successfully');
      } else {
        log.error('Could not find logout button');
      }
    }
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Summary
  log.section('TEST SUMMARY');
  log.info('Role-based UI and navigation testing completed');
  log.info('Check the logs above for detailed results');
}

// Run the tests
runTests().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
});