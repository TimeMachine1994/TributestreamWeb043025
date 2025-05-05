import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger for the contribution requests API
const logger = createLogger('ContributionRequestsAPI');

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

/**
 * GET handler for retrieving contribution requests
 * Requires authentication via JWT token
 */
export const GET: RequestHandler = async ({ request, fetch }) => {
  logger.info("Processing GET request for contribution requests");
  
  try {
    // Get JWT token from Authorization header or cookies
    let jwt = '';
    
    // Try to get token from header first (preferred method)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      jwt = authHeader.substring(7); // Remove "Bearer " prefix
      logger.debug("Found JWT in Authorization header");
    } else {
      // Try to get from cookies as last resort
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const cookieMap = Object.fromEntries(
          cookies.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return [name, value];
          })
        );
        
        if (cookieMap.jwt) {
          jwt = cookieMap.jwt;
          logger.debug("Found JWT in cookies");
        } else {
          logger.warning("No JWT token provided in request");
        }
      } else {
        logger.warning("No JWT token provided in request");
      }
    }
    
    if (!jwt) {
      logger.error("Authentication required: No JWT token found");
      return json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Fetch contribution requests from Strapi
    // We want to get requests where the tribute is owned by the current user
    const response = await fetch(`${STRAPI_URL}/api/contribution-requests?populate=*`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    if (!response.ok) {
      logger.error("Failed to fetch contribution requests", {
        status: response.status,
        statusText: response.statusText
      });
      
      return json({
        success: false,
        error: `Failed to fetch contribution requests: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    const result = await response.json();
    logger.success("Successfully fetched contribution requests", {
      count: result.data?.length || 0
    });
    
    return json({
      success: true,
      data: result.data || [],
      meta: result.meta
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error fetching contribution requests", { error: errorMessage });
    
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};