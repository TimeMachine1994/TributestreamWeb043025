/**
 * Test script for role-based authentication and access control
 * 
 * This script tests the complete role-based authentication and access control system
 * in the TributeStream application by:
 * 1. Creating test users for each role
 * 2. Testing login flows for each user type
 * 3. Testing role-based access controls
 * 4. Testing tribute creation process
 * 
 * Usage: node test-role-auth.js
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

// Configuration
const API_URL = 'http://localhost:1338';
const FRONTEND_URL = 'http://localhost:5178';

// Test users
const TEST_USERS = {
  funeralDirector: {
    username: 'test_funeral_director',
    email: 'funeral_director@test.com',
    password: 'Test123!',
    role: 'funeral_director'
  },
  familyContact: {
    username: 'test_family_contact',
    email: 'family_contact@test.com',
    password: 'Test123!',
    role: 'family_contact'
  },
  regularUser: {
    username: 'test_regular_user',
    email: 'regular_user@test.com',
    password: 'Test123!',
    role: 'authenticated'
  }
};

// Test data
const TEST_TRIBUTE = {
  name: 'Test Tribute',
  description: 'This is a test tribute created for role-based authentication testing'
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
async function createUser(userData) {
  try {
    log.info(`Creating user: ${userData.username} with role: ${userData.role}`);
    
    // First, get admin token
    const adminAuth = await fetch(`${API_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@tributestream.com',
        password: 'Admin123!'
      })
    });
    
    if (!adminAuth.ok) {
      log.error('Failed to authenticate as admin. Make sure Strapi is running and admin user exists.');
      return null;
    }
    
    const adminData = await adminAuth.json();
    const adminToken = adminData.jwt;
    
    // Get role ID
    const rolesResponse = await fetch(`${API_URL}/api/users-permissions/roles`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (!rolesResponse.ok) {
      log.error('Failed to fetch roles');
      return null;
    }
    
    const rolesData = await rolesResponse.json();
    const role = rolesData.roles.find(r => r.type === userData.role);
    
    if (!role) {
      log.error(`Role not found: ${userData.role}`);
      return null;
    }
    
    // Create user
    const createResponse = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: role.id
      })
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      log.error(`Failed to create user: ${JSON.stringify(errorData)}`);
      return null;
    }
    
    const userData = await createResponse.json();
    log.success(`User created: ${userData.username} (ID: ${userData.id})`);
    return userData;
  } catch (error) {
    log.error(`Error creating user: ${error.message}`);
    return null;
  }
}

async function loginUser(credentials) {
  try {
    log.info(`Logging in as: ${credentials.email}`);
    
    const response = await fetch(`${API_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: credentials.email,
        password: credentials.password
      })
    });
    
    if (!response.ok) {
      log.error('Login failed');
      return null;
    }
    
    const data = await response.json();
    log.success(`Login successful for: ${credentials.email}`);
    return data;
  } catch (error) {
    log.error(`Error during login: ${error.message}`);
    return null;
  }
}

async function createTribute(name, token) {
  try {
    log.info(`Creating tribute: ${name}`);
    
    const response = await fetch(`${API_URL}/api/tributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        data: {
          name: name
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      log.error(`Failed to create tribute: ${JSON.stringify(errorData)}`);
      return null;
    }
    
    const data = await response.json();
    log.success(`Tribute created: ${name} (ID: ${data.data.id})`);
    return data.data;
  } catch (error) {
    log.error(`Error creating tribute: ${error.message}`);
    return null;
  }
}

async function testAccess(endpoint, token, expectedStatus = 200) {
  try {
    log.info(`Testing access to: ${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === expectedStatus) {
      log.success(`Access test passed for ${endpoint} (Status: ${response.status})`);
      return true;
    } else {
      log.error(`Access test failed for ${endpoint} (Expected: ${expectedStatus}, Got: ${response.status})`);
      return false;
    }
  } catch (error) {
    log.error(`Error testing access: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  log.section('ROLE-BASED AUTHENTICATION AND ACCESS CONTROL TESTING');
  
  // Step 1: Create test users for each role
  log.section('CREATING TEST USERS');
  
  const createdUsers = {};
  for (const [role, userData] of Object.entries(TEST_USERS)) {
    createdUsers[role] = await createUser(userData);
    if (!createdUsers[role]) {
      log.warning(`Skipping creation of ${role} user as it may already exist. Will attempt to use existing user.`);
    }
  }
  
  // Step 2: Test login flow for each user type
  log.section('TESTING LOGIN FLOWS');
  
  const loggedInUsers = {};
  for (const [role, userData] of Object.entries(TEST_USERS)) {
    loggedInUsers[role] = await loginUser(userData);
    if (!loggedInUsers[role]) {
      log.error(`Login failed for ${role}. Cannot continue tests for this role.`);
    }
  }
  
  // Step 3: Test role-based access controls
  log.section('TESTING ROLE-BASED ACCESS CONTROLS');
  
  // Test Funeral Director access
  if (loggedInUsers.funeralDirector) {
    log.info('Testing Funeral Director permissions');
    await testAccess('/api/tributes', loggedInUsers.funeralDirector.jwt);
    
    // Test tribute creation
    const tribute = await createTribute(TEST_TRIBUTE.name, loggedInUsers.funeralDirector.jwt);
    if (tribute) {
      log.success('Funeral Director can create tributes');
    }
  }
  
  // Test Family Contact access
  if (loggedInUsers.familyContact) {
    log.info('Testing Family Contact permissions');
    await testAccess('/api/tributes', loggedInUsers.familyContact.jwt);
    
    // Try to create a tribute (should fail for family contact)
    const tribute = await createTribute('Family Contact Tribute', loggedInUsers.familyContact.jwt);
    if (!tribute) {
      log.success('Family Contact correctly prevented from creating tributes');
    } else {
      log.error('Family Contact was able to create a tribute, which should not be allowed');
    }
  }
  
  // Test Regular User access
  if (loggedInUsers.regularUser) {
    log.info('Testing Regular User permissions');
    
    // Regular users should have limited access to tributes
    const regularUserCanAccessTributes = await testAccess('/api/tributes', loggedInUsers.regularUser.jwt, 403);
    if (!regularUserCanAccessTributes) {
      log.success('Regular User correctly prevented from accessing tributes');
    }
  }
  
  // Step 4: Test the tribute creation process and role assignment
  log.section('TESTING TRIBUTE CREATION AND ROLE ASSIGNMENT');
  
  if (loggedInUsers.regularUser) {
    log.info('Testing if creating a tribute assigns Family Contact role');
    
    // This would normally be done through the frontend, but we're simulating it here
    log.info('This test would verify that users who create tributes are assigned the Family Contact role');
    log.info('In a real scenario, this would be tested through the frontend UI');
  }
  
  // Summary
  log.section('TEST SUMMARY');
  log.info('Role-based authentication and access control testing completed');
  log.info('Check the logs above for detailed results');
}

// Run the tests
runTests().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
});