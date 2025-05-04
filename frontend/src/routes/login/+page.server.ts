import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Define the ActionData type for the form
export interface ActionData {
  success?: boolean;
  error?: string;
  username?: string;
  user?: {
    username: string;
    email?: string;
    [key: string]: any;
  };
}

// Redirect authenticated users to the appropriate dashboard based on role
export const load: PageServerLoad = async ({ cookies, url, fetch }) => {
  // Check if user is already logged in
  const jwt = cookies.get('jwt');
  const userRole = cookies.get('user_role');
  const requiredRole = url.searchParams.get('required_role');
  
  if (jwt && !requiredRole) {
    console.log("🔒 User already authenticated, redirecting to appropriate dashboard");
    
    // Redirect based on role
    if (userRole === 'funeral_director') {
      console.log("👑 Funeral Director detected, redirecting to FD dashboard");
      throw redirect(302, '/fd-dashboard');
    } else {
      console.log("👪 Family Contact detected, redirecting to family dashboard");
      throw redirect(302, '/family-dashboard');
    }
  }
  
  // If there's a required_role parameter, don't redirect even if authenticated
  // This allows the login page to show the role requirement message
  if (requiredRole) {
    console.log("🔑 Login page loaded with required role:", requiredRole);
  }
  
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch }) => {
    console.log("🔄 Processing login action");
    
    // Get form data
    const formData = await request.formData();
    const identifier = formData.get('username')?.toString(); // Strapi uses 'identifier' for username/email
    const password = formData.get('password')?.toString();
    
    console.log(`🔍 Checking credentials for: ${identifier}`);
    
    // Validate inputs
    if (!identifier || !password) {
      console.log("❌ Missing credentials");
      return fail(400, {
        success: false,
        error: 'Username and password are required',
        username: identifier || ''
      });
    }
    
    // Log the credentials being used (without the actual password)
    console.log(`🔑 Login attempt with identifier: ${identifier}`);
    
    try {
      console.log("🌐 Sending authentication request via internal API proxy");
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Use event.fetch for internal API calls (instead of global fetch which isn't allowed with relative URLs)
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            identifier,
            password
          }),
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        console.log("🔍 API proxy response:", JSON.stringify({
          success: result.success,
          hasUser: !!result.user,
          error: result.error || null
        }, null, 2));
      
      // Check if authentication was successful
      if (response.ok && result.success) {
        console.log("✅ Authentication successful");
        
        // Note: JWT cookie is already set by the API proxy, no need to set it again
        
        console.log("👤 User data:", JSON.stringify(result.user, null, 2));
        
        // Get user role for redirection
        const userRole = result.user?.role?.type;
        console.log("🎭 User role for redirection:", userRole);
        
        // Return success with role information - client-side will handle redirect
        // This allows us to show a success message before redirecting
        return {
          success: true,
          user: result.user,
          redirectTo: userRole === 'funeral_director' ? '/fd-dashboard' : '/family-dashboard'
        };
      } else {
        console.log("❌ Authentication failed:", result.error || "Unknown error");
        console.log("📊 Response status:", response.status);
        console.log("📄 Full response:", JSON.stringify({
          success: result.success,
          error: result.error || null,
          validationErrors: result.validationErrors || null
        }, null, 2));
        
        return fail(401, {
          success: false,
          error: result.error || 'Invalid credentials',
          username: identifier
        });
      }
      } catch (fetchError) {
        // Clear the timeout if it was an error
        clearTimeout(timeoutId);
        
        // Handle abort/timeout errors
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout');
        
        if (isTimeout) {
          console.error("⏱️ Login request timed out:", errorMessage);
          return fail(500, {
            success: false,
            error: 'Login request timed out. The authentication service may be experiencing issues.',
            connectionError: true,
            username: identifier
          });
        }
        
        // Re-throw other errors to be caught by the outer catch
        throw fetchError;
      }
    } catch (error) {
      // If it's a redirect, let it propagate
      if (error instanceof Response && error.status === 303) {
        throw error;
      }
      
      console.error("💥 Error during authentication:", error);
      
      // Check if it's a connection error from the API
      const errorObj = error instanceof Object ? error : {};
      const responseData = (errorObj as any).responseData;
      
      if (responseData?.connectionError) {
        return fail(500, {
          success: false,
          error: responseData.error || 'Cannot connect to authentication service. Please try again later.',
          connectionError: true,
          username: identifier
        });
      }
      
      return fail(500, {
        success: false,
        error: 'An error occurred during login. Please try again.',
        username: identifier
      });
    }
  }
};