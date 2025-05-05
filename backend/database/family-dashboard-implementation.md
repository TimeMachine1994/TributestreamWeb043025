# Family Dashboard Backend Enhancement Implementation

This document contains the implementation details for enhancing the TributeStream backend to support the redesigned family dashboard.

## 1. New Content Types

### 1.1 Location Content Type

Create the following files:

**backend/database/src/api/location/content-types/location/schema.json**
```json
{
  "kind": "collectionType",
  "collectionName": "locations",
  "info": {
    "singularName": "location",
    "pluralName": "locations",
    "displayName": "Location",
    "description": "Event locations associated with tributes"
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
    "address": {
      "type": "string",
      "required": true
    },
    "startTime": {
      "type": "time",
      "required": true
    },
    "duration": {
      "type": "integer",
      "min": 1,
      "default": 1,
      "required": true
    },
    "date": {
      "type": "date",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "tribute": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::tribute.tribute",
      "inversedBy": "locations"
    }
  }
}
```

**backend/database/src/api/location/controllers/location.ts**
```typescript
/**
 * location controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::location.location');
```

**backend/database/src/api/location/services/location.ts**
```typescript
/**
 * location service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::location.location');
```

**backend/database/src/api/location/routes/location.ts**
```typescript
/**
 * location router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::location.location');
```

### 1.2 MediaItem Content Type

Create the following files:

**backend/database/src/api/media-item/content-types/media-item/schema.json**
```json
{
  "kind": "collectionType",
  "collectionName": "media_items",
  "info": {
    "singularName": "media-item",
    "pluralName": "media-items",
    "displayName": "MediaItem",
    "description": "Media items associated with tributes"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "type": {
      "type": "enumeration",
      "enum": [
        "image",
        "video",
        "document"
      ],
      "required": true,
      "default": "image"
    },
    "file": {
      "type": "media",
      "multiple": false,
      "required": true,
      "allowedTypes": [
        "images",
        "files",
        "videos"
      ]
    },
    "thumbnail": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": [
        "images"
      ]
    },
    "description": {
      "type": "text"
    },
    "tribute": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::tribute.tribute",
      "inversedBy": "mediaItems"
    }
  }
}
```

**backend/database/src/api/media-item/controllers/media-item.ts**
```typescript
/**
 * media-item controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::media-item.media-item');
```

**backend/database/src/api/media-item/services/media-item.ts**
```typescript
/**
 * media-item service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::media-item.media-item');
```

**backend/database/src/api/media-item/routes/media-item.ts**
```typescript
/**
 * media-item router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::media-item.media-item');
```

### 1.3 Package Content Type

Create the following files:

**backend/database/src/api/package/content-types/package/schema.json**
```json
{
  "kind": "collectionType",
  "collectionName": "packages",
  "info": {
    "singularName": "package",
    "pluralName": "packages",
    "displayName": "Package",
    "description": "Service packages that can be associated with tributes"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "description": {
      "type": "text",
      "required": true
    },
    "price": {
      "type": "decimal",
      "required": true,
      "min": 0
    },
    "features": {
      "type": "json",
      "required": true
    },
    "isActive": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "tributes": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::tribute.tribute",
      "mappedBy": "package"
    }
  }
}
```

**backend/database/src/api/package/controllers/package.ts**
```typescript
/**
 * package controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::package.package');
```

**backend/database/src/api/package/services/package.ts**
```typescript
/**
 * package service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::package.package');
```

**backend/database/src/api/package/routes/package.ts**
```typescript
/**
 * package router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::package.package');
```

## 2. Extend Tribute Content Type

Update the existing Tribute content type schema:

**backend/database/src/api/tribute/content-types/tribute/schema.json** (UPDATED)
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
    },
    "description": {
      "type": "text"
    },
    "status": {
      "type": "enumeration",
      "enum": [
        "draft",
        "published",
        "archived"
      ],
      "default": "draft"
    },
    "owner": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user",
      "inversedBy": "tributes"
    },
    "liveStreamDate": {
      "type": "date"
    },
    "liveStreamStartTime": {
      "type": "time"
    },
    "liveStreamDuration": {
      "type": "integer",
      "min": 1,
      "default": 1
    },
    "priceTotal": {
      "type": "decimal",
      "min": 0
    },
    "package": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::package.package",
      "inversedBy": "tributes"
    },
    "locations": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::location.location",
      "mappedBy": "tribute"
    },
    "mediaItems": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::media-item.media-item",
      "mappedBy": "tribute"
    },
    "invitedUsers": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "plugin::users-permissions.user"
    }
  }
}
```

## 3. Custom API Endpoints

### 3.1 Extend Tribute Controller with Custom Endpoints

Update the existing tribute controller:

**backend/database/src/api/tribute/controllers/tribute.ts** (UPDATED)
```typescript
/**
 * tribute controller
 */

import { factories } from '@strapi/strapi';

const defaultController = factories.createCoreController('api::tribute.tribute');

