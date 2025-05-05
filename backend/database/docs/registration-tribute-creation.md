# Registration and Tribute Creation Process

This document outlines the registration and tribute creation process in the TributeStream application.

## User Registration Flow

1. User submits registration form with:
   - Username
   - Email
   - Password
   - Optional: Full Name
   - Optional: Phone Number

2. Frontend sends registration request to `/api/auth/local/register` endpoint
   - Custom fields (fullName, phoneNumber) are passed directly in the request body
   - No role is specified in the request (Strapi assigns 'authenticated' by default)

3. After successful registration:
   - JWT token is stored in an HTTP-only cookie
   - User role is stored in a separate cookie for client-side access
   - User is redirected to the appropriate dashboard based on their role

## Role Assignment

New users are automatically assigned the 'family_contact' role in two scenarios:

1. During registration:
   - The registration API endpoint attempts to assign the 'family_contact' role
   - This happens after the initial user creation

2. During tribute creation:
   - If a user creates a tribute and doesn't have a specific role yet
   - The tribute creation API assigns the 'family_contact' role

The role assignment process:
1. Fetches available roles from Strapi
2. Finds the 'family_contact' role ID
3. Updates the user's role using the Strapi API

## Tribute Creation Process

1. User submits the tribute creation form with:
   - Tribute name (required)
   - Optional description

2. Frontend sends creation request to `/api/tributes` endpoint

3. Backend processing:
   - Generates a unique slug from the tribute name
   - Creates the tribute in Strapi
   - Associates the tribute with the current user (owner relationship)
   - Ensures the user has the 'family_contact' role

4. After successful creation:
   - User is shown a success message with a link to the new tribute
   - The tribute is initially created in 'draft' status

## Data Models

### User Model
- Standard Strapi user fields (username, email, password)
- Custom fields:
  - fullName: String
  - phoneNumber: String
- Relations:
  - role: Relation to Role model
  - tributes: One-to-many relation to Tribute model

### Tribute Model
- name: String (required)
- slug: UID (unique, generated from name)
- description: Text
- status: Enumeration (draft, published, archived)
- owner: Relation to User model

## Role Permissions

### Family Contact Role
- Can view and update their own tributes
- Cannot create tributes directly (must register first)
- Limited access to media management

### Funeral Director Role
- Full access to tribute management
- Can create, view, update, and delete tributes
- Limited user management capabilities