import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { createLogger } from '$lib/logger';
import config, { getStrapiUrl } from '$lib/config';
import { assignFamilyContactRole } from '$lib/userRoles';

// Create a dedicated logger for the tributes API
const logger = createLogger('TributesAPI');

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

/**
 * Checks if a slug already exists in the database
 * @param slug The slug to check
 * @param fetch The fetch function to use
 * @param jwt Authentication token
 * @returns true if the slug exists, false otherwise
 */
async function checkSlugExists(slug: string, fetch: Function, jwt: string): Promise<boolean> {
  console.log(`🔍 Checking if slug exists: "${slug}"`);
  
  try {
    // Query Strapi for tributes with this slug
    const queryParams = new URLSearchParams({
      'filters[slug][$eq]': slug,
    });
    
    const response = await fetch(`${STRAPI_URL}/api/tributes?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Error checking slug existence: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    const exists = result.data && result.data.length > 0;
    
    console.log(`🔍 Slug "${slug}" exists: ${exists}`);
    return exists;
  } catch (err) {
    console.error(`💥 Error checking if slug exists:`, err);
    return false; // Assume it doesn't exist in case of error
  }
}

/**
 * Generates a unique slug by appending incremental numbers if needed
 * @param baseSlug The initial slug to start with
 * @param fetch The fetch function to use
 * @param jwt Authentication token
 * @returns A unique slug that doesn't exist in the database
 */
async function generateUniqueSlug(baseSlug: string, fetch: Function, jwt: string): Promise<string> {
  logger.info(`Generating unique slug`, { baseSlug });
  
  // First check if the base slug is available
  if (!await checkSlugExists(baseSlug, fetch, jwt)) {
    logger.success(`Base slug is available, using it`, { slug: baseSlug });
    return baseSlug;
  }
  
  // Try with incrementing numbers until we find an available slug
  let counter = 1;
  let uniqueSlug;
  
  while (true) {
    uniqueSlug = `${baseSlug}_${counter}`;
    logger.debug(`Trying slug variation`, { attempt: counter, slug: uniqueSlug });
    
    if (!await checkSlugExists(uniqueSlug, fetch, jwt)) {
      logger.success(`Found available slug`, { slug: uniqueSlug, attempts: counter });
      return uniqueSlug;
    }
    
    counter++;
    
    // Safety check to prevent infinite loops
    if (counter > 100) {
      logger.warning(`Reached maximum number of slug attempts`, { baseSlug, attempts: counter });
      const fallbackSlug = `${baseSlug}_${Date.now()}`;
      logger.info(`Using timestamp fallback slug`, { slug: fallbackSlug });
      return fallbackSlug; // Use timestamp as fallback
    }
  }
}

/**
 * GET handler for retrieving tributes
 * Requires authentication via JWT token
 */
export const GET: RequestHandler = async ({ url, fetch, request }) => {
  logger.info("Processing GET request for tributes");
  
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Handle pagination if provided
    const page = url.searchParams.get('page');
    const pageSize = url.searchParams.get('pageSize');
    if (page) queryParams.set('pagination[page]', page);
    if (pageSize) queryParams.set('pagination[pageSize]', pageSize);
    
    // Get JWT token from Authorization header, query param, or cookies (for backward compatibility)
    let jwt = '';
    
    // Try to get token from header first (preferred method)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      jwt = authHeader.substring(7); // Remove "Bearer " prefix
      logger.debug("Found JWT in Authorization header");
    } else {
      // Fallback to query parameter
      jwt = url.searchParams.get('jwt') || '';
      if (jwt) {
        logger.debug("Found JWT in query parameter (legacy method)");
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
    }
    
    // Build the full URL with query parameters
    const apiUrl = `${STRAPI_URL}/api/tributes?${queryParams.toString()}`;
    logger.info(`Fetching tributes from Strapi`, {
      url: apiUrl,
      hasJwt: !!jwt,
      jwtLength: jwt ? jwt.length : 0
    });
    
    // Test if Strapi is accessible before making the full request
    try {
      logger.debug("Testing Strapi connection");
      const pingResponse = await fetch(`${STRAPI_URL}/api/tributes`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
        headers: jwt ? {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      });
      
      // Any response (even 403 Forbidden) means the server is running
      // We just need to know if Strapi is responding, not if we have access
      if (pingResponse.status === 404) {
        logger.error("Strapi server is not responding correctly", { status: pingResponse.status });
        throw new Error("Strapi server is not responding correctly");
      }
      
      logger.success("Strapi connection test successful");
    } catch (pingError) {
      // Handle the error with proper type checking
      const errorMessage = pingError instanceof Error ? pingError.message : String(pingError);
      logger.error("Failed to connect to Strapi backend", { error: errorMessage });
      throw new Error("Cannot connect to Strapi backend. Is the server running?");
    }
    
    // Fetch tributes from Strapi
    logger.debug("Sending request to Strapi API");
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });
    
    logger.debug("Received response from Strapi", {
      status: response.status,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      let errorData = null;
      
      try {
        // Try to parse error response as JSON
        errorData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON, use as-is
      }
      
      logger.error("Strapi API returned an error", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        responseText: responseText.substring(0, 200) // Limit text length
      });
      
      // Specific handling for auth errors
      if (response.status === 401 || response.status === 403) {
        logger.error("Authentication error accessing tributes API", {
          status: response.status,
          errorData,
          jwt: jwt ? `${jwt.substring(0, 10)}...` : 'none'
        });
        
        return json({
          success: false,
          error: 'Authentication failed: Invalid or expired token. Please log in again.',
          details: errorData?.error?.message || 'Permission denied'
        }, { status: response.status });
      }
      
      throw new Error(`Strapi API error: ${response.status}`);
    }
    
    const result = await response.json();
    logger.success(`Retrieved tributes from API`, { count: result.data?.length || 0 });
    
    if (response.ok) {
      return json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } else {
      console.log("❌ Failed to retrieve tributes:", result.error?.message || "Unknown error");
      return json({
        success: false,
        error: result.error?.message || 'Failed to retrieve tributes'
      }, { status: response.status || 500 });
    }
  } catch (err) {
    logger.error("Error retrieving tributes:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
    
    // Check if it's a connection error
    const isConnectionError = err instanceof TypeError &&
      (err.message.includes('fetch failed') ||
       err.message.includes('Failed to fetch') ||
       err.message.includes('ECONNREFUSED'));
       
    // Check if it's an auth error
    const isAuthError = err instanceof Error &&
      (err.message.includes('Authentication') ||
       err.message.includes('Unauthorized') ||
       err.message.includes('403') ||
       err.message.includes('401'));
    
    return json({
      success: false,
      error: isConnectionError
        ? 'Cannot connect to tribute service. Please try again later.'
        : isAuthError
          ? 'Authentication failed: Invalid or expired token'
          : 'Internal server error'
    }, { status: isAuthError ? 401 : 500 });
  }
};

/**
 * POST handler for creating a new tribute
 * Requires authentication
 * Handles duplicate slugs by appending incremental numbers
 */
export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  logger.info("Processing POST request to create tribute");
  
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
    const { name } = body;
    
    logger.debug("Received create tribute request", { name });
    
    if (!name) {
      logger.warning("Validation error: Name is required");
      return json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }
    
    // Generate kebab-case slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
      .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')             // Trim hyphens from start
      .replace(/-+$/, '');            // Trim hyphens from end
    
    logger.debug(`Generated base slug from name`, { baseSlug, name });
    
    // Generate a unique slug, checking for duplicates
    const uniqueSlug = await generateUniqueSlug(baseSlug, fetch, jwt);
    logger.info(`Using unique slug for new tribute`, { slug: uniqueSlug });
    
    // Forward the request to Strapi
    logger.debug("Sending create request to Strapi", {
      url: `${STRAPI_URL}/api/tributes`,
      name,
      slug: uniqueSlug
    });
    
    const response = await fetch(`${STRAPI_URL}/api/tributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        data: {
          name,
          slug: uniqueSlug,
          // Include additional required fields with default values
          description: body.description || `Tribute page for ${name}`,
          status: body.status || 'draft'
        }
      })
    });
    
    // Parse Strapi response
    const result = await response.json();
    
    logger.debug("Strapi response received", {
      status: response.status,
      success: response.ok
    });
    
    if (response.ok) {
      logger.success("Tribute created successfully", {
        id: result.data?.id,
        name,
        slug: uniqueSlug
      });
      
      // Get the current user's information
      try {
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          logger.info("Retrieved user data for role check", {
            userId: userData.id,
            username: userData.username,
            currentRole: userData.role?.type || 'unknown'
          });
          
          // Check if the user already has the Family Contact role
          if (userData.role?.type !== 'family_contact' && userData.role?.type !== 'funeral_director') {
            logger.info("Assigning Family Contact role to user", {
              userId: userData.id,
              currentRole: userData.role?.type || 'unknown'
            });
            
            // Assign the Family Contact role to the user
            const roleAssigned = await assignFamilyContactRole(userData.id, jwt, fetch);
            
            if (roleAssigned) {
              logger.success("Successfully assigned Family Contact role to user", { userId: userData.id });
              
              // Update the role cookie to reflect the new role
              cookies.set('user_role', 'family_contact', {
                path: '/',
                httpOnly: false,
                sameSite: 'strict',
                secure: import.meta.env.PROD,
                maxAge: 60 * 60 * 24 * 7 // 1 week
              });
            } else {
              logger.warning("Failed to assign Family Contact role to user", { userId: userData.id });
            }
          } else {
            logger.info("User already has appropriate role, no need to update", {
              role: userData.role?.type
            });
          }
          
          // Associate the tribute with the user
          try {
            logger.info("Associating tribute with user", {
              tributeId: result.data?.id,
              userId: userData.id
            });
            
            // Update the tribute to associate it with the user
            const updateResponse = await fetch(`${STRAPI_URL}/api/tributes/${result.data?.documentId || result.data?.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
              },
              body: JSON.stringify({
                data: {
                  owner: userData.id
                }
              })
            });
            
            if (updateResponse.ok) {
              logger.success("Successfully associated tribute with user");
            } else {
              logger.warning("Failed to associate tribute with user", {
                status: updateResponse.status
              });
            }
          } catch (associationError) {
            logger.error("Error associating tribute with user", {
              error: associationError instanceof Error ? associationError.message : String(associationError)
            });
          }
        } else {
          logger.warning("Failed to fetch user data for role assignment", {
            status: userResponse.status,
            statusText: userResponse.statusText
          });
        }
      } catch (roleError) {
        logger.error("Error during role assignment", {
          error: roleError instanceof Error ? roleError.message : String(roleError),
          stack: roleError instanceof Error ? roleError.stack : undefined
        });
        // Continue with the response even if role assignment fails
      }
      
      return json({
        success: true,
        message: 'Tribute created successfully',
        data: result.data
      });
    } else {
      logger.error("Failed to create tribute in Strapi", {
        status: response.status,
        error: result.error?.message || "Unknown error",
        details: result.error?.details || {},
        name,
        slug: uniqueSlug
      });
      
      // Check for duplicate slug error
      const isDuplicateError = result.error?.message?.includes('already taken') ||
                              result.error?.name === 'ValidationError';
      
      if (isDuplicateError) {
        logger.warning("Duplicate tribute detected", { name });
      }
      
      return json({
        success: false,
        error: isDuplicateError
          ? 'A tribute with this name already exists'
          : result.error?.message || 'Failed to create tribute',
        details: result.error?.details || {},
        validationErrors: result.error?.details?.errors || []
      }, { status: response.status || 400 });
    }
  } catch (err) {
    logger.error("Error creating tribute", { error: err });
    
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