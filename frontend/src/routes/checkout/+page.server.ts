import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createLogger } from '$lib/logger';
import { guardFamilyRoute } from '$lib/routeGuards';
import { packages } from '$lib/packages';

// Create a dedicated logger for the checkout page
const logger = createLogger('CheckoutPageServer');

export const load: PageServerLoad = async ({ cookies, fetch, parent, locals }) => {
  logger.info('🔍 Loading checkout page data');
  
  // Get authentication status and user data from layout data
  const { authenticated, user } = await parent();
  
  // If not authenticated, redirect to login
  if (!authenticated) {
    logger.warning('⚠️ User not authenticated, redirecting to login');
    throw redirect(302, '/login?required_role=family_contact,funeral_director');
  }
  
  // Check if user has required role (Family Contact or Funeral Director)
  guardFamilyRoute(locals);
  
  // Get the JWT token from cookies
  const token = cookies.get('jwt');
  
  // Get calculator data from cookie
  const calculatorDataCookie = cookies.get('calculatorData');
  if (!calculatorDataCookie) {
    logger.warning('⚠️ No calculator data found, redirecting to calculator page');
    throw redirect(302, '/calculator');
  }
  
  try {
    // Parse calculator data
    const calculatorData = JSON.parse(calculatorDataCookie);
    logger.info('✅ Successfully loaded calculator data', { calculatorData });
    
    // Find the selected package
    const selectedPackage = packages.find(pkg => pkg.id === calculatorData.packageId);
    if (!selectedPackage) {
      logger.warning('⚠️ Selected package not found', { packageId: calculatorData.packageId });
      throw redirect(302, '/calculator');
    }
    
    // Fetch tribute data if available
    const userId = locals.user?.id;
    let tributeData = {};
    
    if (userId) {
      logger.debug('🔍 Fetching tribute data', { userId });
      
      try {
        const response = await fetch(`/api/tributes/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          tributeData = data.data || {};
          logger.debug('✅ Successfully fetched tribute data', { userId });
        } else {
          logger.warning('⚠️ Failed to fetch tribute data', {
            status: response.status,
            userId
          });
        }
      } catch (error) {
        logger.error('❌ Error fetching tribute data', {
          error: error instanceof Error ? error.message : String(error),
          userId
        });
      }
    }
    
    return {
      authenticated: true,
      calculatorData,
      selectedPackage,
      tributeData,
      error: null
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('❌ Unexpected error in load function', { error: errorMessage });
    
    return {
      authenticated: true,
      calculatorData: {},
      selectedPackage: null,
      tributeData: {},
      error: 'An unexpected error occurred while loading checkout data'
    };
  }
};

export const actions: Actions = {
  processPayment: async ({ request, cookies, locals, fetch }) => {
    logger.info('💳 Processing payment submission');
    
    try {
      const formData = await request.formData();
      
      // Extract form data
      const billingFirstName = formData.get('billingFirstName')?.toString() || '';
      const billingLastName = formData.get('billingLastName')?.toString() || '';
      const billingAddress = formData.get('billingAddress')?.toString() || '';
      const cardNumber = formData.get('cardNumber')?.toString() || '';
      const cardExpiry = formData.get('cardExpiry')?.toString() || '';
      const cardCvv = formData.get('cardCvv')?.toString() || '';
      const tributeId = formData.get('tributeId')?.toString() || '';
      
      // Validate required fields
      if (!billingFirstName) {
        return {
          success: false,
          error: 'Billing first name is required'
        };
      }
      
      if (!billingLastName) {
        return {
          success: false,
          error: 'Billing last name is required'
        };
      }
      
      if (!billingAddress) {
        return {
          success: false,
          error: 'Billing address is required'
        };
      }
      
      if (!cardNumber) {
        return {
          success: false,
          error: 'Card number is required'
        };
      }
      
      if (!cardExpiry) {
        return {
          success: false,
          error: 'Card expiry date is required'
        };
      }
      
      if (!cardCvv) {
        return {
          success: false,
          error: 'Card CVV is required'
        };
      }
      
      // Get calculator data from cookie
      const calculatorDataCookie = cookies.get('calculatorData');
      if (!calculatorDataCookie) {
        logger.warning('⚠️ No calculator data found');
        return {
          success: false,
          error: 'No calculator data found'
        };
      }
      
      const calculatorData = JSON.parse(calculatorDataCookie);
      
      // Get JWT token
      const token = cookies.get('jwt');
      if (!token) {
        logger.warning('⚠️ No JWT token found');
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Update tribute record with payment information
      const paymentData = {
        billingFirstName,
        billingLastName,
        billingAddress,
        // Don't store full card details for security reasons
        cardLast4: cardNumber.slice(-4),
        isPaymentComplete: true,
        // Include calculator data
        packageId: calculatorData.packageId,
        liveStreamDuration: calculatorData.liveStreamDuration,
        liveStreamDate: calculatorData.liveStreamDate,
        liveStreamStartTime: calculatorData.liveStreamStartTime,
        funeralHomeName: calculatorData.funeralHomeName,
        funeralDirectorName: calculatorData.funeralDirectorName,
        locations: calculatorData.locations,
        priceTotal: calculatorData.priceTotal
      };
      
      logger.debug('🔄 Updating tribute with payment information', { tributeId });
      
      const response = await fetch(`/api/tributes/${tributeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...paymentData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        logger.success('✅ Payment processed successfully', { tributeId });
        
        // Clear calculator data cookie
        cookies.delete('calculatorData', { path: '/' });
        
        return {
          success: true,
          message: 'Payment processed successfully',
          redirect: '/family-dashboard'
        };
      } else {
        const errorData = await response.json();
        logger.error('❌ Failed to update tribute with payment information', {
          status: response.status,
          error: errorData.error
        });
        
        return {
          success: false,
          error: errorData.error || 'Failed to process payment'
        };
      }
      
    } catch (error) {
      logger.error('❌ Error processing payment', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        error: 'An error occurred while processing your payment'
      };
    }
  }
};