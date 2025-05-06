# Production Migration Testing Plan

This document provides a comprehensive test plan for verifying that the migration from the local Strapi development environment to the production Strapi instance was successful.

## 🚀 Overview

The purpose of this testing plan is to ensure that all frontend functionality works correctly with the production Strapi backend. The plan covers authentication, data retrieval, media handling, form submissions, and other critical features.

## 📋 Prerequisites

Before beginning testing, ensure:

1. The frontend application is configured to use the production Strapi instance:
   - `PUBLIC_STRAPI_URL=https://miraculous-morning-0acdf6e165.strapiapp.com`
   - `PUBLIC_STRAPI_PORT=443`
   - `PUBLIC_ENVIRONMENT=production`

2. CORS settings have been configured in the Strapi admin panel to allow requests from your testing environment.

3. You have test user accounts for each role (Family Contact, Funeral Director, etc.).

## 🧪 Test Execution Plan

### 1. Initial Setup and Connection Testing

#### 1.1 Backend Connection Verification

```bash
# Start the frontend application in development mode
npm run dev
```

**Expected Results:**
- Application starts without errors
- Console logs show successful connection to the production Strapi instance
- No CORS errors appear in the browser console

#### 1.2 Backend Health Check

Navigate to the homepage and check for backend status indicators.

**Expected Results:**
- Backend status indicator shows "Connected" or similar positive status
- No error messages related to backend connectivity

### 2. Authentication Testing

#### 2.1 User Registration

1. Navigate to the registration page
2. Complete the registration form with test user details
3. Submit the form

**Expected Results:**
- Registration request is sent to the production Strapi instance
- User is created successfully
- JWT token is received and stored
- User is redirected to the appropriate dashboard

#### 2.2 User Login

1. Navigate to the login page
2. Enter credentials for an existing user
3. Submit the login form

**Expected Results:**
- Login request is sent to the production Strapi instance
- JWT token is received and stored
- User role is correctly identified
- User is redirected to the appropriate dashboard

#### 2.3 Authentication Persistence

1. Login with valid credentials
2. Refresh the page

**Expected Results:**
- User remains logged in after page refresh
- User role and permissions are maintained

#### 2.4 Logout Functionality

1. Login with valid credentials
2. Click the logout button/link

**Expected Results:**
- JWT token is removed
- User is redirected to the login page or home page
- Protected routes are no longer accessible

### 3. Data Retrieval Testing

#### 3.1 Tribute Listing

1. Login as a user with access to tributes
2. Navigate to a page that displays tribute listings

**Expected Results:**
- Tributes are fetched from the production Strapi instance
- Tributes are displayed correctly
- Pagination works if implemented

#### 3.2 Tribute Details

1. From a tribute listing, click on a specific tribute to view details

**Expected Results:**
- Tribute details are fetched from the production Strapi instance
- All tribute data is displayed correctly
- Related data (e.g., locations, media) is loaded and displayed

#### 3.3 User-Specific Data

1. Login as different user roles (Family Contact, Funeral Director)
2. Navigate to dashboards and user-specific pages

**Expected Results:**
- Each user sees only their authorized data
- Role-specific UI elements are displayed correctly
- Data is filtered according to user permissions

### 4. Media Upload and Retrieval Testing

#### 4.1 Media Retrieval

1. Navigate to a tribute with existing media items

**Expected Results:**
- Media items are fetched from the production Strapi instance
- Images, videos, and documents are displayed correctly
- Thumbnails load properly

#### 4.2 Media Upload

1. Navigate to a page with media upload functionality
2. Select a file to upload (test with image, video, and document)
3. Submit the upload

**Expected Results:**
- File is uploaded to the production Strapi instance
- Upload progress is displayed
- Uploaded media appears in the media list after upload
- Thumbnails are generated correctly

#### 4.3 Media Management

1. Test editing media metadata (name, description)
2. Test deleting media items

**Expected Results:**
- Changes are saved to the production Strapi instance
- UI updates to reflect changes
- Deleted items are removed from the UI

### 5. Form Submission Testing

#### 5.1 Tribute Creation

1. Navigate to the tribute creation page
2. Fill out the tribute creation form
3. Submit the form

**Expected Results:**
- Form data is sent to the production Strapi instance
- New tribute is created
- User is redirected to the appropriate page
- New tribute appears in listings

