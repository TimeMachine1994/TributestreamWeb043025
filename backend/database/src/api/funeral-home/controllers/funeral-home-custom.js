/**
 * Custom funeral-home controller
 */

'use strict';

/**
 * A set of functions called "actions" for `funeral-home-custom`
 */

module.exports = {
  /**
   * Search funeral homes by name
   * @param {Object} ctx - The context object
   * @returns {Array} Matching funeral homes
   */
  async search(ctx) {
    try {
      const { query } = ctx.request.query;
      
      if (!query) {
        return ctx.badRequest('Search query is required');
      }

      // Search for funeral homes with names containing the query string
      const funeralHomes = await strapi.entityService.findMany('api::funeral-home.funeral-home', {
        filters: {
          name: {
            $containsi: query
          }
        },
        populate: ['directors']
      });

      return funeralHomes;
    } catch (err) {
      return ctx.badRequest('Error searching funeral homes', { error: err });
    }
  },

  /**
   * List all funeral homes
   * @param {Object} ctx - The context object
   * @returns {Array} All funeral homes
   */
  async listAll(ctx) {
    try {
      const funeralHomes = await strapi.entityService.findMany('api::funeral-home.funeral-home', {
        populate: ['directors']
      });

      return funeralHomes;
    } catch (err) {
      return ctx.badRequest('Error listing funeral homes', { error: err });
    }
  }
};