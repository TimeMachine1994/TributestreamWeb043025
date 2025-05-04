/**
 * E2E Tests for Calculator and Checkout Flow
 * 
 * These tests verify the complete flow from calculator to checkout,
 * including package selection, pricing calculation, and payment processing.
 */

import { test, expect } from '@playwright/test';
import { mockAuthState } from './mocks/auth-mock';
import { mockTributes } from './mocks/tributes-mock';

// Test setup - runs before each test
test.beforeEach(async ({ page }) => {
  // Mock authentication state
  await mockAuthState(page, {
    authenticated: true,
    user: {
      id: 'test-user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: {
        type: 'family_contact',
        name: 'Family Contact'
      }
    }
  });

  // Mock API responses
  await page.route('**/api/tributes**', async (route) => {
    await route.fulfill({ json: mockTributes });
  });

  // Clear localStorage to ensure clean state
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Navigate to the calculator page
  await page.goto('/calculator');
});

// Test: Complete calculator flow
test('complete calculator flow with all steps', async ({ page }) => {
  console.log('🧪 Testing complete calculator flow');
  
  // Step 1: Fill in basic information
  await page.locator('#your-name').fill('John Doe');
  await page.locator('#email').fill('john.doe@example.com');
  await page.locator('#phone-number').fill('555-123-4567');
  
  // Click Next
  await page.locator('button:text("Next")').click();
  
  // Step 2: Fill in livestream details
  await page.locator('#livestream-date').fill('2025-06-15');
  await page.locator('#start-time').fill('14:00');
  await page.locator('#livestream-location').fill('Memorial Chapel');
  await page.locator('#funeral-home').check();
  
  // Click Next
  await page.locator('button:text("Next")').click();
  
  // Step 3: Select package
  await page.locator('button:text("Solo Package - $399")').click();
  
  // Verify package selection
  await expect(page.locator('button:text("Solo Package - $399 (Selected)")')).toBeVisible();
  
  // Click Next
  await page.locator('button:text("Next")').click();
  
  // Step 4: Additional options
  // Increase duration to 2 hours
  await page.locator('#duration').fill('2');
  
  // Add second address
  await page.locator('#second-address').check();
  await page.locator('input[placeholder="Enter second address"]').fill('Reception Hall, 123 Main St');
  
  // Click Next
  await page.locator('button:text("Next")').click();
  
  // Step 5: Summary and checkout
  // Verify summary information
  await expect(page.locator('text=Name: John Doe')).toBeVisible();
  await expect(page.locator('text=Email: john.doe@example.com')).toBeVisible();
  await expect(page.locator('text=Package: Solo')).toBeVisible();
  
  // Mock the API response for saving calculator data
  await page.route('**/api/calculator-submissions', async (route) => {
    await route.fulfill({ 
      json: { 
        success: true, 
        data: {
          id: 'calc-123',
          attributes: {
            customerName: 'John Doe',
            email: 'john.doe@example.com'
          }
        }
      } 
    });
  });
  
  // Click Save & Checkout Now
  await page.locator('button:text("Save & Checkout Now")').click();
  
  // Verify navigation to checkout page
  await expect(page).toHaveURL(/\/checkout\?session=/);
  
  console.log('✅ Calculator flow completed successfully');
});

// Test: Save for later functionality
test('save calculator data for later checkout', async ({ page }) => {
  console.log('🧪 Testing save for later functionality');
  
  // Fill in required fields (abbreviated for brevity)
  await page.locator('#your-name').fill('Jane Smith');
  await page.locator('#email').fill('jane.smith@example.com');
  await page.locator('#phone-number').fill('555-987-6543');
  await page.locator('button:text("Next")').click();
  
  await page.locator('#livestream-date').fill('2025-07-20');
  await page.locator('#start-time').fill('10:00');
  await page.locator('#livestream-location').fill('City Chapel');
  await page.locator('button:text("Next")').click();
  
  await page.locator('button:text("Anywhere Package - $499")').click();
  await page.locator('button:text("Next")').click();
  await page.locator('button:text("Next")').click();
  
  // Mock the API response
  await page.route('**/api/calculator-submissions', async (route) => {
    await route.fulfill({ 
      json: { 
        success: true, 
        data: {
          id: 'calc-456',
          attributes: {
            customerName: 'Jane Smith',
            email: 'jane.smith@example.com'
          }
        }
      } 
    });
  });
  
  // Click Save & Checkout Later
  await page.locator('button:text("Save & Checkout Later")').click();
  
  // Verify success message
  await expect(page.locator('text=Your livestream details have been saved')).toBeVisible();
  
  // Verify navigation to dashboard after delay
  await expect(page).toHaveURL('/family-dashboard');
  
  console.log('✅ Save for later functionality works correctly');
});