export default {
  ...defaultController,
  
  // Custom controller method for livestream schedule management
  async updateSchedule(ctx) {
    const { id } = ctx.params;
    const { liveStreamDate, liveStreamStartTime, liveStreamDuration, locations } = ctx.request.body;
    
    try {
      // Update tribute livestream data
      const tribute = await strapi.entityService.update('api::tribute.tribute', id, {
        data: {
          liveStreamDate,
          liveStreamStartTime,
          liveStreamDuration
        }
      });
      
      // Handle locations if provided
      if (locations && locations.length > 0) {
        // Create or update locations
        const locationPromises = locations.map(location => {
          if (location.id) {
            return strapi.entityService.update('api::location.location', location.id, {
              data: {
                ...location,
                tribute: id
              }
            });
          } else {
            return strapi.entityService.create('api::location.location', {
              data: {
                ...location,
                tribute: id
              }
            });
          }
        });
        
        await Promise.all(locationPromises);
      }
      
      // Return updated tribute with populated relations
      const result = await strapi.entityService.findOne('api::tribute.tribute', id, {
        populate: ['locations']
      });
      
      return { data: result };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
  
  // Custom controller method for handling media content
  async uploadMedia(ctx) {
    const { id } = ctx.params;
    const { files } = ctx.request.files || {};
    
    if (!files) {
      return ctx.badRequest('No files provided');
    }
    
    try {
      // Upload file using Strapi's upload plugin
      const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
        files: Object.values(files),
        data: {
          ref: 'api::media-item.media-item',
          refId: null,
          field: 'file'
        }
      });
      
      // Create media item entry
      const mediaItem = await strapi.entityService.create('api::media-item.media-item', {
        data: {
          name: files.name || uploadedFiles[0].name,
          type: files.type?.startsWith('image') ? 'image' : 
                files.type?.startsWith('video') ? 'video' : 'document',
          tribute: id,
          file: uploadedFiles[0].id
        }
      });
      
      return { success: true, data: mediaItem };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
  
  // Custom controller method for user invitation functionality
  async inviteUser(ctx) {
    const { id } = ctx.params;
    const { email, role } = ctx.request.body;
    
    try {
      // Check if user exists
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email }
      });
      
      let user;
      
      if (existingUser) {
        // Add existing user to invited users of tribute
        user = existingUser;
      } else {
        // Create new user with temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const pluginStore = await strapi.store({ 
          type: 'plugin',
          name: 'users-permissions' 
        });
        const settings = await pluginStore.get({ key: 'advanced' });
        const defaultRole = await strapi
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: role || 'family_contact' } });
          
        user = await strapi.plugin('users-permissions').service('user').add({
          username: email.split('@')[0],
          email,
          password: tempPassword,
          role: defaultRole.id,
          confirmed: false
        });
        
        // Send invitation email with temporary password
        await strapi.plugins['email'].services.email.send({
          to: email,
          subject: 'You have been invited to a tribute',
          html: `<p>You have been invited to view and manage a tribute. Your temporary password is: ${tempPassword}</p>
                 <p>Please change your password after first login.</p>`
        });
      }
      
      // Associate user with tribute
      await strapi.entityService.update('api::tribute.tribute', id, {
        data: {
          invitedUsers: {
            connect: [user.id]
          }
        }
      });
      
      return { success: true, message: 'User invitation sent' };
    } catch (error) {
      ctx.throw(500, error);
    }
  }
};
```

### 3.2 Extend Tribute Routes

Update the existing tribute routes:

**backend/database/src/api/tribute/routes/tribute.ts** (UPDATED)
```typescript
/**
 * tribute router
 */

