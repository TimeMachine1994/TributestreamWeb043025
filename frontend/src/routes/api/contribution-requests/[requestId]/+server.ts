import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger for the contribution requests API
const logger = createLogger('ContributionRequestsAPI');

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

/**
 * PUT handler for updating a contribution request
 * Requires authentication via JWT token
 */
export const PUT: RequestHandler = async ({ params, request, fetch }) => {
  const { requestId } = params;
  logger.info("Processing PUT request for contribution request", { requestId });
  
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
    
    // Parse request body
    const body = await request.json();
    
    // Update the contribution request in Strapi
    const response = await fetch(`${STRAPI_URL}/api/contribution-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        data: {
          status: body.status,
          responseDate: body.responseDate || new Date().toISOString()
        }
      })
    });
    
    if (!response.ok) {
      logger.error("Failed to update contribution request", {
        status: response.status,
        statusText: response.statusText
      });
      
      return json({
        success: false,
        error: `Failed to update contribution request: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    const result = await response.json();
    logger.success("Successfully updated contribution request", {
      requestId,
      status: body.status
    });
    
    return json({
      success: true,
      data: result.data
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error updating contribution request", { requestId, error: errorMessage });
    
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};