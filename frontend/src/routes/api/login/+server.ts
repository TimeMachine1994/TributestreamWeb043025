import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_STRAPI_URL } from '$env/static/public';

// POST handler for login
export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
  console.log("🔄 API proxy: Processing login request");
  
  try {
    // Get request body
    const body = await request.json();
    
    // Get Strapi URL from config
    
    console.log(`🌐 API proxy: Using Strapi URL: ${PUBLIC_STRAPI_URL}`);
    let strapiUrl = PUBLIC_STRAPI_URL;
    // Forward request to Strapi with timeout and retry logic
    const maxRetries = 2;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        console.log(`🔄 API proxy: Authentication attempt ${retryCount + 1}/${maxRetries + 1}`);
        
        // Log the request payload for debugging
        console.log(`🔍 API proxy: Login request payload:`, {
          identifier: body.identifier,
          hasPassword: !!body.password
        });

        const response = await fetch(`${strapiUrl}/api/auth/local`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            identifier: body.identifier,
            password: body.password
          }),
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        // Check if authentication was successful
        if (response.ok && result.jwt) {
          console.log("✅ API proxy: Authentication successful");
          
          // Fetch user role information with timeout
          const roleController = new AbortController();
          const roleTimeoutId = setTimeout(() => roleController.abort(), 5000);
          
          try {
            const userResponse = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
              headers: {
                'Authorization': `Bearer ${result.jwt}`
              },
              signal: roleController.signal
            });
            
            clearTimeout(roleTimeoutId);
            
            const userData = await userResponse.json();
            console.log("👤 API proxy: User role information retrieved", {
              role: userData.role?.name || 'Unknown'
            });
            
            // Set JWT cookie
            cookies.set('jwt', result.jwt, {
              path: '/',
              httpOnly: true,
              sameSite: 'strict',
              secure: import.meta.env.PROD,
              maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            
            // Store user role in a separate cookie for client-side access
            cookies.set('user_role', userData.role?.type || 'authenticated', {
              path: '/',
              httpOnly: false, // Allow JavaScript access
              sameSite: 'strict',
              secure: import.meta.env.PROD,
              maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            
            // Return success response with user data (excluding sensitive info)
            return json({
              success: true,
              user: {
                username: result.user.username,
                email: result.user.email,
                id: result.user.id,
                role: {
                  id: userData.role?.id,
                  name: userData.role?.name || 'Authenticated',
                  type: userData.role?.type || 'authenticated'
                }
              }
            });
          } catch (roleError) {
            console.error("💥 API proxy: Error fetching user role", roleError);
            
            // Still set the JWT cookie even if role fetch fails
            cookies.set('jwt', result.jwt, {
              path: '/',
              httpOnly: true,
              sameSite: 'strict',
              secure: import.meta.env.PROD,
              maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            
            // Return success but with limited user data
            return json({
              success: true,
              user: {
                username: result.user.username,
                email: result.user.email,
                id: result.user.id,
                role: {
                  name: 'Authenticated',
                  type: 'authenticated'
                }
              }
            });
          }
        } else {
          console.log("❌ API proxy: Authentication failed", result);
          
          // Log detailed error information for debugging
          console.error("🔍 API proxy: Authentication error details:", {
            status: response.status,
            error: result.error?.message || 'Unknown error',
            errorType: result.error ? typeof result.error : 'none',
            errorDetails: result.error?.details ? JSON.stringify(result.error.details) : 'none',
            rawError: JSON.stringify(result.error || {})
          });
          
          // Check for specific error types
          if (result.error?.message?.includes('Invalid identifier or password')) {
            return json({
              success: false,
              error: 'Invalid username/email or password'
            }, { status: 401 });
          } else if (result.error?.message?.includes('parameters')) {
            return json({
              success: false,
              error: 'Login failed: Invalid format. Please try again.'
            }, { status: 400 });
          }
          
          // No need to retry for auth failures (wrong credentials)
          return json({
            success: false,
            error: result.error?.message || 'Invalid credentials'
          }, { status: 401 });
        }
        
      } catch (attemptError) {
        lastError = attemptError;
        const errorMessage = attemptError instanceof Error ? attemptError.message : String(attemptError);
        
        // Check if it's a connection error (ECONNREFUSED, timeout, etc.)
        const isConnectionError = 
          errorMessage.includes('ECONNREFUSED') || 
          errorMessage.includes('abort') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('network');
        
        if (isConnectionError && retryCount < maxRetries) {
          console.warn(`🔄 API proxy: Connection error, retrying (${retryCount + 1}/${maxRetries})`, errorMessage);
          retryCount++;
          
          // Exponential backoff: 1s, 2s, 4s, etc.
          const backoffTime = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        } else {
          // Either not a connection error or we've exhausted retries
          throw attemptError;
        }
      }
    }
    
    // This should never be reached due to the returns in the loop
    throw new Error("Unexpected end of login flow");
    
  } catch (error) {
    console.error("💥 API proxy: Error during authentication", error);
    
    // Determine if it's a connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isConnectionError = 
      errorMessage.includes('ECONNREFUSED') || 
      errorMessage.includes('abort') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('network');
    
    return json({
      success: false,
      error: isConnectionError 
        ? 'Cannot connect to authentication service. Please try again later.' 
        : 'An error occurred during login',
      connectionError: isConnectionError
    }, { status: 500 });
  }
};

// DELETE handler for logout
export const DELETE: RequestHandler = async ({ cookies }) => {
  console.log("🔄 API proxy: Processing logout request");
  
  try {
    // Clear JWT cookie
    cookies.delete('jwt', { path: '/' });
    cookies.delete('user_role', { path: '/' });
    
    console.log("✅ API proxy: Logout successful");
    
    return json({
      success: true
    });
  } catch (error) {
    console.error("💥 API proxy: Error during logout", error);
    
    return json({
      success: false,
      error: 'An error occurred during logout'
    }, { status: 500 });
  }
};