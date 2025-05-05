/**
 * funeral-home router
 */

'use strict';

/**
 * funeral-home router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the core router
const defaultRouter = createCoreRouter('api::funeral-home.funeral-home');

// Define custom routes
const customRoutes = [
  {
    method: 'GET',
    path: '/funeral-homes/search',
    handler: 'funeral-home-custom.search',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/funeral-homes/list',
    handler: 'funeral-home-custom.listAll',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

// Export the router configuration
module.exports = {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes,
  ],
};