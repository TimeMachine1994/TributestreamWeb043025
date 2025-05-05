# TributeStream User Roles and Permissions

This document outlines the user roles and permissions configured in the TributeStream application.

## Roles Overview

The application has two custom roles in addition to the default Strapi roles:

1. **Funeral Director** - Administrative role with extended capabilities
2. **Family Contact** - Limited role focused on tribute management

## Permissions Details

### Funeral Director Role

Funeral Directors have comprehensive access to manage tributes and limited user management capabilities:

#### Tribute Management
- Create new tributes
- View all tributes
- Update existing tributes
- Delete tributes
- Publish/unpublish tributes

#### User Management
- View users
- Create new users
- Update user information

#### Media Management
- Upload media files
- View uploaded media
- Update media information

### Family Contact Role

Family Contacts have limited permissions focused on viewing and updating tributes:

#### Tribute Management
- View tributes
- Update existing tributes (content management)

#### Media Management
- View uploaded media
- Upload new media files

## Permission Restrictions

### Family Contact Restrictions
- Cannot create new tributes
- Cannot delete tributes
- Cannot publish/unpublish tributes
- No access to user management
- Cannot delete uploaded media

### Funeral Director Restrictions
- Cannot delete users
- Limited administrative capabilities

## Implementation Details

These roles and permissions are configured through Strapi's users-permissions plugin and are automatically set up when the application starts. The configuration is defined in:

```
backend/database/src/extensions/users-permissions/strapi-server.js
```

## How to Assign Roles

Roles can be assigned to users through the Strapi admin panel:

1. Navigate to the Strapi admin panel
2. Go to Settings > Users & Permissions Plugin > Roles
3. Verify that both roles are listed
4. To assign a role to a user, go to Content Manager > Users
5. Edit a user and select the appropriate role from the dropdown

## Default Roles

In addition to the custom roles, Strapi provides two default roles:

1. **Authenticated** - Default role for logged-in users
2. **Public** - Default role for unauthenticated users

These default roles have minimal permissions configured.