#### 5.2 Tribute Updates

1. Navigate to an existing tribute's edit page
2. Modify some fields
3. Submit the changes

**Expected Results:**
- Changes are sent to the production Strapi instance
- Tribute is updated
- UI reflects the changes

#### 5.3 Other Form Submissions

Test any other forms in the application (contact forms, feedback forms, etc.)

**Expected Results:**
- Form data is sent to the production Strapi instance
- Appropriate success/error messages are displayed
- Data is stored correctly

### 6. CORS Configuration Testing

#### 6.1 Basic CORS Verification

Check browser console for CORS-related errors during all previous tests.

**Expected Results:**
- No CORS errors appear in the browser console

#### 6.2 Preflight Requests

Use browser developer tools to observe preflight (OPTIONS) requests for non-simple requests.

**Expected Results:**
- OPTIONS requests receive appropriate responses with CORS headers
- Subsequent actual requests succeed

### 7. Error Handling Testing

#### 7.1 Network Error Handling

1. Temporarily disable network connectivity
2. Attempt operations that require API calls

**Expected Results:**
- Appropriate error messages are displayed
- UI remains usable
- Application recovers when connectivity is restored

#### 7.2 API Error Handling

1. Attempt operations that should fail (e.g., accessing unauthorized resources)

**Expected Results:**
- API errors are handled gracefully
- User-friendly error messages are displayed
- Application state remains consistent

#### 7.3 Form Validation

1. Submit forms with invalid data

**Expected Results:**
- Validation errors from the Strapi API are displayed correctly
- Form remains usable and can be corrected and resubmitted

### 8. Performance Testing

#### 8.1 Response Time

Observe and note response times for various API calls.

**Expected Results:**
- Response times are within acceptable limits
- No timeouts occur under normal conditions

#### 8.2 Concurrent Operations

Perform multiple operations simultaneously (e.g., multiple uploads, form submissions).

**Expected Results:**
- All operations complete successfully
- UI remains responsive

## 🔍 Common Issues and Troubleshooting

### Authentication Issues

- **JWT Token Problems**: Check browser storage to ensure tokens are being stored correctly.
- **Role Assignment**: Verify that user roles are correctly assigned in the Strapi admin panel.

### CORS Issues

- **Missing Headers**: Ensure the Strapi CORS configuration includes all necessary origins.
- **Credentials Handling**: Check if credentials are being included in requests when needed.

### Media Upload Issues

- **File Size Limits**: Verify that file size limits match between frontend and Strapi configuration.
- **Storage Configuration**: Ensure Strapi's upload provider is correctly configured.

### Data Retrieval Issues

- **Missing Data**: Check if data exists in the production database.
- **Permission Issues**: Verify that user roles have appropriate permissions in Strapi.

## 🔄 Rollback Plan

If critical issues are discovered during testing, follow these steps to roll back to the local development environment:

1. Update the `.env` file to use local development settings:
   ```
   PUBLIC_STRAPI_URL=http://localhost
   PUBLIC_STRAPI_PORT=1338
   PUBLIC_ENVIRONMENT=development
   ```

2. Restart the frontend application:
   ```bash
   npm run dev
   ```

3. Document all issues encountered with the production instance for future resolution.

4. If using a CI/CD pipeline, revert any deployment commits and redeploy with local development settings.

## 📝 Test Results Documentation

For each test section, document:

1. Test status (Pass/Fail)
2. Any issues encountered
3. Screenshots of errors (if applicable)
4. Browser and environment information

## 🏁 Final Verification Checklist

Before considering the migration successful, verify:

- [ ] All authentication flows work correctly
- [ ] All data retrieval operations return expected results
- [ ] Media uploads and retrievals function properly
- [ ] Form submissions save data correctly
- [ ] No CORS errors appear in the console
- [ ] Error handling works as expected
- [ ] Performance is acceptable

## 📊 Post-Migration Monitoring

After completing the test plan and verifying the migration was successful:

1. Monitor application logs for unexpected errors
2. Watch for any increase in error rates or response times
3. Gather user feedback on any issues not caught during testing
4. Have a plan for quickly addressing any issues that arise

This test plan provides a comprehensive approach to verifying the successful migration to the production Strapi instance. By methodically testing each aspect of the application's interaction with the backend, you can ensure a smooth transition and identify any issues before they impact users.