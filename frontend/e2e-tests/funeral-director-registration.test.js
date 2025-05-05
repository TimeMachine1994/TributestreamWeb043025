/**
 * E2E Tests for Funeral Director Registration Flow
 * 
 * These tests verify the complete funeral director registration process,
 * including backend API interactions, frontend form validation, and end-to-end flow.
 */

import { test, expect } from '@playwright/test';
import { mockAuthState, mockUserRoles } from './mocks/auth-mock';

// Mock data for testing
const mockFuneralHomes = [
  {
    id: 1,
    name: 'Peaceful Rest Funeral Home',
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    phoneNumber: '555-123-4567'
  },
  {
    id: 2,
    name: 'Serene Memorial Chapel',
    address: '456 Oak Avenue',
    city: 'Riverdale',
    state: 'NY',
    zipCode: '10471',
    phoneNumber: '555-987-6543'
  }
];

// Test setup - runs before each test
test.beforeEach(async ({ page }) => {
  console.log('🔧 Setting up funeral director registration test');
  
  // Mock authentication state - unauthenticated for registration tests
  await mockAuthState(page, {
    authenticated: false,
    user: null
  });
  
  // Mock API responses for funeral home search
  await page.route('**/api/funeral-homes/search?query=*', async (route) => {
    const url = route.request().url();
    const query = new URL(url).searchParams.get('query').toLowerCase();
    
    // Filter mock funeral homes based on search query
    const results = mockFuneralHomes.filter(home => 
      home.name.toLowerCase().includes(query)
    );
    
    console.log(`🔍 Mocking funeral home search for "${query}" with ${results.length} results`);
    await route.fulfill({ json: results });
  });
  
  // Mock API response for funeral home creation
  await page.route('**/api/funeral-homes', async (route) => {
    if (route.request().method() === 'POST') {
      const requestBody = JSON.parse(await route.request().postData());
      const newFuneralHome = {
        id: 999,
        ...requestBody.data
      };
      
      console.log('🏢 Mocking funeral home creation', newFuneralHome);
      await route.fulfill({ 
        json: { 
          data: newFuneralHome
        } 
      });
    }
  });
  
  // Mock API response for user registration
  await page.route('**/api/auth/local/register', async (route) => {
    const requestBody = JSON.parse(await route.request().postData());
    
    // Check if email already exists (simulate validation)
    if (requestBody.email === 'existing@example.com') {
      console.log('❌ Mocking registration failure - email already exists');
      await route.fulfill({ 
        status: 400,
        json: { 
          error: {
            message: 'Email is already taken',
            details: {}
          }
        } 
      });
      return;
    }
    
    // Check if username already exists (simulate validation)
    if (requestBody.username === 'existinguser') {
      console.log('❌ Mocking registration failure - username already exists');
      await route.fulfill({ 
        status: 400,
        json: { 
          error: {
            message: 'Username already taken',
            details: {}
          }
        } 
      });
      return;
    }
    
    // Successful registration
    console.log('✅ Mocking successful registration', { 
      username: requestBody.username,
      email: requestBody.email,
      isFuneralDirector: requestBody.isFuneralDirector,
      hasFuneralHomeId: !!requestBody.funeralHomeId
    });
    
    await route.fulfill({ 
      json: { 
        jwt: 'mock-jwt-token-for-testing',
        user: {
          id: 123,
          username: requestBody.username,
          email: requestBody.email,
          fullName: requestBody.fullName,
          role: {
            id: 3,
            name: 'Funeral Director',
            type: 'funeral_director'
          }
        }
      } 
    });
  });
  
  // Mock API response for role assignment
  await page.route('**/api/users-permissions/roles', async (route) => {
    console.log('🔑 Mocking roles API response');
    await route.fulfill({ 
      json: { 
        roles: [
          {
            id: 1,
            name: 'Authenticated',
            type: 'authenticated'
          },
          {
            id: 2,
            name: 'Family Contact',
            type: 'family_contact'
          },
          {
            id: 3,
            name: 'Funeral Director',
            type: 'funeral_director'
          }
        ]
      } 
    });
  });
  
  // Mock API response for user update (role assignment)
  await page.route('**/api/users/**', async (route) => {
    if (route.request().method() === 'PUT') {
      console.log('👤 Mocking user update for role assignment');
      await route.fulfill({ 
        json: { 
          success: true
        } 
      });
    }
  });
  
  // Navigate to the registration page
  await page.goto('/funeral-director-registration');
});

