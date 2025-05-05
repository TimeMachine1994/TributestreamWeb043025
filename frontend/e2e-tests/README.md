# Funeral Director Registration Testing

This directory contains end-to-end tests for the funeral director registration flow using Playwright.

## Test Coverage

The tests in `funeral-director-registration.test.js` cover the following scenarios:

### Backend Testing
- Funeral home search API
- Funeral home creation API
- Funeral director registration endpoint
- User role assignment
- Relationship between funeral directors and funeral homes

### Frontend Testing
- Form validation (required fields, format validation)
- Toggling between selecting an existing funeral home and creating a new one
- Funeral home search functionality
- Registration submission process
- Error handling (duplicate email, duplicate username, invalid inputs)
- Success feedback and redirection

### End-to-End Flow Testing
- Complete registration process from start to finish
- Verification that a registered funeral director can log in
- Verification that they are directed to the appropriate dashboard

## Mock Data

The tests use mock data to simulate API responses:

- `mocks/auth-mock.js` - Authentication-related mocks
- `mocks/funeral-homes-mock.js` - Funeral home data and API response mocks

## Running the Tests

To run the funeral director registration tests:

```bash
# Run all tests
npx playwright test funeral-director-registration.test.js

# Run with UI mode
npx playwright test funeral-director-registration.test.js --ui

# Run a specific test
npx playwright test funeral-director-registration.test.js -g "complete registration with existing funeral home"
```

## Test Structure

Each test follows this general pattern:

1. **Setup**: Mock API responses and navigate to the registration page
2. **Action**: Fill in form fields and interact with the UI
3. **Assertion**: Verify expected outcomes (UI changes, API calls, redirects)
4. **Cleanup**: Automatic with Playwright's test isolation

## Debugging

For debugging tests:

```bash
# Run with debug mode
npx playwright test funeral-director-registration.test.js --debug

# Generate and view HTML report
npx playwright test funeral-director-registration.test.js --reporter=html
npx playwright show-report
```

## Adding New Tests

When adding new tests:

1. Follow the existing patterns for mocking API responses
2. Use descriptive test names that explain the scenario being tested
3. Add console logs with emojis for better visibility in test output
4. Ensure proper assertions to verify expected behavior

## Common Issues

- **API Mocking**: Ensure route patterns match the actual API endpoints
- **Selectors**: If UI changes, update selectors in the test file
- **Timing**: For operations that take time, use appropriate waiting strategies