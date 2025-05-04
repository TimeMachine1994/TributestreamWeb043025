import { redirect } from '@sveltejs/kit';

/**
 * Role types in the TributeStream application
 */
export type UserRole = 'funeral_director' | 'family_contact' | 'authenticated';

/**
 * Check if a user has a specific role
 * @param user The user object from locals
 * @param requiredRole The role to check for
 * @returns boolean indicating if the user has the required role
 */
export function hasRole(
  user: App.Locals['user'] | null | undefined,
  requiredRole: UserRole | UserRole[]
): boolean {
  // If no user, they don't have any role
  if (!user) return false;

  // If checking for multiple roles, check if user has any of them
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => user.role.type === role);
  }

  // Check for specific role
  return user.role.type === requiredRole;
}

/**
 * Check if a user has permission to access a route
 * @param user The user object from locals
 * @param requiredRole The role required to access the route
 * @param redirectTo Where to redirect if user doesn't have permission
 * @throws Redirect to the specified path if user doesn't have permission
 */
export function requireRole(
  user: App.Locals['user'] | null | undefined,
  requiredRole: UserRole | UserRole[],
  redirectTo: string = '/login'
): void {
  // If user doesn't have the required role, redirect
  if (!hasRole(user, requiredRole)) {
    console.log('🚫 Access denied: User does not have required role', {
      userRole: user?.role?.type || 'none',
      requiredRole
    });
    throw redirect(302, redirectTo);
  }

  console.log('✅ Access granted: User has required role', {
    userRole: user?.role?.type,
    requiredRole
  });
}

/**
 * Get a display-friendly name for a role
 * @param roleType The role type string
 * @returns A formatted display name for the role
 */
export function getRoleDisplayName(roleType: string | undefined): string {
  if (!roleType) return 'Guest';
  
  switch (roleType) {
    case 'funeral_director':
      return 'Funeral Director';
    case 'family_contact':
      return 'Family Contact';
    case 'authenticated':
      return 'Authenticated User';
    default:
      return roleType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}