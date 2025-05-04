import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLogger } from '$lib/logger';
import config, { getStrapiUrl } from '$lib/config';

// Create a dedicated logger for the tribute ID API
const logger = createLogger('TributeIdAPI');

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

/**
 * PUT handler for updating a tribute
 * Requires authentication
 */
export const PUT: RequestHandler = async ({ request, cookies, fetch, params }) => {
  logger.info("Processing PUT request to update tribute");
  
  // Extract tribute ID from URL
  const tributeId = params.tributeId;
  logger.info(`Updating tribute`, { id: tributeId });
  
  // Check for authentication
  const jwt = cookies.get('jwt');
  if (!jwt) {
    logger.warning("Authentication required: No JWT cookie found");
    return json({
      success: false,
      error: 'Authentication required'
    }, { status: 401 });
  }
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Log complete request body to debug tribute-user association
    logger.debug("Full request body for update tribute", JSON.stringify(body, null, 2));
    
    const { name, userId } = body;
    
    logger.debug("Received update tribute request", { id: tributeId, name, hasUserId: !!userId });
    
    if (!name) {
      logger.warning("Validation error: Name is required", { id: tributeId });
      return json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }
    
    // Forward the request to Strapi using documentId
    logger.debug("Sending update request to Strapi", {
      url: `${STRAPI_URL}/api/tributes/${tributeId}`,
      name,
      documentId: tributeId
    });
    
    // Prepare the request payload with proper typing
    const requestData: {
      data: {
        name: string;
        owner?: number | string;
      }
    } = {
      data: {
        name
      }
    };

    // If userId is provided, properly format the owner relationship
    // Using the correct format for Strapi relations
    if (userId) {
      logger.debug("Adding user association to tribute", { tributeId, userId });
      // Format the owner relationship correctly for Strapi
      requestData.data.owner = userId;
      
      logger.debug("🔄 Using direct ID format for user association", { userId });
    }

    // Log the final request payload for debugging
    logger.debug("Final request payload to Strapi", {
      url: `${STRAPI_URL}/api/tributes/${tributeId}`,
      payload: JSON.stringify(requestData, null, 2)
    });

    // Use documentId (tributeId) for accessing tributes in Strapi
    const response = await fetch(`${STRAPI_URL}/api/tributes/${tributeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Parse Strapi response
    const result = await response.json();
    
    logger.debug("Strapi response received", {
      status: response.status,
      success: response.ok,
      resultData: result.data,
      resultMeta: result.meta
    });
    
    // If we need to verify user association, we should fetch the tribute with populated owner
    if (userId && response.ok) {
      logger.debug("🔍 Verifying user association by fetching tribute with populated owner");
      try {
        const verifyResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeId}?populate=owner`, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          logger.debug("✅ User association verification data:", {
            ownerData: verifyData.data?.attributes?.owner?.data
          });
          
          // Update result with the populated data
          result.data = verifyData.data;
        }
      } catch (verifyErr) {
        logger.warning("Failed to verify user association", { error: verifyErr });
        // Continue with original response
      }
    }
    
    if (response.ok) {
      // Validate that the update was actually applied
      if (result.data && result.data.attributes && result.data.attributes.name === name) {
        // Check if user association was successful
        // Properly access the owner data from the Strapi response
        const ownerData = result.data.attributes?.owner?.data || null;
        
        logger.success("Tribute updated successfully", {
          id: tributeId,
          name,
          updatedName: result.data.attributes.name,
          userAssociation: userId ? {
            requested: userId,
            applied: ownerData ? ownerData.id : 'Not found in response',
            success: ownerData ? true : false
          } : 'No user association requested'
        });
        
        // Log emoji for better visibility
        if (userId && ownerData) {
          logger.success("🎉 User-tribute association successful!");
        } else if (userId && !ownerData) {
          logger.warning("⚠️ User-tribute association may have failed");
        }
        
        return json({
          success: true,
          message: 'Tribute updated successfully',
          data: result.data
        });
      } else {
        logger.warning("Tribute update response is missing expected data", {
          id: tributeId,
          requestedName: name,
          responseData: result.data
        });
        
        // Still return success if Strapi returned OK but with unexpected data structure
        return json({
          success: true,
          message: 'Tribute may have been updated successfully',
          data: result.data
        });
      }
    } else {
      // Enhanced error logging with specific user association debugging
      logger.error("Failed to update tribute in Strapi", {
        id: tributeId,
        status: response.status,
        statusText: response.statusText,
        error: result.error?.message || "Unknown error",
        errorDetails: result.error || {},
        requestedName: name,
        userAssociation: userId ? {
          attemptedUserId: userId,
          associationField: 'owner'
        } : 'No user association attempted'
      });
      
      // Check specifically for user association errors
      const isUserAssociationError =
        result.error?.message?.toLowerCase().includes('owner') ||
        result.error?.message?.toLowerCase().includes('user') ||
        (result.error?.details?.errors &&
         JSON.stringify(result.error.details.errors).toLowerCase().includes('owner'));
      
      // Check for specific error types
      const isValidationError = result.error?.name === 'ValidationError' ||
                               (result.error?.details && result.error?.details.errors);
      
      return json({
        success: false,
        error: result.error?.message || 'Failed to update tribute',
        details: isValidationError ? result.error?.details : undefined,
        userAssociationError: isUserAssociationError ? {
          message: "There was an issue associating this tribute with the specified user",
          help: "Ensure the user ID is valid and the user has permission to be associated with tributes"
        } : undefined
      }, { status: response.status || 400 });
    }
  } catch (err) {
    logger.error("Error updating tribute", { id: tributeId, error: err });
    
    // Check if it's a connection error
    const isConnectionError = err instanceof TypeError &&
      (err.message.includes('fetch failed') ||
       err.message.includes('Failed to fetch') ||
       err.message.includes('ECONNREFUSED'));
    
    if (isConnectionError) {
      logger.error("Connection error to Strapi", { error: err.message });
    }
    
    return json({
      success: false,
      error: isConnectionError
        ? 'Cannot connect to tribute service. Please try again later.'
        : 'Internal server error'
    }, { status: 500 });
  }
};

