/**
 * Authentication Mocks
 * 
 * This file provides mock authentication data and functions for testing.
 */

/**
 * Mock the authentication state in the browser
 * @param {Page} page Playwright page object
 * @param {Object} authState Authentication state to mock
 * @returns {Promise<void>}
 */
export async function mockAuthState(page, authState) {
  console.log('🔐 Mocking authentication state:', authState);
  
  // Set JWT cookie if authenticated
  if (authState.authenticated) {
    await page.context().addCookies([
      {
        name: 'jwt',
        value: 'mock-jwt-token-for-testing',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
      }
    ]);
  }
  
  // Mock the auth state in localStorage
  await page.evaluate((state) => {
    localStorage.setItem('auth:user', JSON.stringify(state.user || null));
    localStorage.setItem('auth:authenticated', JSON.stringify(state.authenticated || false));
  }, authState);
  
  // Mock the auth API responses
  await page.route('**/api/auth/me', async (route) => {
    if (authState.authenticated) {
      await route.fulfill({ 
        json: { 
          user: authState.user,
          authenticated: true
        } 
      });
    } else {
      await route.fulfill({ 
        status: 401,
        json: { 
          error: 'Not authenticated',
          authenticated: false
        } 
      });
    }
  });
  
  // Mock login API
  await page.route('**/api/login', async (route) => {
    await route.fulfill({ 
      json: { 
        jwt: 'mock-jwt-token-for-testing',
        user: authState.user,
        authenticated: true
      } 
    });
  });
  
  console.log('✅ Authentication state mocked successfully');
}

/**
 * Mock user roles for testing
 */
export const mockUserRoles = {
  familyContact: {
    id: 'user-family-123',
    username: 'familyuser',
    email: 'family@example.com',
    role: {
      type: 'family_contact',
      name: 'Family Contact'
    }
  },
  funeralDirector: {
    id: 'user-fd-123',
    username: 'fduser',
    email: 'fd@example.com',
    role: {
      type: 'funeral_director',
      name: 'Funeral Director'
    }
  },
  admin: {
    id: 'user-admin-123',
    username: 'adminuser',
    email: 'admin@example.com',
    role: {
      type: 'admin',
      name: 'Administrator'
    }
  }
};