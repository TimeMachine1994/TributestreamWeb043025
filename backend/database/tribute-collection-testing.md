# Tribute Collection Type Testing Guide

This guide outlines how to test the Tribute collection type after implementation to ensure it meets all requirements.

## Prerequisites

- Strapi server is running (`npm run develop` in the backend/database directory)
- Access to the Strapi admin panel
- API testing tool (like Postman, Insomnia, or curl)

## Testing Checklist

### Step 1: Admin Panel Verification

1. Log in to the Strapi admin panel (typically at http://localhost:1337/admin)
2. Verify that "Tribute" appears in the Content-Type Builder
3. Check that the collection has the required fields:
   - `name` (string, required)
   - `slug` (UID, required, unique, generated from name)

### Step 2: Permission Configuration

1. Go to Settings > USERS & PERMISSIONS PLUGIN > Roles
2. For the "Authenticated" role:
   - Enable all CRUD permissions for the Tribute collection type
3. For the "Public" role:
   - Enable only "find" and "findOne" permissions, if you want public read access
   - Or disable all permissions if you want full authentication requirements

### Step 3: Create Test Records

1. Navigate to "Content Manager" > "Tribute" in the admin panel
2. Create a new tribute with the following details:
   - Name: "Test Tribute"
   - Observe that the slug is auto-generated as "test-tribute"
3. Create another tribute:
   - Name: "Test Tribute"
   - Verify that a different slug is generated (e.g., "test-tribute-1") to maintain uniqueness

### Step 4: API Testing

#### Authentication

1. Get a JWT token:
   ```
   POST /api/auth/local
   {
     "identifier": "your-email@example.com",
     "password": "your-password"
   }
   ```
2. Save the JWT token for subsequent requests

#### Read Operations

1. Get all tributes:
   ```
   GET /api/tributes
   ```

2. Get a specific tribute by ID:
   ```
   GET /api/tributes/1
   ```

#### Create Operation

1. Create a new tribute (requires authentication):
   ```
   POST /api/tributes
   Authorization: Bearer your-jwt-token
   {
     "data": {
       "name": "New Tribute"
     }
   }
   ```
2. Verify in the response that:
   - The record was created successfully
   - A slug was auto-generated as "new-tribute"
   - The record has a valid ID

#### Update Operation

1. Update an existing tribute (requires authentication):
   ```
   PUT /api/tributes/3
   Authorization: Bearer your-jwt-token
   {
     "data": {
       "name": "Updated Tribute"
     }
   }
   ```
2. Verify in the response that:
   - The name was updated
   - The slug was updated to match the new name

#### Delete Operation

1. Delete a tribute (requires authentication):
   ```
   DELETE /api/tributes/3
   Authorization: Bearer your-jwt-token
   ```
2. Verify that the tribute is removed by trying to fetch it again

### Step 5: Validation Testing

1. Try to create a tribute without a name:
   ```
   POST /api/tributes
   Authorization: Bearer your-jwt-token
   {
     "data": {}
   }
   ```
2. Verify that you receive a validation error

3. Try to create a tribute with a name that's too short:
   ```
   POST /api/tributes
   Authorization: Bearer your-jwt-token
   {
     "data": {
       "name": "A"
     }
   }
   ```
4. Verify that you receive a validation error if minLength is set in the schema

### Step 6: Authorization Testing

1. Try to create a tribute without authentication:
   ```
   POST /api/tributes
   {
     "data": {
       "name": "Unauthenticated Tribute"
     }
   }
   ```
2. Verify that you receive an unauthorized error

3. Try to update a tribute without authentication:
   ```
   PUT /api/tributes/1
   {
     "data": {
       "name": "Unauthenticated Update"
     }
   }
   ```
4. Verify that you receive an unauthorized error

## Troubleshooting

If you encounter issues during testing, check:

1. Strapi server logs for errors
2. Permissions configuration in the admin panel
3. Schema definition in the `schema.json` file
4. JWT token expiration (tokens typically expire after 30 days)

## Expected API Response Structure

A successful response from the API should look like:

```json
{
  "data": {
    "id": 1,
    "attributes": {
      "name": "Test Tribute",
      "slug": "test-tribute",
      "createdAt": "2025-04-30T11:23:45.678Z",
      "updatedAt": "2025-04-30T11:23:45.678Z",
      "publishedAt": "2025-04-30T11:23:45.678Z"
    }
  },
  "meta": {}
}