/**
 * DELETE handler for removing a tribute
 * Requires authentication
 */
export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
  logger.info("Processing DELETE request to remove tribute");
  
  // Extract tribute ID from URL
  const tributeId = params.tributeId;
  logger.info(`Deleting tribute`, { id: tributeId });
  
  // Check for authentication
  const jwt = cookies.get('jwt');
  if (!jwt) {
    logger.warning("Authentication required: No JWT cookie found");
    return json({
      success: false,
      error: 'Authentication required'
    }, { status: 401 });
  }
  
  try {
    // Forward the request to Strapi using documentId
    logger.debug("Sending delete request to Strapi", {
      url: `${STRAPI_URL}/api/tributes/${tributeId}`,
      documentId: tributeId
    });
    
    // Use documentId (tributeId) for accessing tributes in Strapi
    const response = await fetch(`${STRAPI_URL}/api/tributes/${tributeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    // Parse Strapi response if available
    let result;
    try {
      result = await response.json();
      logger.debug("Parsed JSON response from Strapi");
    } catch (e) {
      // Some APIs return empty body for DELETE
      logger.debug("Empty response body from Strapi DELETE request");
      result = {};
    }
    
    logger.debug("Strapi response received", {
      status: response.status,
      success: response.ok
    });
    
    if (response.ok) {
      logger.success("Tribute deleted successfully", { id: tributeId });
      return json({
        success: true,
        message: 'Tribute deleted successfully'
      });
    } else {
      logger.error("Failed to delete tribute in Strapi", {
        id: tributeId,
        status: response.status,
        error: result?.error?.message || "Unknown error"
      });
      
      return json({
        success: false,
        error: result?.error?.message || 'Failed to delete tribute'
      }, { status: response.status || 400 });
    }
  } catch (err) {
    logger.error("Error deleting tribute", { id: tributeId, error: err });
    
    // Check if it's a connection error
    const isConnectionError = err instanceof TypeError &&
      (err.message.includes('fetch failed') ||
       err.message.includes('Failed to fetch') ||
       err.message.includes('ECONNREFUSED'));
    
    if (isConnectionError) {
      logger.error("Connection error to Strapi", { error: err.message });
    }
    
    return json({
      success: false,
      error: isConnectionError
        ? 'Cannot connect to tribute service. Please try again later.'
        : 'Internal server error'
    }, { status: 500 });
  }
};