// Test: Complete registration with existing funeral home
test('complete registration with existing funeral home', async ({ page }) => {
  console.log('🧪 Testing registration with existing funeral home');
  
  // Fill in personal information
  await page.locator('#username').fill('newdirector');
  await page.locator('#email').fill('director@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#confirmPassword').fill('password123');
  await page.locator('#fullName').fill('John Director');
  await page.locator('#phoneNumber').fill('555-111-2222');
  
  // Search for funeral home
  await page.locator('#searchQuery').fill('peaceful');
  
  // Wait for search results
  await page.waitForSelector('.result-item');
  
  // Select the first funeral home
  await page.locator('.result-item').first().click();
  
  // Verify selected funeral home is displayed
  await expect(page.locator('.selected-funeral-home')).toBeVisible();
  await expect(page.locator('.selected-funeral-home strong')).toContainText('Peaceful Rest Funeral Home');
  
  // Submit the form
  await page.locator('button.submit-button').click();
  
  // Verify success message
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.success-message h2')).toContainText('Registration successful');
  
  // Verify user info is displayed
  await expect(page.locator('.user-info')).toContainText('newdirector');
  await expect(page.locator('.user-info')).toContainText('director@example.com');
  
  // Verify redirect message appears
  await expect(page.locator('.redirect-message')).toContainText('Redirecting to Funeral Director dashboard');
  
  console.log('✅ Registration with existing funeral home completed successfully');
});

// Test: Complete registration with new funeral home
test('complete registration with new funeral home', async ({ page }) => {
  console.log('🧪 Testing registration with new funeral home');
  
  // Fill in personal information
  await page.locator('#username').fill('newdirector2');
  await page.locator('#email').fill('director2@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#confirmPassword').fill('password123');
  await page.locator('#fullName').fill('Jane Director');
  await page.locator('#phoneNumber').fill('555-333-4444');
  
  // Toggle to "Add New" funeral home
  await page.locator('button.toggle-button:text("Add New")').click();
  
  // Fill in funeral home information
  await page.locator('#funeralHomeName').fill('New Horizons Funeral Services');
  await page.locator('#funeralHomeAddress').fill('789 Pine Street');
  await page.locator('#funeralHomeCity').fill('Lakeside');
  await page.locator('#funeralHomeState').fill('CA');
  await page.locator('#funeralHomeZipCode').fill('92040');
  await page.locator('#funeralHomePhoneNumber').fill('555-777-8888');
  
  // Submit the form
  await page.locator('button.submit-button').click();
  
  // Verify success message
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.success-message h2')).toContainText('Registration successful');
  
  // Verify user info is displayed
  await expect(page.locator('.user-info')).toContainText('newdirector2');
  await expect(page.locator('.user-info')).toContainText('director2@example.com');
  
  console.log('✅ Registration with new funeral home completed successfully');
});

// Test: Form validation
test('form validation prevents submission with invalid data', async ({ page }) => {
  console.log('🧪 Testing form validation');
  
  // Try to submit empty form
  await page.locator('button.submit-button').click();
  
  // Verify validation errors
  await expect(page.locator('.error-text')).toHaveCount(5); // Username, email, password, fullName, selectedFuneralHome
  
  // Fill in some fields with invalid data
  await page.locator('#username').fill('ab'); // Too short
  await page.locator('#email').fill('invalid-email'); // Invalid format
  await page.locator('#password').fill('short'); // Too short
  await page.locator('#confirmPassword').fill('different'); // Doesn't match
  
  // Try to submit again
  await page.locator('button.submit-button').click();
  
  // Verify validation errors still present
  await expect(page.locator('.error-text')).toBeVisible();
  await expect(page.locator('.error-text')).toContainText('Username must be at least 3 characters');
  await expect(page.locator('.error-text')).toContainText('Email format is invalid');
  await expect(page.locator('.error-text')).toContainText('Password must be at least 6 characters');
  await expect(page.locator('.error-text')).toContainText('Passwords do not match');
  
  console.log('✅ Form validation works correctly');
});

// Test: Duplicate email error handling
test('registration handles duplicate email error', async ({ page }) => {
  console.log('🧪 Testing duplicate email error handling');
  
  // Fill in personal information with existing email
  await page.locator('#username').fill('newuser');
  await page.locator('#email').fill('existing@example.com'); // This email is set to fail in our mock
  await page.locator('#password').fill('password123');
  await page.locator('#confirmPassword').fill('password123');
  await page.locator('#fullName').fill('Test User');
  
  // Toggle to "Add New" funeral home
  await page.locator('button.toggle-button:text("Add New")').click();
  
  // Fill in funeral home information
  await page.locator('#funeralHomeName').fill('Test Funeral Home');
  await page.locator('#funeralHomeAddress').fill('123 Test Street');
  
  // Submit the form
  await page.locator('button.submit-button').click();
  
  // Verify error message
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Email is already taken');
  
  console.log('✅ Duplicate email error handling works correctly');
});

// Test: Duplicate username error handling
test('registration handles duplicate username error', async ({ page }) => {
  console.log('🧪 Testing duplicate username error handling');
  
  // Fill in personal information with existing username
  await page.locator('#username').fill('existinguser'); // This username is set to fail in our mock
  await page.locator('#email').fill('new@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#confirmPassword').fill('password123');
  await page.locator('#fullName').fill('Test User');
  
  // Toggle to "Add New" funeral home
  await page.locator('button.toggle-button:text("Add New")').click();
  
  // Fill in funeral home information
  await page.locator('#funeralHomeName').fill('Test Funeral Home');
  await page.locator('#funeralHomeAddress').fill('123 Test Street');
  
  // Submit the form
  await page.locator('button.submit-button').click();
  
  // Verify error message
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Username already taken');
  
  console.log('✅ Duplicate username error handling works correctly');
});