// Test: Checkout page functionality
test('checkout page displays correct information and processes payment', async ({ page }) => {
  console.log('🧪 Testing checkout page functionality');
  
  // Set up mock calculator data in localStorage
  await page.evaluate(() => {
    const mockData = {
      id: 'test-checkout-123',
      customerName: 'Robert Johnson',
      email: 'robert@example.com',
      phoneNumber: '555-111-2222',
      livestreamDate: '2025-08-10',
      livestreamTime: '15:00',
      livestreamLocation: 'Memorial Gardens',
      livestreamAtFuneralHome: true,
      selectedPackage: 'Legacy',
      livestreamDuration: 3,
      locations: [
        {
          name: 'Primary Location',
          address: 'Memorial Gardens',
          startTime: '15:00',
          duration: 3
        }
      ],
      urlFriendlyText: 'robert-johnson-memorial',
      totalCost: 899,
      savedAt: Date.now(),
      checkoutStatus: 'pending'
    };
    
    localStorage.setItem('cache:calculator:test-user-123:session:test-checkout-123', 
      JSON.stringify({
        value: mockData,
        timestamp: Date.now(),
        ttl: 7 * 24 * 60 * 60 * 1000
      })
    );
  });
  
  // Mock server load function response
  await page.route('**/checkout?session=test-checkout-123', async (route) => {
    if (route.request().method() === 'GET') {
      await route.continue();
    }
  });
  
  // Navigate directly to checkout with session ID
  await page.goto('/checkout?session=test-checkout-123');
  
  // Verify order summary
  await expect(page.locator('h2:text("Order Summary")')).toBeVisible();
  await expect(page.locator('text=Legacy Package')).toBeVisible();
  await expect(page.locator('text=Extra Livestream Hours (2)')).toBeVisible();
  await expect(page.locator('text=$899')).toBeVisible();
  
  // Fill in payment information
  await page.locator('#billingFirstName').fill('Robert');
  await page.locator('#billingLastName').fill('Johnson');
  await page.locator('#billingAddress').fill('123 Main St, Anytown, USA');
  await page.locator('#cardNumber').fill('4111111111111111');
  await page.locator('#cardExpiry').fill('12/25');
  await page.locator('#cardCvv').fill('123');
  
  // Mock payment processing API response
  await page.route('**/checkout?session=test-checkout-123&/processPayment', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ 
        json: { 
          success: true, 
          message: 'Payment processed successfully',
          redirect: '/family-dashboard'
        } 
      });
    }
  });
  
  // Submit payment form
  await page.locator('button:text("Complete Purchase")').click();
  
  // Verify redirect after successful payment
  await expect(page).toHaveURL('/family-dashboard');
  
  console.log('✅ Checkout page functionality works correctly');
});

// Test: Validation in calculator
test('calculator form validation works correctly', async ({ page }) => {
  console.log('🧪 Testing calculator form validation');
  
  // Try to proceed without filling required fields
  await page.locator('button:text("Next")').click();
  
  // Verify we're still on step 1 (validation prevented navigation)
  await expect(page.locator('text=Step 1 of 5')).toBeVisible();
  
  // Fill in only some fields
  await page.locator('#your-name').fill('Test User');
  await page.locator('button:text("Next")').click();
  
  // Verify we're still on step 1
  await expect(page.locator('text=Step 1 of 5')).toBeVisible();
  
  // Fill in all required fields
  await page.locator('#email').fill('test@example.com');
  await page.locator('#phone-number').fill('555-555-5555');
  await page.locator('button:text("Next")').click();
  
  // Verify we moved to step 2
  await expect(page.locator('text=Step 2 of 5')).toBeVisible();
  
  console.log('✅ Calculator form validation works correctly');
});

// Test: Validation in checkout
test('checkout form validation works correctly', async ({ page }) => {
  console.log('🧪 Testing checkout form validation');
  
  // Set up mock data similar to previous test
  await page.evaluate(() => {
    const mockData = {
      id: 'test-checkout-456',
      customerName: 'Validation Test',
      email: 'validation@example.com',
      phoneNumber: '555-333-4444',
      livestreamDate: '2025-09-15',
      livestreamTime: '13:00',
      livestreamLocation: 'Test Chapel',
      livestreamAtFuneralHome: true,
      selectedPackage: 'Anywhere',
      livestreamDuration: 1,
      locations: [
        {
          name: 'Primary Location',
          address: 'Test Chapel',
          startTime: '13:00',
          duration: 1
        }
      ],
      urlFriendlyText: 'validation-test',
      totalCost: 499,
      savedAt: Date.now(),
      checkoutStatus: 'pending'
    };
    
    localStorage.setItem('cache:calculator:test-user-123:session:test-checkout-456', 
      JSON.stringify({
        value: mockData,
        timestamp: Date.now(),
        ttl: 7 * 24 * 60 * 60 * 1000
      })
    );
  });
  
  // Navigate to checkout
  await page.goto('/checkout?session=test-checkout-456');
  
  // Try to submit without filling any fields
  await page.locator('button:text("Complete Purchase")').click();
  
  // Verify form validation errors
  await expect(page.locator('text=First name is required')).toBeVisible();
  await expect(page.locator('text=Last name is required')).toBeVisible();
  await expect(page.locator('text=Billing address is required')).toBeVisible();
  await expect(page.locator('text=Card number is required')).toBeVisible();
  
  // Fill in some fields but with invalid data
  await page.locator('#billingFirstName').fill('Test');
  await page.locator('#billingLastName').fill('User');
  await page.locator('#billingAddress').fill('123 Test St');
  await page.locator('#cardNumber').fill('1234'); // Invalid card number
  await page.locator('#cardExpiry').fill('13/99'); // Invalid expiry
  await page.locator('#cardCvv').fill('12'); // Invalid CVV
  
  // Submit again
  await page.locator('button:text("Complete Purchase")').click();
  
  // Verify validation errors for invalid data
  await expect(page.locator('text=Card number must be 16 digits')).toBeVisible();
  
  console.log('✅ Checkout form validation works correctly');
});