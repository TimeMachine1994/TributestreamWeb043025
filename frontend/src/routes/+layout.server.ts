import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, fetch, locals }) => {
  console.log("🔄 Loading layout server data");
  
  // Check if user is authenticated
  const jwt = cookies.get('jwt');
  const userRole = cookies.get('user_role');
  
  console.log(`🔒 Authentication status: ${!!jwt}, Role: ${userRole || 'unknown'}`);
  
  // If authenticated, fetch user data and set in locals
  if (jwt) {
    try {
      // Fetch user data from Strapi
      const response = await fetch('http://localhost:1338/api/users/me?populate=role', {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Set user data in locals for use in server-side functions
        locals.user = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: {
            id: userData.role?.id || 0,
            name: userData.role?.name || 'Authenticated',
            type: userData.role?.type || 'authenticated'
          }
        };
        
        console.log(`👤 User role: ${locals.user.role.name}`);
        
        // Return authentication status and user data to be used in all pages
        return {
          authenticated: true,
          user: {
            username: userData.username,
            role: {
              name: userData.role?.name || 'Authenticated',
              type: userData.role?.type || 'authenticated'
            }
          }
        };
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