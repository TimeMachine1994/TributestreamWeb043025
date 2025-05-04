/**
 * E2E Tests for Family Dashboard
 * 
 * These tests verify the functionality of the family dashboard,
 * including tribute management, checkout integration, and UI elements.
 */

import { test, expect } from '@playwright/test';
import { mockAuthState } from './mocks/auth-mock';
import { mockTributes } from './mocks/tributes-mock';
import { mockLocations } from './mocks/locations-mock';
import { mockMediaItems } from './mocks/media-mock';
import { mockCheckoutSessions } from './mocks/checkout-mock';

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

  await page.route('**/api/locations**', async (route) => {
    await route.fulfill({ json: mockLocations });
  });

  await page.route('**/api/media-items**', async (route) => {
    await route.fulfill({ json: mockMediaItems });
  });

  // Set up localStorage with mock checkout sessions
  await page.evaluate((checkoutData) => {
    // Set up mock checkout sessions in localStorage
    Object.entries(checkoutData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }, mockCheckoutSessions);

  // Navigate to the family dashboard
  await page.goto('/family-dashboard');
});

// Test: Dashboard loads correctly with tributes
test('dashboard loads with tributes and user information', async ({ page }) => {
  // Verify page title
  await expect(page.locator('h1')).toContainText('Family Dashboard');
  
  // Verify user role is displayed
  await expect(page.locator('text=Role: Family Contact')).toBeVisible();
  
  // Verify tributes are displayed
  await expect(page.locator('.grid-cols-1 >> div.border')).toHaveCount(mockTributes.data.length);
  
  // Verify first tribute name is displayed
  const firstTributeName = mockTributes.data[0].attributes.name;
  await expect(page.locator('.grid-cols-1 >> div.border >> h3').first()).toContainText(firstTributeName);
  
  console.log('✅ Dashboard loaded successfully with tributes and user information');
});

// Test: Pending checkouts are displayed
test('pending checkouts are displayed correctly', async ({ page }) => {
  // Verify pending checkouts section exists
  await expect(page.locator('h2:text("Pending Checkouts")')).toBeVisible();
  
  // Count pending checkout items
  const pendingCheckoutsCount = await page.locator('text=Checkout in progress').count();
  expect(pendingCheckoutsCount).toBeGreaterThan(0);
  
  // Verify resume checkout button exists
  await expect(page.locator('button:text("Resume Checkout")')).toBeVisible();
  
  console.log('✅ Pending checkouts displayed correctly');
});

// Test: Saved checkouts are displayed
test('saved checkouts are displayed correctly', async ({ page }) => {
  // Verify saved checkouts section exists
  await expect(page.locator('h2:text("Saved Livestreams")')).toBeVisible();
  
  // Count saved checkout items
  const savedCheckoutsCount = await page.locator('text=Saved for later').count();
  expect(savedCheckoutsCount).toBeGreaterThan(0);
  
  // Verify complete checkout button exists
  await expect(page.locator('button:text("Complete Checkout")')).toBeVisible();
  
  console.log('✅ Saved checkouts displayed correctly');
});

// Test: Resume checkout flow
test('resume checkout navigates to checkout page', async ({ page }) => {
  // Click on resume checkout button
  await page.locator('button:text("Resume Checkout")').first().click();
  
  // Verify navigation to checkout page
  await expect(page).toHaveURL(/\/checkout\?session=/);
  
  // Verify checkout page loaded
  await expect(page.locator('h1')).toContainText('Complete Your Purchase');
  
  console.log('✅ Resume checkout navigation works correctly');
});

// Test: Edit tribute
test('edit tribute functionality works', async ({ page }) => {
  // Mock the API response for the PUT request
  await page.route('**/api/tributes/**', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ 
        json: { 
          success: true, 
          data: {
            id: mockTributes.data[0].id,
            attributes: {
              ...mockTributes.data[0].attributes,
              name: 'Updated Tribute Name'
            }
          }
        } 
      });
    } else {
      await route.fulfill({ json: mockTributes });
    }
  });

  // Click edit button on first tribute
  await page.locator('.grid-cols-1 >> div.border >> button >> svg[stroke="currentColor"]').first().click();
  
  // Type new name
  await page.locator('input[type="text"]').fill('Updated Tribute Name');
  
  // Click save button
  await page.locator('button:text("Save")').click();
  
  // Verify success message
  await expect(page.locator('text=Tribute updated successfully')).toBeVisible();
  
  console.log('✅ Edit tribute functionality works correctly');
});

// Test: Navigate to calculator
test('navigate to calculator from tribute', async ({ page }) => {
  // Click on calculator button for first tribute
  const calculatorButtons = await page.locator('button >> svg[stroke="currentColor"][stroke-width="2"][d*="M8 7V3m8 4V3m-9 8h10M5 21h14"]');
  await calculatorButtons.first().click();
  
  // Verify navigation to calculator page with tributeId parameter
  await expect(page).toHaveURL(/\/calculator\?tributeId=/);
  
  console.log('✅ Navigation to calculator works correctly');
});

// Test: Share tribute functionality
test('share tribute functionality shows options', async ({ page }) => {
  // Find and click share button
  await page.locator('button:has-text("Share with")').click();
  
  // Verify share options are displayed
  await expect(page.locator('button >> svg[viewBox="0 0 24 24"][fill="currentColor"]')).toHaveCount(4);
  
  console.log('✅ Share tribute functionality shows options correctly');
});

// Test: Upload media button works
test('upload media button navigates correctly', async ({ page }) => {
  // Mock navigation
  await page.route('**/media-upload**', route => {
    route.fulfill({
      status: 200,
      body: '<html><body>Media Upload Page</body></html>'
    });
  });

  // Click upload media button
  await page.locator('button:text("Upload Media")').click();
  
  // Verify navigation attempt
  await expect(page).toHaveURL(/\/media-upload\?tributeId=/);
  
  console.log('✅ Upload media button navigates correctly');
});