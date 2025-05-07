/**
 * Enhanced Tributes Mocks
 * 
 * This file provides extended mock tribute data and API response scenarios for testing.
 */

import { mockTributes } from './tributes-mock';

/**
 * Mock a successful response from the tributes API
 * @param {import('@playwright/test').Page} page Playwright page object
 * @returns {Promise<void>}
 */
export async function mockTributesSuccess(page) {
  console.log('📋 Mocking successful tributes API response');
  
  await page.route('**/api/tributes**', async (route) => {
    await route.fulfill({ 
      status: 200,
      json: mockTributes
    });
  });
  
  console.log('✅ Tributes success mock configured');
}

/**
 * Mock a forbidden (403) response from the tributes API
 * Used to simulate authentication or permission issues
 * @param {import('@playwright/test').Page} page Playwright page object
 * @returns {Promise<void>}
 */
export async function mockTributesForbidden(page) {
  console.log('🔒 Mocking forbidden tributes API response (403)');
  
  await page.route('**/api/tributes**', async (route) => {
    await route.fulfill({ 
      status: 403,
      json: { 
        data: null,
        error: {
          status: 403,
          name: 'ForbiddenError',
          message: 'Forbidden',
          details: {}
        }
      }
    });
  });
  
  console.log('✅ Tributes forbidden mock configured');
}

/**
 * Mock a successful but empty response from the tributes API
 * @param {import('@playwright/test').Page} page Playwright page object
 * @returns {Promise<void>}
 */
export async function mockEmptyTributes(page) {
  console.log('📋 Mocking empty tributes API response');
  
  await page.route('**/api/tributes**', async (route) => {
    await route.fulfill({ 
      status: 200,
      json: {
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 0,
            total: 0
          }
        }
      }
    });
  });
  
  console.log('✅ Empty tributes mock configured');
}

/**
 * Mock a network failure response from the tributes API
 * @param {import('@playwright/test').Page} page Playwright page object
 * @returns {Promise<void>}
 */
export async function mockTributesNetworkFailure(page) {
  console.log('🔌 Mocking network failure for tributes API');
  
  await page.route('**/api/tributes**', async (route) => {
    await route.abort('failed');
  });
  
  console.log('✅ Tributes network failure mock configured');
}

/**
 * Mock a timeout response from the tributes API
 * @param {import('@playwright/test').Page} page Playwright page object
 * @returns {Promise<void>}
 */
export async function mockTributesTimeout(page) {
  console.log('⏱️ Mocking timeout for tributes API');
  
  await page.route('**/api/tributes**', async (route) => {
    // Wait for 10 seconds, this will likely trigger timeout handlers
    await new Promise(resolve => setTimeout(resolve, 10000));
    await route.abort('timedout');
  });
  
  console.log('✅ Tributes timeout mock configured');
}

/**
 * Mock a single tribute API response
 * @param {import('@playwright/test').Page} page Playwright page object
 * @param {string} tributeId ID of the tribute to mock
 * @returns {Promise<void>}
 */
export async function mockSingleTribute(page, tributeId) {
  console.log(`📋 Mocking single tribute API response for ID: ${tributeId}`);
  
  const tribute = mockTributes.data.find(t => t.id === tributeId);
  
  if (!tribute) {
    await page.route(`**/api/tributes/${tributeId}`, async (route) => {
      await route.fulfill({ 
        status: 404,
        json: { 
          data: null,
          error: {
            status: 404,
            name: 'NotFoundError',
            message: 'Tribute not found',
            details: {}
          }
        }
      });
    });
  } else {
    await page.route(`**/api/tributes/${tributeId}`, async (route) => {
      await route.fulfill({ 
        status: 200,
        json: { 
          data: tribute,
          meta: {}
        }
      });
    });
  }
  
  console.log('✅ Single tribute mock configured');
}

// Export original mock data and functions for backward compatibility
export { 
  mockTributes, 
  getMockTributeById, 
  createMockTribute, 
  updateMockTribute, 
  deleteMockTribute 
} from './tributes-mock';