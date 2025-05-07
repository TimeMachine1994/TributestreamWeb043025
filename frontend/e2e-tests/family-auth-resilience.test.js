// @ts-check
import { test, expect } from '@playwright/test';
import { mockStrapiUserRegistration, mockLoginSuccess } from './mocks/auth-mock-enhanced';
import { mockEmptyTributes, mockTributesForbidden, mockTributesSuccess } from './mocks/tributes-mock-enhanced';

/**
 * This test verifies the resilience of the authentication system when:
 * 1. A user successfully registers as a family contact
 * 2. They are redirected to the family dashboard
 * 3. The tributes API temporarily fails with 403 error
 * 4. The user refreshes the page 
 * 5. The user should still have access to the dashboard without being redirected
 */
test('Family contact registration to dashboard flow with API resilience', async ({ page }) => {
  // Step 1: Set up mocks for the registration and authentication flow
  await mockStrapiUserRegistration(page, {
    role: 'family_contact',
    registerSuccess: true
  });

  // Mock initial tributes API to return 403 (simulating temporary API issue)
  await mockTributesForbidden(page);

  // Step 2: Visit the family registration page
  await page.goto('/family-registration');
  await expect(page).toHaveTitle(/Family Registration/);

  // Step 3: Fill out the registration form
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  await page.fill('input[name="username"]', `testuser_${Date.now()}`);
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirm_password"]', testPassword);
  
  // Additional family-specific fields
  await page.fill('input[name="first_name"]', 'Test');
  await page.fill('input[name="last_name"]', 'User');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Step 4: Verify successful registration
  // We should see a success message
  await expect(page.locator('.success-message')).toBeVisible({
    timeout: 10000, // Allow extra time for registration
  });

  // There should be confirmation text visible
  await expect(page.locator('text=Registration successful')).toBeVisible();
  
  // Step 5: Verify redirection to family dashboard happens automatically
  // We should land on the family dashboard page
  await expect(page).toHaveURL('/family-dashboard', { timeout: 10000 });
  
  // Check for dashboard elements, even though tributes may be empty or error
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
  
  // We may see an error message due to the mocked 403 error for tributes
  await expect(page.locator('text=Failed to load tributes')).toBeVisible();
  
  // Step 6: Now change the mock to return successful tributes for the refresh test
  await mockTributesSuccess(page);
  
  // Step 7: Refresh the page to simulate the user refreshing
  await page.reload();
  
  // Step 8: Verify we're still on the dashboard, not redirected to login
  await expect(page).toHaveURL('/family-dashboard');
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
  
  // Step 9: We should now see tributes loaded successfully
  await expect(page.locator('text=My Tributes')).toBeVisible();
  await expect(page.locator('.tribute-card')).toBeVisible();
  
  // Step 10: Verify local storage caching is working by checking storage
  const localStorageData = await page.evaluate(() => {
    return {
      userData: localStorage.getItem('tributes_user_data'),
      jwt: localStorage.getItem('tributes_jwt')
    };
  });
  
  // Verify user data is cached in local storage
  expect(localStorageData.userData).toBeTruthy();
  expect(localStorageData.jwt).toBeTruthy();
  
  // Parse the user data to verify role is correct
  const userData = JSON.parse(localStorageData.userData);
  expect(userData.role.type).toBe('family_contact');
});

/**
 * This test verifies that the authentication recovery works even when:
 * 1. The browser is closed and reopened (simulated by clearing cookies and preserving localStorage)
 * 2. The API temporarily fails to respond correctly
 */
test('Authentication recovery after session restart', async ({ page }) => {
  // Step 1: Set up authentication state directly in localStorage
  await page.goto('/');
  
  // Create mock user data
  const mockUserData = {
    id: 123,
    username: 'recovered_user',
    email: 'recovered@example.com',
    role: {
      id: 456,
      name: 'Family Contact',
      type: 'family_contact'
    },
    jwt: 'mock.jwt.token.for.testing'
  };
  
  // Set mock data in localStorage
  await page.evaluate((userData) => {
    localStorage.setItem('tributes_user_data', JSON.stringify(userData));
    localStorage.setItem('tributes_jwt', userData.jwt);
  }, mockUserData);
  
  // Set the required cookies to simulate server-side auth
  await page.context().addCookies([
    {
      name: 'jwt',
      value: mockUserData.jwt,
      domain: 'localhost',
      path: '/'
    },
    {
      name: 'user_role',
      value: 'family_contact',
      domain: 'localhost',
      path: '/'
    }
  ]);
  
  // Mock the tributes API to return 403 first (simulating API issue)
  await mockTributesForbidden(page);
  
  // Step 2: Try to access the family dashboard
  await page.goto('/family-dashboard');
  
  // Step 3: Verify we successfully access the dashboard despite API errors
  await expect(page).toHaveURL('/family-dashboard');
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
  
  // We may see an error message due to the mocked 403 error for tributes
  await expect(page.locator('text=Failed to load tributes')).toBeVisible();
  
  // Step 4: Now fix the API for the second part of the test
  await mockTributesSuccess(page);
  
  // Step 5: Simulate browser restart by clearing cookies but keeping localStorage
  await page.context().clearCookies();
  
  // Add back just the essential cookies (simulating session restoration)
  await page.context().addCookies([
    {
      name: 'jwt', 
      value: mockUserData.jwt,
      domain: 'localhost',
      path: '/'
    },
    {
      name: 'user_role',
      value: 'family_contact',
      domain: 'localhost',
      path: '/'
    }
  ]);
  
  // Step 6: Reload the page to verify resilience
  await page.reload();
  
  // Step 7: Verify we're still on the dashboard
  await expect(page).toHaveURL('/family-dashboard');
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
  
  // Tributes should now load correctly
  await expect(page.locator('.tribute-card')).toBeVisible();
});