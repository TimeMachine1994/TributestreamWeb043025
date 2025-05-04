# TributeStream Role-Based Authentication Testing

This directory contains scripts for testing the role-based authentication and access control system in the TributeStream application.

## Overview

The testing framework consists of:

1. **Backend API Tests** - Tests the authentication, permissions, and access controls at the API level
2. **Frontend UI Tests** - Tests the UI components and navigation based on user roles
3. **Setup Script** - Installs dependencies and configures the test environment

## Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- Running Strapi backend (http://localhost:1338)
- Running SvelteKit frontend (http://localhost:5178)

## Setup

Run the setup script to install dependencies and configure the test environment:

```bash
node scripts/setup-test-env.js
```

This will:
- Install required dependencies (puppeteer, chalk, node-fetch)
- Add test scripts to package.json
- Create a .env.test file with test configuration

## Running Tests

After setup, you can run the tests using the following npm scripts:

```bash
# Test backend authentication and permissions
npm run test:auth

# Test frontend UI components and navigation
npm run test:ui

# Run all tests
npm run test:all
```

## Test Users

The tests create and use the following test users:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Funeral Director | test_funeral_director | funeral_director@test.com | Test123! |
| Family Contact | test_family_contact | family_contact@test.com | Test123! |
| Regular User | test_regular_user | regular_user@test.com | Test123! |

## Test Scenarios

### Backend API Tests

The `test-role-auth.js` script tests:

1. User creation for each role
2. Login flow for each user type
3. Role-based access controls for API endpoints
4. Tribute creation process and permissions

### Frontend UI Tests

The `test-role-ui.js` script tests:

1. UI adaptation based on user roles (navbar elements, etc.)
2. Navigation options based on role permissions
3. Direct URL access to restricted pages

## Test Report

A comprehensive test report is generated in `role-based-auth-test-report.md`. This report includes:

- Test scenarios and cases
- Expected and actual results
- Issues found
- Recommendations

## Customization

You can modify the test configuration by editing the following files:

- `.env.test` - Environment variables for tests
- `test-role-auth.js` - Backend API test scenarios
- `test-role-ui.js` - Frontend UI test scenarios

## Troubleshooting

If you encounter issues:

1. Make sure both the Strapi backend and SvelteKit frontend are running
2. Check that the admin user exists in Strapi with the correct credentials
3. Verify that the roles are properly configured in Strapi
4. Check the console output for detailed error messages

## Adding New Tests

To add new test scenarios:

1. Add new test cases to the appropriate test script
2. Update the test report template with the new test cases
3. Run the tests to verify the new scenarios