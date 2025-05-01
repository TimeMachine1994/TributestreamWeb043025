import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

// Strapi API URL
const STRAPI_URL = 'http://localhost:1338';

/**
 * Proxy for Strapi authentication
 * This endpoint forwards authentication requests to Strapi and handles the response
 */
export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  console.log("🔄 Processing login request via API proxy");
  
  try {
    // Parse request body
    const body = await request.json();
    const { identifier, password } = body;
    
    console.log(`🔍 Proxying authentication request for: ${identifier}`);
    
    // Forward the request to Strapi using event.fetch to properly handle cookies/headers
    const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier,
        password
      })
    });
    
    // Parse Strapi response
    const result = await response.json();
    
    console.log("🔍 Strapi response status:", response.status);
    console.log("📊 Strapi response data:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.jwt) {
      console.log("✅ Strapi authentication successful");
      
      // Set JWT token from Strapi in cookie
      cookies.set('jwt', result.jwt, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: !dev, // Secure in production
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      console.log("🍪 JWT cookie set");
      
      // Return success response with user data but without exposing the JWT directly
      const responseObj = {
        success: true,
        message: 'Login successful',
        user: result.user
      };
      
      console.log("📤 Returning to server action:", JSON.stringify(responseObj, null, 2));
      return json(responseObj);
    } else {
      console.log("❌ Authentication failed:", result.error?.message || "Unknown error");
      
      // Forward Strapi error
      return json({
        success: false,
        error: result.error?.message || 'Invalid credentials'
      }, { status: response.status || 401 });
    }
  } catch (err) {
    console.error("💥 Error processing login:", err);
    
    // Check if it's a connection error (Strapi not running)
    const isConnectionError = err instanceof TypeError &&
      (err.message.includes('fetch failed') ||
       err.message.includes('Failed to fetch') ||
       err.message.includes('ECONNREFUSED'));
    
    // Return appropriate error response
    return json({
      success: false,
      error: isConnectionError
        ? 'Cannot connect to authentication service. Please try again later.'
        : 'Internal server error'
    }, { status: 500 });
  }
};