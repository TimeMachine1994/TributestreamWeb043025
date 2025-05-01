import { fail } from '@sveltejs/kit';
import { browser, dev } from '$app/environment';

/** @type {import('./$types').Actions} */
export const actions = {
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
    
    try {
      console.log("🌐 Sending authentication request via internal API proxy");
      
      // Use event.fetch for internal API calls (instead of global fetch which isn't allowed with relative URLs)
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password
        })
      });
      
      const result = await response.json();
      
      console.log("🔍 API proxy response:", JSON.stringify(result, null, 2));
      
      // Check if authentication was successful
      if (response.ok && result.success) {
        console.log("✅ Authentication successful");
        
        // Note: JWT cookie is already set by the API proxy, no need to set it again
        
        console.log("👤 User data:", JSON.stringify(result.user, null, 2));
        
        // Return success with user information
        return {
          success: true,
          message: 'Login successful',
          user: result.user
        };
      } else {
        console.log("❌ Authentication failed:", result.error || "Unknown error");
        console.log("📊 Response status:", response.status);
        console.log("📄 Full response:", JSON.stringify(result, null, 2));
        
        return fail(401, {
          success: false,
          error: result.error || 'Invalid credentials',
          username: identifier
        });
      }
    } catch (error) {
      console.error("💥 Error during authentication:", error);
      
      return fail(500, {
        success: false,
        error: 'An error occurred during login. Please try again.',
        username: identifier
      });
    }
  }
};