import { redirect } from '@sveltejs/kit';
import type { UserRole } from '$lib/roleAuth';
import { createLogger } from '$lib/logger';

const logger = createLogger('RouteGuards');

/**
 * Route guard to check if a user has the required role
 * @param locals The locals object from the request
 * @param requiredRole The role or roles required to access the route
 * @param redirectTo Where to redirect if the user doesn't have the required role
 * @throws Redirect to the specified path if the user doesn't have the required role
 */
export function guardRoute(
  locals: App.Locals,
  requiredRole: UserRole | UserRole[],
  redirectTo: string = '/login'
): void {
  // Format the required role for URL parameters
  const requiredRoleStr = Array.isArray(requiredRole)
    ? requiredRole.join(',')
    : requiredRole;
  
  // If no user, redirect to login with required role parameter
  if (!locals.user) {
    const loginUrl = redirectTo === '/login'
      ? `/login?required_role=${encodeURIComponent(requiredRoleStr)}`
      : redirectTo;
    
    logger.warning('Access denied: No user found', { redirectTo: loginUrl });
    throw redirect(302, loginUrl);
  }

  // Get the user's role
  const userRole = locals.user.role.type;
  
  // Check if the user has the required role
  const hasRequiredRole = Array.isArray(requiredRole)
    ? requiredRole.includes(userRole as UserRole)
    : userRole === requiredRole;
  
  if (!hasRequiredRole) {
    logger.warning('Access denied: User does not have required role', {
      userRole,
      requiredRole,
      redirectTo
    });
    
    // If user is authenticated but lacks the required role, redirect to access-denied page
    // instead of login page to prevent redirect loops
    if (userRole === 'authenticated') {
      logger.info('Redirecting to access-denied page', { requiredRole: requiredRoleStr });
      throw redirect(302, `/access-denied?required=${encodeURIComponent(requiredRoleStr)}`);
    }
    
    // Otherwise redirect to the specified path (usually login)
    // Add required_role parameter if redirecting to login
    const loginUrl = redirectTo === '/login'
      ? `/login?required_role=${encodeURIComponent(requiredRoleStr)}`
      : redirectTo;
      
    throw redirect(302, loginUrl);
  }
  
  logger.info('Access granted: User has required role', {
    userRole,
    requiredRole
  });
}

/**
 * Route guard for Funeral Director only routes
 * @param locals The locals object from the request
 * @param redirectTo Where to redirect if the user doesn't have the required role
 */
export function guardFuneralDirectorRoute(
  locals: App.Locals,
  redirectTo: string = '/family-dashboard'
): void {
  guardRoute(locals, 'funeral_director', redirectTo);
}

/**
 * Route guard for Family Contact or Funeral Director routes
 * @param locals The locals object from the request
 * @param redirectTo Where to redirect if the user doesn't have the required role
 */
export function guardFamilyRoute(
  locals: App.Locals,
  redirectTo: string = '/login'
): void {
  guardRoute(locals, ['family_contact', 'funeral_director'], redirectTo);
}