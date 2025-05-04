import type { PageServerLoad } from './$types';
import { createLogger } from '$lib/logger';

const logger = createLogger('AccessDenied');

export const load: PageServerLoad = async ({ locals, url }) => {
  const requiredRoles = url.searchParams.get('required') || '';
  
  logger.info('Access denied page loaded', {
    requiredRoles,
    currentUser: locals.user?.username,
    currentRole: locals.user?.role?.type
  });
  
  return {
    user: locals.user
  };
};