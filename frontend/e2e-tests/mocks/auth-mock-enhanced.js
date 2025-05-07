/**
 * Enhanced Authentication Mocks
 * 
 * This file provides extended mock authentication data and functions for testing.
 */

/**
 * Mock Strapi user registration process
 * @param {import('@playwright/test').Page} page Playwright page object
 * @param {Object} options Options for the mock
 * @param {string} options.role Role to assign ('family_contact' or 'funeral_director')
 * @param {boolean} options.registerSuccess Whether registration should succeed
 * @returns {Promise<void>}
 */
export async function mockStrapiUserRegistration(page, options = { role: 'family_contact', registerSuccess: true }) {
  console.log('🔐 Mocking Strapi user registration:', options);
  
  // Mock the registration API endpoint
  await page.route('**/api/auth/local/register', async (route) => {
    if (options.registerSuccess) {
      // Generate a random user ID and username prefix for uniqueness
      const userId = Math.floor(Math.random() * 10000);
      const userPrefix = Math.random().toString(36).substring(2, 6);
      
      // Mock successful registration response
      await route.fulfill({ 
        status: 200,
        json: { 
          jwt: `mock.jwt.token.${userPrefix}.${Date.now()}`,
          user: {
            id: userId,
            username: `testuser_${userPrefix}`,
            email: `test_${userPrefix}@example.com`,
            role: {
              id: options.role === 'family_contact' ? 2 : 3,
              name: options.role === 'family_contact' ? 'Family Contact' : 'Funeral Director',
              type: options.role
            }
          }
        } 
      });
    } else {
      // Mock failed registration
      await route.fulfill({ 
        status: 400,
        json: { 
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Registration failed',
            details: {
              errors: [
                {
                  path: ['email'],
                  message: 'Email is already taken'
                }
              ]
            }
          }
        } 
      });
    }
  });
  
  // Mock the cookie setting API endpoint
  await page.route('**/api/login', async (route) => {
    const method = route.request().method();
    if (method === 'POST' && options.registerSuccess) {
      await route.fulfill({ 
        status: 200,
        json: { 
          success: true,
          message: 'Authentication cookies set successfully'
        } 
      });
    } else {
      await route.fulfill({
        status: 200,
        json: {
          success: false,
          message: 'Failed to set authentication cookies'
        }
      });
    }
  });
  
  console.log('✅ Registration API mocks configured successfully');
}

/**
 * Mock successful login response
 * @param {import('@playwright/test').Page} page Playwright page object
 * @param {Object} options Login options
 * @param {string} options.role User role ('family_contact' or 'funeral_director')
 * @returns {Promise<void>}
 */
export async function mockLoginSuccess(page, options = { role: 'family_contact' }) {
  console.log('🔐 Mocking successful login:', options);
  
  // Generate a random user ID and token
  const userId = Math.floor(Math.random() * 10000);
  const tokenSuffix = Math.random().toString(36).substring(2, 10);
  const jwt = `mock.login.token.${tokenSuffix}`;
  
  // Mock the login API endpoint
  await page.route('**/api/auth/local', async (route) => {
    await route.fulfill({ 
      status: 200,
      json: { 
        jwt,
        user: {
          id: userId,
          username: `login_user_${tokenSuffix}`,
          email: `login_${tokenSuffix}@example.com`,
          role: {
            id: options.role === 'family_contact' ? 2 : 3,
            name: options.role === 'family_contact' ? 'Family Contact' : 'Funeral Director',
            type: options.role
          }
        }
      } 
    });
  });
  
  // Mock the cookie setting API
  await page.route('**/api/login', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({ 
        status: 200,
        json: { 
          success: true,
          message: 'Authentication cookies set successfully'
        } 
      });
    }
  });
  
  // Add the cookies directly to simulate server-side cookie setting
  await page.context().addCookies([
    {
      name: 'jwt',
      value: jwt,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'user_role',
      value: options.role,
      domain: 'localhost',
      path: '/',
    }
  ]);
  
  console.log('✅ Login mocks configured successfully');
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
      id: 2,
      type: 'family_contact',
      name: 'Family Contact'
    }
  },
  funeralDirector: {
    id: 'user-fd-123',
    username: 'fduser',
    email: 'fd@example.com',
    role: {
      id: 3,
      type: 'funeral_director',
      name: 'Funeral Director'
    }
  },
  admin: {
    id: 'user-admin-123',
    username: 'adminuser',
    email: 'admin@example.com',
    role: {
      id: 1,
      type: 'admin',
      name: 'Administrator'
    }
  }
};

// Export original mockAuthState for backward compatibility
export { mockAuthState } from './auth-mock';