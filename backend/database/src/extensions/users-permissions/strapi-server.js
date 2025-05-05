'use strict';

// Import lodash
const _ = require('lodash');
const { sanitize } = require('@strapi/utils');
const { ApplicationError } = require('@strapi/utils').errors;

// Email validation regex
const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Sanitize user data for safe return to client
 */
const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

module.exports = (plugin) => {
  // Get the actions that should be available for each role
  const getActionsForFuneralDirector = async () => {
    const actions = [
      // Tribute permissions - full access
      { action: 'plugin::content-manager.explorer.create', subject: 'api::tribute.tribute' },
      { action: 'plugin::content-manager.explorer.read', subject: 'api::tribute.tribute' },
      { action: 'plugin::content-manager.explorer.update', subject: 'api::tribute.tribute' },
      { action: 'plugin::content-manager.explorer.delete', subject: 'api::tribute.tribute' },
      { action: 'plugin::content-manager.explorer.publish', subject: 'api::tribute.tribute' },
      
      // API access for tributes
      { action: 'api::tribute.tribute.find' },
      { action: 'api::tribute.tribute.findOne' },
      { action: 'api::tribute.tribute.create' },
      { action: 'api::tribute.tribute.update' },
      { action: 'api::tribute.tribute.delete' },
      
      // Funeral Home permissions - full access
      { action: 'plugin::content-manager.explorer.create', subject: 'api::funeral-home.funeral-home' },
      { action: 'plugin::content-manager.explorer.read', subject: 'api::funeral-home.funeral-home' },
      { action: 'plugin::content-manager.explorer.update', subject: 'api::funeral-home.funeral-home' },
      
      // API access for funeral homes
      { action: 'api::funeral-home.funeral-home.find' },
      { action: 'api::funeral-home.funeral-home.findOne' },
      { action: 'api::funeral-home.funeral-home.create' },
      { action: 'api::funeral-home.funeral-home.update' },
      { action: 'api::funeral-home.funeral-home-custom.search' },
      { action: 'api::funeral-home.funeral-home-custom.listAll' },
      
      // User management (limited)
      { action: 'plugin::users-permissions.user.find' },
      { action: 'plugin::users-permissions.user.findOne' },
      { action: 'plugin::users-permissions.user.create' },
      { action: 'plugin::users-permissions.user.update' },
      
      // Upload capabilities
      { action: 'plugin::upload.read' },
      { action: 'plugin::upload.assets.create' },
      { action: 'plugin::upload.assets.update' }
    ];
    
    return actions;
  };
  
  const getActionsForFamilyContact = async () => {
    const actions = [
      // Tribute permissions - limited access
      { action: 'plugin::content-manager.explorer.read', subject: 'api::tribute.tribute' },
      { action: 'plugin::content-manager.explorer.update', subject: 'api::tribute.tribute' },
      
      // API access for tributes - limited
      { action: 'api::tribute.tribute.find' },
      { action: 'api::tribute.tribute.findOne' },
      { action: 'api::tribute.tribute.update' },
      
      // Upload capabilities - limited
      { action: 'plugin::upload.read' },
      { action: 'plugin::upload.assets.create' }
    ];
    
    return actions;
  };

  // Function to create a role if it doesn't exist
  const createRoleIfNotExists = async (name, description, type) => {
    const roleService = strapi.plugin('users-permissions').service('role');
    const roles = await roleService.find();
    
    // Check if role already exists
    const existingRole = roles.filter(role => role.name === name)[0];
    if (existingRole) {
      console.log(`Role "${name}" already exists with id: ${existingRole.id}`);
      return existingRole;
    }
    
    // Create the role
    const role = await roleService.create({
      name,
      description,
      type
    });
    
    console.log(`Created role "${name}" with id: ${role.id}`);
    return role;
  };

  // Function to set permissions for a role
  const setRolePermissions = async (roleId, actions) => {
    const permissionService = strapi.plugin('users-permissions').service('permission');
    
    // First, remove any existing permissions for this role
    await permissionService.deleteByRoleId(roleId);
    
    // Create the new permissions
    const permissions = actions.map(action => ({
      action: action.action,
      subject: action.subject,
      role: roleId,
      enabled: true
    }));
    
    await permissionService.createMany(permissions);
    console.log(`Set ${permissions.length} permissions for role ${roleId}`);
  };

  // Bootstrap function to set up roles and permissions
  const bootstrap = async () => {
    try {
      // Create the roles if they don't exist
      const funeralDirectorRole = await createRoleIfNotExists(
        'Funeral Director',
        'Manages tributes and has administrative capabilities',
        'funeral_director'
      );
      
      const familyContactRole = await createRoleIfNotExists(
        'Family Contact',
        'Limited access focused on tribute management',
        'family_contact'
      );
      
      // Set permissions for each role
      const funeralDirectorActions = await getActionsForFuneralDirector();
      await setRolePermissions(funeralDirectorRole.id, funeralDirectorActions);
      
      const familyContactActions = await getActionsForFamilyContact();
      await setRolePermissions(familyContactRole.id, familyContactActions);
      
      console.log('✅ Roles and permissions configured successfully');
    } catch (error) {
      console.error('❌ Error configuring roles and permissions:', error);
    }
  };

  // Register the bootstrap function to run when Strapi starts
  plugin.bootstrap = bootstrap;
  
  // Extend the registration controller to handle funeral director registration
  plugin.controllers.user.register = async (ctx) => {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });

    if (!settings.allow_register) {
      throw new ApplicationError('Register action is currently disabled');
    }

    const params = {
      ...ctx.request.body,
      provider: 'local',
    };

    // Check if this is a funeral director registration
    const isFuneralDirector = ctx.request.body.isFuneralDirector === true;
    
    // Get the funeral home ID if provided
    const funeralHomeId = ctx.request.body.funeralHomeId;

    // Validate funeral home if provided
    if (funeralHomeId) {
      const funeralHome = await strapi.entityService.findOne('api::funeral-home.funeral-home', funeralHomeId);
      if (!funeralHome) {
        return ctx.badRequest('Invalid funeral home ID');
      }
    }

    // Get default role or funeral director role
    let role;
    if (isFuneralDirector) {
      // Find the funeral director role
      const roles = await strapi.query('plugin::users-permissions.role').findMany({
        where: { type: 'funeral_director' },
      });
      
      if (roles.length === 0) {
        return ctx.badRequest('Funeral director role not found');
      }
      
      role = roles[0];
    } else {
      // Use default role
      role = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: settings.default_role } });
    }

    if (!role) {
      return ctx.badRequest('Impossible to find the default role');
    }

    // Check if the provided email is valid
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest('Please provide a valid email address');
    }

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: params.email },
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest('Email is already taken');
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest('Email is already taken');
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      // Set the role ID
      params.role = role.id;

      // Create the user
      const user = await strapi.query('plugin::users-permissions.user').create({ data: params });

      // If funeral home ID was provided, associate the user with the funeral home
      if (funeralHomeId) {
        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
          data: {
            funeralHome: funeralHomeId
          }
        });
      }

      const sanitizedUser = await sanitizeUser(user, ctx);

      if (settings.email_confirmation) {
        try {
          await strapi
            .plugin('users-permissions')
            .service('user')
            .sendConfirmationEmail(sanitizedUser);
        } catch (err) {
          return ctx.badRequest(null, err);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = strapi.plugin('users-permissions').service('jwt').issue(_.pick(user, ['id']));

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      if (_.includes(err.message, 'username')) {
        return ctx.badRequest('Username already taken');
      } else if (_.includes(err.message, 'email')) {
        return ctx.badRequest('Email already taken');
      } else {
        return ctx.badRequest('An error occurred during registration', { error: err });
      }
    }
  };
  
  return plugin;
};