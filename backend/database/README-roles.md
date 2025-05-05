# TributeStream Role Configuration

This README provides instructions for verifying and testing the user roles and permissions configuration for the TributeStream application.

## Configuration Summary

Two custom roles have been configured for the TributeStream application:

1. **Funeral Director** - Administrative role with extended capabilities
2. **Family Contact** - Limited role focused on tribute management

The configuration is implemented in `src/extensions/users-permissions/strapi-server.js` and will automatically create these roles and set their permissions when Strapi starts.

## Verifying the Configuration

To verify that the roles and permissions have been properly configured:

1. Start the Strapi server:
   ```bash
   cd backend/database
   npm run develop
   ```

2. Log in to the Strapi admin panel (typically at http://localhost:1337/admin)

3. Navigate to Settings > Users & Permissions Plugin > Roles

4. You should see the two custom roles listed alongside the default Strapi roles:
   - Funeral Director
   - Family Contact
   - Authenticated
   - Public

5. Click on each role to verify that the permissions have been correctly assigned:
   - Funeral Director should have full access to tributes and limited user management
   - Family Contact should have limited access focused on viewing and updating tributes

## Testing the Roles

To test the roles with actual users:

1. Create test users in the Strapi admin panel:
   - Go to Content Manager > Collection Types > Users
   - Create a user with the "Funeral Director" role
   - Create another user with the "Family Contact" role

2. Test authentication with these users through the frontend application:
   - Use the login page to authenticate as each user
   - Verify that the appropriate permissions are enforced

3. Verify permission restrictions:
   - Family Contact users should not be able to create or delete tributes
   - Funeral Director users should have full tribute management capabilities

## Troubleshooting

If the roles are not created automatically:

1. Check the Strapi server logs for any errors during startup
2. Verify that the `strapi-server.js` file is in the correct location
3. Restart the Strapi server to trigger the bootstrap function

If permissions are not working as expected:

1. Review the permissions assigned to each role in the Strapi admin panel
2. Check that the frontend application is correctly checking for permissions
3. Verify that the JWT token is being properly passed in API requests

## Further Documentation

For more detailed information about the roles and permissions configuration, see:
- `docs/user-roles-permissions.md` - Comprehensive documentation of roles and permissions