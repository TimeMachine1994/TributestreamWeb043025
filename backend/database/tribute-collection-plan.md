# Tribute Collection Type Implementation Plan

## Overview

This document outlines the implementation plan for adding a new "Tribute" collection type to the Strapi backend. The collection will store tributes with names and auto-generated slugs.

## Requirements

- Collection name: "Tribute"
- Fields:
  - Name (text field): to store the original name entered by the user
  - Slug (text field): auto-generated kebab-case version of the name, not manually editable
- Authentication required for CRUD operations
- Validation for both name and slug fields
- Unique constraint on the slug field

## Files to Create

### 1. Schema Definition

**Path**: `backend/database/src/api/tribute/content-types/tribute/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "tributes",
  "info": {
    "singularName": "tribute",
    "pluralName": "tributes",
    "displayName": "Tribute",
    "description": "Collection of tributes with auto-generated slugs"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "minLength": 2
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "required": true,
      "unique": true
    }
  }
}
```

### 2. Controller File

**Path**: `backend/database/src/api/tribute/controllers/tribute.ts`

```typescript
/**
 * tribute controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::tribute.tribute');
```

### 3. Routes File

**Path**: `backend/database/src/api/tribute/routes/tribute.ts`

```typescript
/**
 * tribute router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::tribute.tribute');
```

### 4. Service File

**Path**: `backend/database/src/api/tribute/services/tribute.ts`

```typescript
/**
 * tribute service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::tribute.tribute');
```

## Implementation Notes

1. We're using the `uid` field type for the slug which automatically:
   - Generates a URL-friendly version of the targetField (name)
   - Enforces uniqueness
   - Integrates with Strapi's admin UI
   - Auto-formats input to kebab-case

2. Authentication is handled by Strapi's permissions system. After creation, you'll need to configure permissions in the admin panel:
   - Go to Settings > USERS & PERMISSIONS PLUGIN > Roles
   - Edit the roles to grant appropriate permissions for the tribute collection

3. The `options.draftAndPublish: true` enables the draft/publish workflow for tributes.

## Testing the Implementation

After implementing the files:

1. Restart your Strapi server
2. Access the admin panel and verify the Tribute collection appears
3. Create a test tribute and confirm:
   - Slug is auto-generated from the name
   - Validation works for required fields
   - Duplicate slugs are prevented

## Frontend Integration

When integrating with the frontend, you'll need to:

1. Authenticate before making requests to create/update/delete tributes
2. Only send the "name" field in the request body - the slug will be auto-generated
3. Use the API endpoint `/api/tributes` for CRUD operations