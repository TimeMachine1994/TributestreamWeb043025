import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/logger';
import { guardFuneralDirectorRoute } from '$lib/routeGuards';

// Create a dedicated logger for the create tribute page
const logger = createLogger('CreateTributeServer');

export const load: PageServerLoad = async ({ cookies, parent, locals }) => {
  logger.info('Loading create tribute page');
  
  // Get authentication status from layout data
  const { authenticated, user } = await parent();
  
  // If not authenticated, redirect to login or home page
  if (!authenticated) {
    logger.warning('User not authenticated, redirecting to home');
    throw redirect(302, '/');
  }
  
  // Only Funeral Directors can create tributes
  guardFuneralDirectorRoute(locals);
  
  logger.info('User is authenticated and has Funeral Director role, loading create tribute page');
  
  // Return any page-specific data here
  return {
    // We don't need to return authenticated again since it's already in the layout data,
    // but we keep it for backward compatibility
    authenticated,
    user
  };
};