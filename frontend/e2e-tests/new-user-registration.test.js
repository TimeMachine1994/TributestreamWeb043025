// @ts-check
import { test, expect } from '@playwright/test';
import { mockStrapiUserRegistration, mockLoginSuccess } from './mocks/auth-mock-enhanced';
import { mockTributesSuccess } from './mocks/tributes-mock-enhanced';

/**
 * This test verifies that new family contacts can successfully register and access their dashboard
 */
test('New family contact registration and dashboard access', async ({ page }) => {
  // Set up mocks for the family registration flow
  await mockStrapiUserRegistration(page, {
    role: 'family_contact',
    registerSuccess: true
  });

  // Mock successful tributes API response
  await mockTributesSuccess(page);

  // Visit the family registration page
  await page.goto('/family-registration');
  await expect(page).toHaveTitle(/Family Registration/);

  // Fill out the registration form
  const testEmail = `family_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  await page.fill('input[name="username"]', `family_user_${Date.now()}`);
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirm_password"]', testPassword);
  
  // Additional family-specific fields
  await page.fill('input[name="first_name"]', 'Family');
  await page.fill('input[name="last_name"]', 'Contact');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Verify successful registration
  await expect(page.locator('.success-message')).toBeVisible({
    timeout: 10000, // Allow extra time for registration
  });
  
  // Verify redirection to family dashboard
  await expect(page).toHaveURL('/family-dashboard', { timeout: 10000 });
  
  // Check for dashboard elements
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
  
  // Verify local storage has correct role
  const userData = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('tributes_user_data') || '{}');
  });
  
  expect(userData.role?.type).toBe('family_contact');
  
  // Refresh the page to confirm authentication persists
  await page.reload();
  
  // Still on the dashboard after refresh
  await expect(page).toHaveURL('/family-dashboard');
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
});

/**
 * This test verifies that new funeral directors can successfully register and access their dashboard
 */
test('New funeral director registration and dashboard access', async ({ page }) => {
  // Set up mocks for the funeral director registration flow
  await mockStrapiUserRegistration(page, {
    role: 'funeral_director',
    registerSuccess: true
  });

  // Mock successful tributes API response
  await mockTributesSuccess(page);

  // Visit the funeral director registration page
  await page.goto('/funeral-director-registration');
  await expect(page).toHaveTitle(/Funeral Director Registration/);

  // Fill out the registration form
  const testEmail = `fd_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  await page.fill('input[name="username"]', `fd_user_${Date.now()}`);
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirm_password"]', testPassword);
  
  // Additional funeral director-specific fields
  await page.fill('input[name="first_name"]', 'Funeral');
  await page.fill('input[name="last_name"]', 'Director');
  await page.fill('input[name="funeral_home_name"]', 'Test Funeral Home');
  await page.fill('input[name="phone"]', '555-123-4567');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Verify successful registration
  await expect(page.locator('.success-message')).toBeVisible({
    timeout: 10000, // Allow extra time for registration
  });
  
  // Verify redirection to funeral director dashboard
  await expect(page).toHaveURL('/fd-dashboard', { timeout: 10000 });
  
  // Check for dashboard elements
  await expect(page.locator('h1:has-text("Funeral Director Dashboard")')).toBeVisible();
  
  // Verify local storage has correct role
  const userData = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('tributes_user_data') || '{}');
  });
  
  expect(userData.role?.type).toBe('funeral_director');
  
  // Refresh the page to confirm authentication persists
  await page.reload();
  
  // Still on the dashboard after refresh
  await expect(page).toHaveURL('/fd-dashboard');
  await expect(page.locator('h1:has-text("Funeral Director Dashboard")')).toBeVisible();
});

/**
 * This test verifies logging in as a family contact works correctly
 */
test('Login as existing family contact', async ({ page }) => {
  // Mock login success for family contact
  await mockLoginSuccess(page, { role: 'family_contact' });
  await mockTributesSuccess(page);
  
  // Visit login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[name="username"]', 'family_contact_user');
  await page.fill('input[name="password"]', 'password123');
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Verify redirected to family dashboard
  await expect(page).toHaveURL('/family-dashboard', { timeout: 5000 });
  
  // Verify dashboard elements
  await expect(page.locator('h1:has-text("Family Dashboard")')).toBeVisible();
  
  // Verify auth persists after refresh
  await page.reload();
  await expect(page).toHaveURL('/family-dashboard');
});

/**
 * This test verifies logging in as a funeral director works correctly
 */
test('Login as existing funeral director', async ({ page }) => {
  // Mock login success for funeral director
  await mockLoginSuccess(page, { role: 'funeral_director' });
  await mockTributesSuccess(page);
  
  // Visit login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[name="username"]', 'funeral_director_user');
  await page.fill('input[name="password"]', 'password123');
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Verify redirected to funeral director dashboard
  await expect(page).toHaveURL('/fd-dashboard', { timeout: 5000 });
  
  // Verify dashboard elements
  await expect(page.locator('h1:has-text("Funeral Director Dashboard")')).toBeVisible();
  
  // Verify auth persists after refresh
  await page.reload();
  await expect(page).toHaveURL('/fd-dashboard');
});