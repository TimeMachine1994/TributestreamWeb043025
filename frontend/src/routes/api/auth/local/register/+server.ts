import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';
import { assignFamilyContactRole } from '$lib/userRoles';

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

// Create a dedicated logger for the auth registration API
const logger = createLogger('AuthRegistrationAPI');

/**
 * POST handler for user registration
 * Creates a new user account and logs them in
 *
 * Strapi expects the following format for registration:
 * {
 *   username: string,
 *   email: string,
 *   password: string,
 *   role: string,
 *   fullName: string,
 *   phoneNumber: string
 * }
 *
 * Custom fields should be included at the top level of the user object
 * Role should be set to 'family_contact' for new registrations
 */
export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
  logger.info("🔐 Processing registration request");
  
  try {
    // Get request body
    const body = await request.json();
    
    // Enhanced validation for required fields
    const validationErrors = [];
    
    if (!body.username) validationErrors.push('Username is required');
    else if (body.username.length < 3) validationErrors.push('Username must be at least 3 characters');
    
    if (!body.email) validationErrors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) validationErrors.push('Email format is invalid');
    
    if (!body.password) validationErrors.push('Password is required');
    else if (body.password.length < 6) validationErrors.push('Password must be at least 6 characters');
    
    if (validationErrors.length > 0) {
      logger.warning("❌ Validation errors for registration", { validationErrors });
      return json({
        success: false,
        error: 'Validation failed',
        validationErrors
      }, { status: 400 });
    }
    
    // Log registration attempt
    logger.info("📝 Registering new user with validated data", {
      username: body.username,
      email: body.email,
      hasPassword: !!body.password,
      hasFullName: !!body.fullName,
      hasPhoneNumber: !!body.phoneNumber
    });
    
    // Prepare the payload as Strapi expects it
    // For Strapi's auth/local/register endpoint, we need to structure custom fields properly
    const strapiPayload: Record<string, any> = {
      username: body.username,
      email: body.email,
      password: body.password
    };
    
    // Add custom user data at the top level
    if (body.fullName) {
      strapiPayload.fullName = body.fullName;
    }
    
    if (body.phoneNumber) {
      strapiPayload.phoneNumber = body.phoneNumber;
    }
    
    // Log the structure we're sending to Strapi
    logger.info("📋 Registration payload structure", {
      hasUsername: !!strapiPayload.username,
      hasEmail: !!strapiPayload.email,
      hasPassword: !!strapiPayload.password,
      hasFullName: !!strapiPayload.fullName,
      hasPhoneNumber: !!strapiPayload.phoneNumber
    });
    
    // Log the payload being sent (for debugging)
    logger.debug("🚀 Sending registration payload to Strapi", {
      url: `${STRAPI_URL}/api/auth/local/register`,
      payload: { ...strapiPayload, password: '***' }
    });
    
    const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(strapiPayload)
    });
    
    // Get the raw response text for debugging
    const responseText = await response.text();
    logger.debug("📄 Raw response from Strapi:", { responseText });
    
    let result;
    
    try {
      // Try to parse response as JSON
      result = JSON.parse(responseText);
      logger.debug("📥 Received registration response", {
        status: response.status,
        success: response.ok,
        hasJwt: !!result.jwt,
        hasError: !!result.error,
        errorType: result.error ? typeof result.error : 'none',
        errorDetails: result.error ? typeof result.error.details : 'none'
      });
    } catch (parseError) {
      logger.error("❌ Failed to parse Strapi response", {
        status: response.status,
        responseText: responseText,
        error: parseError instanceof Error ? parseError.message : String(parseError)
      });
      
      return json({
        success: false,
        error: 'Invalid response from registration service',
        details: 'The server returned an invalid response',
        rawResponse: responseText.substring(0, 200) // Include part of the raw response for debugging
      }, { status: 500 });
    }
    
    // Check if registration was successful
    if (response.ok && result.jwt) {
      logger.success("Registration successful", {
        username: result.user.username,
        id: result.user.id
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
      cookies.set('user_role', result.user.role?.type || 'authenticated', {
        path: '/',
        httpOnly: false, // Allow JavaScript access
        sameSite: 'strict',
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      // Assign the family_contact role to the newly registered user
      try {
        logger.info("🔄 Assigning family_contact role to new user", { userId: result.user.id });
        const roleAssigned = await assignFamilyContactRole(result.user.id, result.jwt, fetch);
        
        if (roleAssigned) {
          logger.success("✅ Successfully assigned family_contact role to new user");
          
          // Update the role cookie to reflect the new role
          cookies.set('user_role', 'family_contact', {
            path: '/',
            httpOnly: false,
            sameSite: 'strict',
            secure: import.meta.env.PROD,
            maxAge: 60 * 60 * 24 * 7 // 1 week
          });
        } else {
          logger.warning("⚠️ Failed to assign family_contact role to new user");
        }
      } catch (roleError) {
        logger.error("❌ Error assigning role to new user", {
          error: roleError instanceof Error ? roleError.message : String(roleError)
        });
        // Continue with the response even if role assignment fails
      }
      
      // Return success response with user data (excluding sensitive info)
      return json({
        success: true,
        user: {
          username: result.user.username,
          email: result.user.email,
          id: result.user.id,
          role: {
            id: result.user.role?.id,
            name: result.user.role?.name || 'Family Contact',
            type: result.user.role?.type || 'family_contact'
          }
        }
      });
    } else {
      logger.error("❌ Registration failed", {
        status: response.status,
        error: result.error?.message || 'Unknown error',
        details: JSON.stringify(result.error?.details || {}),
        rawError: JSON.stringify(result.error || {})
      });
      
      // Check for specific error types
      if (result.error?.message?.includes('Email') || result.error?.message?.includes('email')) {
        return json({
          success: false,
          error: 'This email is already registered'
        }, { status: 400 });
      } else if (result.error?.message?.includes('Username') || result.error?.message?.includes('username')) {
        return json({
          success: false,
          error: 'This username is already taken'
        }, { status: 400 });
      }
      
      // Extract detailed validation errors from the response
      const validationErrors = [];
      
      // Handle different error formats from Strapi with proper null checks
      if (result.error?.details?.errors) {
        // Standard Strapi v4 error format
        for (const field in result.error.details.errors) {
          validationErrors.push(`${field}: ${result.error.details.errors[field][0]}`);
        }
      } else if (result.error?.name === 'ValidationError' && result.error?.details) {
        // Alternative validation error format
        if (Array.isArray(result.error.details)) {
          for (const detail of result.error.details) {
            validationErrors.push(`${detail.path}: ${detail.message}`);
          }
        } else if (typeof result.error.details === 'object' && result.error.details !== null) {
          // Handle non-array details object
          for (const key in result.error.details) {
            validationErrors.push(`${key}: ${result.error.details[key]}`);
          }
        }
      } else if (result.error?.message) {
        // Simple error message
        validationErrors.push(result.error.message);
      }
      
      return json({
        success: false,
        error: result.error?.message || 'Registration failed',
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        details: result.error?.details || undefined,
        rawError: JSON.stringify(result.error) // Include the raw error for debugging
      }, { status: response.status || 400 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("💥 Error during registration", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check if it's a connection error
    const isConnectionError =
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('abort') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network');
    
    return json({
      success: false,
      error: isConnectionError
        ? 'Cannot connect to registration service. Please try again later.'
        : 'An error occurred during registration',
      details: errorMessage
    }, { status: 500 });
  }
};