// Test: Funeral home search functionality
test('funeral home search functionality works correctly', async ({ page }) => {
  console.log('🧪 Testing funeral home search functionality');
  
  // Search for "serene"
  await page.locator('#searchQuery').fill('serene');
  
  // Wait for search results
  await page.waitForSelector('.result-item');
  
  // Verify search results
  await expect(page.locator('.result-item')).toHaveCount(1);
  await expect(page.locator('.result-item .result-name')).toContainText('Serene Memorial Chapel');
  
  // Search for "nonexistent"
  await page.locator('#searchQuery').fill('nonexistent');
  
  // Wait for no results message
  await page.waitForSelector('.no-results');
  
  // Verify no results message
  await expect(page.locator('.no-results')).toContainText('No funeral homes found');
  
  // Verify "Add a new funeral home instead" button is present
  await expect(page.locator('button:text("Add a new funeral home instead")')).toBeVisible();
  
  // Click the button to switch to new funeral home form
  await page.locator('button:text("Add a new funeral home instead")').click();
  
  // Verify new funeral home form is displayed
  await expect(page.locator('#funeralHomeName')).toBeVisible();
  
  console.log('✅ Funeral home search functionality works correctly');
});

// Test: Toggle between existing and new funeral home
test('toggle between existing and new funeral home works', async ({ page }) => {
  console.log('🧪 Testing toggle between existing and new funeral home');
  
  // Verify "Select Existing" is active by default
  await expect(page.locator('button.toggle-button:text("Select Existing")')).toHaveClass(/active/);
  
  // Verify search section is visible
  await expect(page.locator('.search-section')).toBeVisible();
  
  // Click "Add New" button
  await page.locator('button.toggle-button:text("Add New")').click();
  
  // Verify "Add New" is now active
  await expect(page.locator('button.toggle-button:text("Add New")')).toHaveClass(/active/);
  
  // Verify new funeral home form is visible
  await expect(page.locator('.new-funeral-home-form')).toBeVisible();
  
  // Click "Select Existing" button
  await page.locator('button.toggle-button:text("Select Existing")').click();
  
  // Verify "Select Existing" is active again
  await expect(page.locator('button.toggle-button:text("Select Existing")')).toHaveClass(/active/);
  
  // Verify search section is visible again
  await expect(page.locator('.search-section')).toBeVisible();
  
  console.log('✅ Toggle between existing and new funeral home works correctly');
});

// Test: End-to-end flow with login after registration
test('end-to-end flow with login after registration', async ({ page }) => {
  console.log('🧪 Testing end-to-end flow with login after registration');
  
  // Complete registration
  await page.locator('#username').fill('completedirector');
  await page.locator('#email').fill('complete@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#confirmPassword').fill('password123');
  await page.locator('#fullName').fill('Complete Director');
  
  // Toggle to "Add New" funeral home
  await page.locator('button.toggle-button:text("Add New")').click();
  
  // Fill in funeral home information
  await page.locator('#funeralHomeName').fill('Complete Funeral Services');
  await page.locator('#funeralHomeAddress').fill('100 Complete Street');
  
  // Submit the form
  await page.locator('button.submit-button').click();
  
  // Verify success message
  await expect(page.locator('.success-message')).toBeVisible();
  
  // Mock the redirect to login page (since we can't wait for the actual timeout)
  await page.route('**/fd-dashboard', route => {
    route.fulfill({
      status: 200,
      body: '<html><body>Funeral Director Dashboard</body></html>'
    });
  });
  
  // Manually navigate to login page
  await page.goto('/login');
  
  // Mock login API for the registered user
  await page.route('**/api/auth/local', async (route) => {
    const requestBody = JSON.parse(await route.request().postData());
    
    if (requestBody.identifier === 'completedirector' && requestBody.password === 'password123') {
      await route.fulfill({ 
        json: { 
          jwt: 'mock-jwt-token-for-testing',
          user: {
            id: 123,
            username: 'completedirector',
            email: 'complete@example.com',
            role: {
              id: 3,
              name: 'Funeral Director',
              type: 'funeral_director'
            }
          }
        } 
      });
    } else {
      await route.fulfill({ 
        status: 400,
        json: { 
          error: {
            message: 'Invalid credentials'
          }
        } 
      });
    }
  });
  
  // Fill in login form with the registered credentials
  await page.locator('input[name="identifier"]').fill('completedirector');
  await page.locator('input[name="password"]').fill('password123');
  
  // Submit login form
  await page.locator('button[type="submit"]').click();
  
  // Verify redirect to funeral director dashboard
  await expect(page).toHaveURL('/fd-dashboard');
  
  console.log('✅ End-to-end flow with login after registration completed successfully');
});