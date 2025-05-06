# Production Migration Guide

This document outlines the steps required to migrate from the local Strapi development environment to the production Strapi instance.

## Completed Changes

The following changes have been made to migrate the frontend to use the production Strapi instance:

1. Created `.env` file in the frontend directory with:
   ```
   PUBLIC_STRAPI_URL=https://miraculous-morning-0acdf6e165.strapiapp.com
   PUBLIC_STRAPI_PORT=443
   PUBLIC_ENVIRONMENT=production
   ```

2. Updated the production configuration in `frontend/src/lib/config.ts` to use the production Strapi URL.

3. Fixed hardcoded URL in `frontend/src/routes/+layout.server.ts` to use environment variables instead of hardcoded localhost:1338.

## Post-Migration Steps

### 1. Configuring CORS in Strapi Admin Panel

1. Log in to the Strapi admin panel at https://miraculous-morning-0acdf6e165.strapiapp.com/admin
2. Navigate to Settings > Global Settings > Security > CORS
3. Add the following origins to the allowed origins list:
   - Your frontend production URL (e.g., https://tributestream.com)
   - Your frontend staging URL (if applicable)
   - Your local development URL (e.g., http://localhost:5178) for testing
4. Save the changes

### 2. User Migration

1. **Admin Users**: Create new admin users in the production Strapi instance
   - Navigate to Settings > Administration panel > Users
   - Add new admin users with appropriate permissions
   - Send invitations to team members

2. **End Users**: There are two approaches for migrating end users:
   - **Option A**: Have users register again in the production environment
   - **Option B**: Export users from development and import to production:
     ```bash
     # Export users from development (run in backend/database directory)
     npx strapi export --no-encrypt --file=users-export

     # Import users to production (run in production backend directory)
     npx strapi import -f ./users-export.tar.gz
     ```

### 3. Media Files Transfer

1. Export media files from local development:
   ```bash
   # Navigate to backend/database directory
   tar -czvf uploads.tar.gz ./public/uploads
   ```

2. Import media files to production:
   - Upload the tar.gz file to the production server
   - Extract the files to the appropriate directory
   - Alternatively, use the Strapi admin panel to upload media files manually

### 4. API Key/Token Configuration

1. Generate API tokens in the production Strapi instance:
   - Navigate to Settings > Global Settings > API Tokens
   - Create tokens with appropriate permissions and expiration dates
   - Update any services that use these tokens

2. Update any external services that integrate with Strapi to use the new production URL and tokens

### 5. Testing Procedures

1. **Authentication Testing**:
   - Test user registration
   - Test user login
   - Test password reset functionality
   - Verify JWT token generation and validation

2. **Content Testing**:
   - Verify that tributes are correctly displayed
   - Test tribute creation, update, and deletion
   - Verify media uploads and retrieval

3. **Role-Based Access Testing**:
   - Test access for different user roles (Family Contact, Funeral Director, etc.)
   - Verify that permissions are correctly applied

4. **Performance Testing**:
   - Test response times for API calls
   - Monitor server load during peak usage

5. **Error Handling**:
   - Test error scenarios (e.g., invalid input, server unavailability)
   - Verify that appropriate error messages are displayed

### 6. Monitoring and Logging

1. Set up monitoring for the production Strapi instance:
   - Configure health checks
   - Set up alerts for server issues
   - Monitor API response times

2. Configure logging:
   - Set up log rotation
   - Configure log levels appropriate for production
   - Set up log aggregation if needed

### 7. Backup Strategy

1. Configure regular backups of:
   - Database content
   - Media files
   - Configuration files

2. Test backup restoration procedures

## Rollback Plan

In case of issues with the production migration, follow these steps to roll back:

1. Revert the `.env` file to use local development settings:
   ```
   PUBLIC_STRAPI_URL=http://localhost
   PUBLIC_STRAPI_PORT=1338
   PUBLIC_ENVIRONMENT=development
   ```

2. Restart the frontend application

3. Document any issues encountered during the migration for future reference