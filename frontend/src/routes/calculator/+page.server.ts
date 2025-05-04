import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createLogger } from '$lib/logger';
import { guardFamilyRoute } from '$lib/routeGuards';

// Create a dedicated logger for the calculator page
const logger = createLogger('CalculatorPageServer');

export const load: PageServerLoad = async ({ cookies, fetch, parent, locals }) => {
  logger.info('Loading calculator page data');
  
  // Get authentication status and user data from layout data
  const { authenticated, user } = await parent();
  
  // If not authenticated, redirect to login
  if (!authenticated) {
    logger.warning('User not authenticated, redirecting to login');
    throw redirect(302, '/login?required_role=family_contact,funeral_director');
  }
  
  // Check if user has required role (Family Contact or Funeral Director)
  guardFamilyRoute(locals);
  
  // Get the JWT token from cookies
  const token = cookies.get('jwt');
  
  logger.info('User is authenticated, preparing calculator data');
  
  try {
    // Fetch tribute data if available (for pre-filling form)
    // We'll fetch the tribute associated with the user from the API
    const userId = locals.user?.id;
    
    if (userId) {
      logger.debug('Fetching tribute data for pre-filling calculator form', { userId });
      
      try {
        const response = await fetch(`/api/tributes/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const tributeData = await response.json();
          logger.debug('Successfully fetched tribute data', { userId });
          
          return {
            authenticated: true,
            tributeData: tributeData.data || {},
            error: null
          };
        } else {
          logger.warning('Failed to fetch tribute data', {
            status: response.status,
            userId
          });
        }
      } catch (error) {
        logger.error('Error fetching tribute data', {
          error: error instanceof Error ? error.message : String(error),
          userId
        });
      }
    }
    
    // Return default data if no tribute data available
    return {
      authenticated: true,
      tributeData: {},
      error: null
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Unexpected error in load function', { error: errorMessage });
    
    return {
      authenticated: true,
      tributeData: {},
      error: 'An unexpected error occurred while loading calculator data'
    };
  }
};

export const actions: Actions = {
  saveCalculator: async ({ request, cookies, locals, fetch }) => {
    logger.info('Processing calculator form submission');
    
    try {
      const formData = await request.formData();
      
      // Extract form data
      const packageId = formData.get('packageId')?.toString() || '';
      const liveStreamDuration = Number(formData.get('liveStreamDuration')) || 1;
      const liveStreamDate = formData.get('liveStreamDate')?.toString() || '';
      const liveStreamStartTime = formData.get('liveStreamStartTime')?.toString() || '';
      const funeralHomeName = formData.get('funeralHomeName')?.toString() || '';
      const funeralDirectorName = formData.get('funeralDirectorName')?.toString() || '';
      const locationCount = Number(formData.get('locationCount')) || 1;
      
      // Extract location data
      const locations = [];
      for (let i = 0; i < locationCount; i++) {
        locations.push({
          name: formData.get(`memorialLocationName${i}`)?.toString() || '',
          address: formData.get(`memorialLocationAddress${i}`)?.toString() || '',
          startTime: formData.get(`startTime${i}`)?.toString() || '',
          duration: Number(formData.get(`duration${i}`)) || 1
        });
      }
      
      const priceTotal = Number(formData.get('priceTotal')) || 0;
      
      // Validate required fields
      if (!packageId) {
        return {
          success: false,
          error: 'Please select a package'
        };
      }
      
      if (!liveStreamDate) {
        return {
          success: false,
          error: 'Please provide a livestream date'
        };
      }
      
      if (!liveStreamStartTime) {
        return {
          success: false,
          error: 'Please provide a livestream start time'
        };
      }
      
      // Save calculator data to user's session or database
      // This would typically involve an API call to save the data
      const token = cookies.get('jwt');
      
      const calculatorData = {
        packageId,
        liveStreamDuration,
        liveStreamDate,
        liveStreamStartTime,
        funeralHomeName,
        funeralDirectorName,
        locations,
        priceTotal
      };
      
      // Store the calculator data in a cookie for now
      // In a real implementation, you would save this to the database
      cookies.set('calculatorData', JSON.stringify(calculatorData), {
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      });
      
      logger.success('Successfully saved calculator data');
      
      // Redirect to checkout page
      return {
        success: true,
        calculatorData,
        redirect: '/checkout'
      };
      
    } catch (error) {
      logger.error('Error processing calculator form', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        error: 'An error occurred while processing your request'
      };
    }
  }
};