import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

const logger = createLogger('UserRoles');

/**
 * Updates a user's role to Family Contact
 * @param userId The ID of the user to update
 * @param jwt The JWT token for authentication
 * @param fetch The fetch function to use
 * @returns A promise that resolves to true if successful, false otherwise
 */
export async function assignFamilyContactRole(userId: number, jwt: string, fetch: Function): Promise<boolean> {
  try {
    logger.info('Attempting to assign Family Contact role to user', { userId });
    
    // First, get the role ID for Family Contact
    const strapiUrl = getStrapiUrl();
    const rolesResponse = await fetch(`${strapiUrl}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    if (!rolesResponse.ok) {
      logger.error('Failed to fetch roles', { status: rolesResponse.status });
      return false;
    }
    
    const rolesData = await rolesResponse.json();
    const familyContactRole = rolesData.roles.find((role: any) => role.type === 'family_contact');
    
    if (!familyContactRole) {
      logger.error('Family Contact role not found');
      return false;
    }
    
    logger.debug('Found Family Contact role', { roleId: familyContactRole.id });
    
    // Update the user's role
    const updateResponse = await fetch(`${strapiUrl}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        role: familyContactRole.id
      })
    });
    
    if (!updateResponse.ok) {
      logger.error('Failed to update user role', { status: updateResponse.status });
      return false;
    }
    
    logger.success('Successfully assigned Family Contact role to user', { userId });
    return true;
  } catch (error) {
    logger.error('Error assigning Family Contact role', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Updates a user's role to Funeral Director
 * @param userId The ID of the user to update
 * @param jwt The JWT token for authentication
 * @param fetch The fetch function to use
 * @returns A promise that resolves to true if successful, false otherwise
 */
export async function assignFuneralDirectorRole(userId: number, jwt: string, fetch: Function): Promise<boolean> {
  try {
    logger.info('Attempting to assign Funeral Director role to user', { userId });
    
    // First, get the role ID for Funeral Director
    const strapiUrl = getStrapiUrl();
    const rolesResponse = await fetch(`${strapiUrl}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    if (!rolesResponse.ok) {
      logger.error('Failed to fetch roles', { status: rolesResponse.status });
      return false;
    }
    
    const rolesData = await rolesResponse.json();
    const funeralDirectorRole = rolesData.roles.find((role: any) => role.type === 'funeral_director');
    
    if (!funeralDirectorRole) {
      logger.error('Funeral Director role not found');
      return false;
    }
    
    logger.debug('Found Funeral Director role', { roleId: funeralDirectorRole.id });
    
    // Update the user's role
    const updateResponse = await fetch(`${strapiUrl}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        role: funeralDirectorRole.id
      })
    });
    
    if (!updateResponse.ok) {
      logger.error('Failed to update user role', { status: updateResponse.status });
      return false;
    }
    
    logger.success('Successfully assigned Funeral Director role to user', { userId });
    return true;
  } catch (error) {
    logger.error('Error assigning Funeral Director role', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}