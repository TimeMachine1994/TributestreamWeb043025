import type { LayoutServerLoad } from './$types';
import config, { getStrapiUrl } from '$lib/config';

export const load: LayoutServerLoad = async ({ cookies, fetch, locals }) => {
  console.log("🔄 Loading layout server data");
  
  // Check if user is authenticated
  const jwt = cookies.get('jwt');
  const userRole = cookies.get('user_role');
  
  console.log(`🔒 Authentication status: ${!!jwt}, Role: ${userRole || 'unknown'}`);
  
  // CRITICAL: Set a minimal user object in locals FIRST based on cookies
  // This ensures route guards have something to check even if API calls fail
  if (jwt && userRole) {
    // Create a minimal user object based on cookie information
    locals.user = {
      id: 0,
      username: 'user',
      email: '',
      role: {
        id: 0,
        name: userRole === 'family_contact' ? 'Family Contact' :
              userRole === 'funeral_director' ? 'Funeral Director' : 'Authenticated',
        type: userRole
      }
    };
    
    console.log(`👤 Set minimal user object from cookies with role: ${userRole}`);
  }
  
  // If authenticated, fetch user data and update locals with complete data
  if (jwt) {
    try {
      // Fetch user data from Strapi using the config module
      const baseUrl = getStrapiUrl();
      
      console.log(`🌐 Using Strapi URL: ${baseUrl} (Environment: ${config.environment})`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(`${baseUrl}/api/users/me?populate=role`, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const userData = await response.json();
          
          // Prioritize the role from the cookie over what Strapi returns
          const cookieRoleType = userRole || 'authenticated';
          
          // For family registration users, we want to force the role
          const roleName =
            cookieRoleType === 'family_contact' ? 'Family Contact' :
            userData.role?.name || 'Authenticated';
          
          // Set user data in locals for use in server-side functions
          locals.user = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            role: {
              id: userData.role?.id || 0,
              name: roleName,
              type: cookieRoleType
            }
          };
          
          console.log(`👤 User role from cookie: ${cookieRoleType}, Applied role: ${locals.user.role.type}`);
          
          // Return authentication status and user data to be used in all pages
          return {
            authenticated: true,
            user: {
              username: userData.username,
              role: {
                name: roleName,
                type: cookieRoleType
              }
            }
          };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error("💥 Error in user data fetch:", fetchError);
        
        // Set a minimal user object based on cookies
        if (jwt && userRole) {
          locals.user = {
            id: 0, // Placeholder ID
            username: 'user', // Placeholder username
            email: '',
            role: {
              id: 0,
              name: userRole === 'family_contact' ? 'Family Contact' :
                    userRole === 'funeral_director' ? 'Funeral Director' : 'Authenticated',
              type: userRole
            }
          };
          
          console.log(`👤 Fallback: Using role from cookie: ${userRole}`);
          
          // Return authentication status and user data
          return {
            authenticated: true,
            user: {
              username: 'user',
              role: {
                name: userRole === 'family_contact' ? 'Family Contact' :
                      userRole === 'funeral_director' ? 'Funeral Director' : 'Authenticated',
                type: userRole
              }
            }
          };
        }
      }
    } catch (error) {
      console.error("💥 Error fetching user data:", error);
    }
  }
  
  // Return authentication status to be used in all pages
  return {
    authenticated: !!jwt,
    user: null
  };
};