export default {
  routes: [
    // Default routes
    {
      method: 'GET',
      path: '/tributes',
      handler: 'tribute.find',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/tributes/:id',
      handler: 'tribute.findOne',
      config: {
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/tributes',
      handler: 'tribute.create',
      config: {
        policies: []
      }
    },
    {
      method: 'PUT',
      path: '/tributes/:id',
      handler: 'tribute.update',
      config: {
        policies: []
      }
    },
    {
      method: 'DELETE',
      path: '/tributes/:id',
      handler: 'tribute.delete',
      config: {
        policies: []
      }
    },
    
    // Custom routes
    {
      method: 'PUT',
      path: '/tributes/:id/schedule',
      handler: 'tribute.updateSchedule',
      config: {
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/tributes/:id/media',
      handler: 'tribute.uploadMedia',
      config: {
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/tributes/:id/invite',
      handler: 'tribute.inviteUser',
      config: {
        policies: []
      }
    }
  ]
};
```

## 4. Update Permissions Structure

Modify the users-permissions plugin extension:

**backend/database/src/extensions/users-permissions/strapi-server.js** (UPDATED)
```javascript
module.exports = (plugin) => {
  const setupRolePermissions = async () => {
    // Get the roles
    const funeralDirectorRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'funeral_director' } });
      
    const familyContactRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'family_contact' } });
    
    if (!funeralDirectorRole || !familyContactRole) {
      return;
    }
    
    // Define permissions for Funeral Director
    const funeralDirectorPermissions = {
      // Tribute permissions
      'api::tribute.tribute': {
        controllers: {
          'tribute': ['find', 'findOne', 'create', 'update', 'delete', 'updateSchedule', 'uploadMedia', 'inviteUser']
        }
      },
      // Location permissions
      'api::location.location': {
        controllers: {
          'location': ['find', 'findOne', 'create', 'update', 'delete']
        }
      },
      // MediaItem permissions
      'api::media-item.media-item': {
        controllers: {
          'media-item': ['find', 'findOne', 'create', 'update', 'delete']
        }
      },
      // Package permissions
      'api::package.package': {
        controllers: {
          'package': ['find', 'findOne', 'create', 'update', 'delete']
        }
      }
    };
    
    // Define permissions for Family Contact
    const familyContactPermissions = {
      // Tribute permissions (limited)
      'api::tribute.tribute': {
        controllers: {
          'tribute': ['find', 'findOne', 'update', 'updateSchedule', 'uploadMedia', 'inviteUser']
        }
      },
      // Location permissions (limited)
      'api::location.location': {
        controllers: {
          'location': ['find', 'findOne', 'create', 'update']
        }
      },
      // MediaItem permissions (limited)
      'api::media-item.media-item': {
        controllers: {
          'media-item': ['find', 'findOne', 'create', 'update']
        }
      },
      // Package permissions (read-only)
      'api::package.package': {
        controllers: {
          'package': ['find', 'findOne']
        }
      }
    };
    
    // Function to update permissions
    const updatePermissions = async (roleId, permissions) => {
      // Get all permissions for the role
      const rolePermissions = await strapi
        .query('plugin::users-permissions.permission')
        .findMany({ where: { role: roleId } });
      
      // For each API and action, set the correct permission
      for (const [api, { controllers }] of Object.entries(permissions)) {
        for (const [controller, actions] of Object.entries(controllers)) {
          for (const action of actions) {
            const permission = rolePermissions.find(p => 
              p.controller === controller && 
              p.action === action && 
              p.service === api
            );
            
            if (permission) {
              // Update existing permission
              await strapi
                .query('plugin::users-permissions.permission')
                .update({
                  where: { id: permission.id },
                  data: { enabled: true }
                });
            }
          }
        }
      }
    };
    
    // Update permissions for both roles
    await updatePermissions(funeralDirectorRole.id, funeralDirectorPermissions);
    await updatePermissions(familyContactRole.id, familyContactPermissions);
  };

  // Run setup after server start
  strapi.db.lifecycles.subscribe({
    models: ['plugin::users-permissions.role'],
    afterCreate: setupRolePermissions,
    afterUpdate: setupRolePermissions
  });

  return plugin;
};
```

## 5. Testing Plan

After implementing these changes, you should test the following:

### 5.1 Content Type Testing

1. Create test instances of each new content type:
   - Location
   - MediaItem
   - Package

2. Verify relationships:
   - Add locations to a tribute and confirm they display correctly
   - Upload media items and verify they're associated with the correct tribute
   - Assign a package to a tribute and verify pricing reflection

### 5.2 API Endpoint Testing

3. Test livestream schedule management:
   ```bash
   curl -X PUT \
     http://localhost:1337/api/tributes/1/schedule \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
     -d '{
       "liveStreamDate": "2025-06-01",
       "liveStreamStartTime": "14:00:00",
       "liveStreamDuration": 2,
       "locations": [
         {
           "name": "Memorial Chapel",
           "address": "123 Main St, Anytown",
           "startTime": "14:00:00",
           "duration": 2,
           "date": "2025-06-01",
           "description": "Main memorial service"
         }
       ]
     }'
   ```

4. Test media upload:
   ```bash
   curl -X POST \
     http://localhost:1337/api/tributes/1/media \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
     -F 'files=@/path/to/image.jpg' \
     -F 'name=Memorial Photo' \
     -F 'type=image'
   ```

5. Test user invitation:
   ```bash
   curl -X POST \
     http://localhost:1337/api/tributes/1/invite \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
     -d '{
       "email": "family@example.com",
       "role": "family_contact"
     }'
   ```

### 5.3 Permission Testing

6. Test role-based permissions:
   - Log in as a Funeral Director and verify all operations work
   - Log in as a Family Contact and verify restricted operations are blocked
   - Try unauthorized access to verify JWT protection works

## 6. Implementation Notes

- After creating the schema files, you'll need to rebuild and restart the Strapi application:
  ```bash
  cd backend/database
  npm run build
  npm run develop
  ```

- If you encounter any issues with permissions, you may need to manually set them in the Strapi admin panel.

- For media handling, ensure the Upload plugin is properly configured in Strapi.

- For email functionality in the invitation system, configure the Email plugin in Strapi with your SMTP settings.