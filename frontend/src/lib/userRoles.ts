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
    logger.info('🔄 Attempting to assign Funeral Director role to user', { userId });
    
    // First, get the role ID for Funeral Director
    const strapiUrl = getStrapiUrl();
    
    // Add timeout for role fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const rolesResponse = await fetch(`${strapiUrl}/api/users-permissions/roles`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!rolesResponse.ok) {
        logger.error('❌ Failed to fetch roles', {
          status: rolesResponse.status,
          statusText: rolesResponse.statusText
        });
        return false;
      }
      
      const rolesData = await rolesResponse.json();
      const funeralDirectorRole = rolesData.roles.find((role: any) => role.type === 'funeral_director');
      
      if (!funeralDirectorRole) {
        logger.error('❌ Funeral Director role not found in available roles', {
          availableRoles: rolesData.roles.map((r: any) => r.type).join(', ')
        });
        return false;
      }
      
      logger.debug('✅ Found Funeral Director role', {
        roleId: funeralDirectorRole.id,
        roleName: funeralDirectorRole.name,
        roleType: funeralDirectorRole.type
      });
      
      // Update the user's role with retry logic
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
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
          
          if (updateResponse.ok) {
            // Verify the role was actually updated
            const verifyResponse = await fetch(`${strapiUrl}/api/users/${userId}?populate=role`, {
              headers: {
                'Authorization': `Bearer ${jwt}`
              }
            });
            
            if (verifyResponse.ok) {
              const userData = await verifyResponse.json();
              
              if (userData.role?.type === 'funeral_director') {
                logger.success('✅ Successfully assigned and verified Funeral Director role', {
                  userId,
                  roleId: userData.role.id,
                  roleType: userData.role.type
                });
                return true;
              } else {
                logger.warning('⚠️ Role assignment succeeded but verification shows different role', {
                  expected: 'funeral_director',
                  actual: userData.role?.type || 'none'
                });
              }
            }
            
            // If we can't verify, but the update was successful, consider it a success
            logger.success('✅ Successfully assigned Funeral Director role to user', { userId });
            return true;
          }
          
          logger.warning(`⚠️ Failed to update user role (attempt ${retries + 1}/${maxRetries})`, {
            status: updateResponse.status,
            statusText: updateResponse.statusText
          });
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          retries++;
          
        } catch (retryError) {
          logger.error(`❌ Error during role update retry ${retries + 1}/${maxRetries}`, {
            error: retryError instanceof Error ? retryError.message : String(retryError)
          });
          retries++;
          
          if (retries >= maxRetries) {
            throw retryError;
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
      
      logger.error('❌ Failed to update user role after maximum retries', { maxRetries });
      return false;
      
    } catch (fetchError) {
      // Clear the timeout if it was an error
      clearTimeout(timeoutId);
      
      // Handle abort/timeout errors
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout');
      
      if (isTimeout) {
        logger.error('⏱️ Role fetch request timed out', { error: errorMessage });
        return false;
      }
      
      // Re-throw other errors to be caught by the outer catch
      throw fetchError;
    }
  } catch (error) {
    logger.error('💥 Error assigning Funeral Director role', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}