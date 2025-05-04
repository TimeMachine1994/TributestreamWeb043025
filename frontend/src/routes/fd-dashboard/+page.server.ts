import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/logger';
import { guardFuneralDirectorRoute } from '$lib/routeGuards';

// Create a dedicated logger for the funeral director dashboard server
const logger = createLogger('FuneralDirectorDashboardServer');

export const load: PageServerLoad = async ({ cookies, fetch, parent, locals }) => {
  logger.info('Loading funeral director dashboard data');
  
  // Get authentication status and user data from layout data
  const { authenticated, user } = await parent();
  
  // If not authenticated, redirect to login or home page
  if (!authenticated) {
    logger.warning('User not authenticated, redirecting to home');
    throw redirect(302, '/');
  }
  
  // Check if user has required role (Funeral Director only)
  guardFuneralDirectorRoute(locals);
  
  // Get the JWT token from cookies
  const token = cookies.get('jwt');
  
  logger.info('User is authenticated as Funeral Director, fetching tributes');
  
  try {
    // Fetch tributes from our API endpoint, passing the JWT token
    logger.debug(`Making API request to /api/tributes with JWT token in Authorization header`);
    
    try {
      const response = await fetch(`/api/tributes`, {
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log detailed response status
      logger.debug(`API response status`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (!response.ok) {
        // Extract detailed error if possible
        try {
          const errorData = await response.json();
          logger.error(`Failed to fetch tributes from API`, {
            status: response.status,
            error: errorData.error || 'Unknown error'
          });
          
          return {
            authenticated: true,
            tributes: [],
            error: errorData.error || `Failed to load tributes (Status: ${response.status})`
          };
        } catch (parseError) {
          logger.error(`Failed to parse error response`, { status: response.status });
          return {
            authenticated: true,
            tributes: [],
            error: `Failed to load tributes (Status: ${response.status})`
          };
        }
      }
      
      const result = await response.json();
      logger.debug('API response:', result);
      
      if (result.error) {
        logger.error(`API returned error response`, { error: result.error });
        return {
          authenticated: true,
          tributes: [],
          error: result.error || 'Failed to load tributes'
        };
      }
      
      logger.success(`Retrieved ${result.data?.length || 0} tributes from API`);
      logger.debug('Tribute data structure', {
        dataCount: result.data?.length || 0,
        metaInfo: result.meta || {}
      });
      
      // Transform data to match the expected structure in the component
      // Define the type for tribute objects
      interface ApiTribute {
        id: number;
        name: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
        [key: string]: any; // For any other properties
      }
      
      const transformedTributes = (result.data || []).map((tribute: ApiTribute) => ({
        id: tribute.id,
        attributes: {
          name: tribute.name,
          slug: tribute.slug,
          // Include other properties that might be needed
          createdAt: tribute.createdAt,
          updatedAt: tribute.updatedAt
        }
      }));
      
      logger.debug('Transformed tributes for component', {
        count: transformedTributes.length,
        sample: transformedTributes.length > 0 ? transformedTributes[0] : null
      });
      
      return {
        authenticated: true,
        tributes: transformedTributes,
        meta: result.meta || {},
        isFuneralDirector: true
      };
    } catch (fetchErr) {
      // Handle fetch errors with proper messaging
      const errorMessage = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      logger.error('Error making API request', {
        error: errorMessage,
        stack: fetchErr instanceof Error ? fetchErr.stack : undefined
      });
      
      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        return {
          authenticated: true,
          tributes: [],
          error: 'Failed to connect to the tribute service. Please check if the Strapi backend is running.'
        };
      }
      
      return {
        authenticated: true,
        tributes: [],
        error: 'An error occurred while retrieving tributes'
      };
    }
  } catch (err) {
    // Handle any other errors
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Unexpected error in load function', { error: errorMessage });
    return {
      authenticated: true,
      tributes: [],
      error: 'An unexpected error occurred while loading tributes'
    };
  }
};