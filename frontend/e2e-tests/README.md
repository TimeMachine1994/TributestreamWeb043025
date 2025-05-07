# E2E Tests for Tributestream Web App

This directory contains end-to-end tests for the Tributestream web application using Playwright.

## Test Coverage

- Authentication flows
- Registration processes
- Family dashboard functionality
- API resilience testing
- Cross-browser compatibility

## Running Tests

To run all tests:

```bash
# From project root
cd frontend
npm run test:e2e
```

To run a specific test file:

```bash
# From project root
cd frontend
npx playwright test e2e-tests/family-auth-resilience.test.js
```

To run in headed mode (with visible browser):

```bash
npx playwright test e2e-tests/family-auth-resilience.test.js --headed
```

## Family Authentication Resilience Test

The `family-auth-resilience.test.js` test specifically validates:

1. User registration flow for family contacts
2. Authentication persistence across page reloads
3. System resilience when API responses return errors
4. Local storage caching recovery mechanisms

This test ensures that the fixes made to the authentication flow work correctly by:

- Mocking various API response scenarios (success, forbidden, network errors)
- Verifying that the user remains authenticated even when API calls fail
- Testing the fallback to cookie-based authentication when full user data fails to load
- Confirming local storage caching works as expected for persistence

### Expected Results

When the test passes, it confirms that:

- Users can register successfully as family contacts
- They are properly redirected to the family dashboard
- Even if the tributes API temporarily fails with a 403 error, they remain authenticated
- When the page is refreshed, authentication persists properly
- Local storage caching is working correctly

## Mock Utilities

The test uses enhanced mock utilities:

- `auth-mock-enhanced.js` - Provides authentication mocking
- `tributes-mock-enhanced.js` - Provides tributes API response mocking

These mocks simulate various server response scenarios to comprehensively test the application's resilience against API failures.