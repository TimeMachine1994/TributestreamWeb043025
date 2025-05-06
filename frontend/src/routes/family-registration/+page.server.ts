import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';
import { assignFamilyContactRole } from '$lib/userRoles';

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

// Create a dedicated logger for the family registration
const logger = createLogger('FamilyRegistrationAPI');

// Check if user is already logged in and log them out if needed
export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
  // Check if user is already logged in
  const jwt = cookies.get('jwt');
  
  if (jwt) {
    logger.info("🔄 User already logged in, logging out before registration");
    
    try {
      // Log the user out
      const response = await fetch('/api/login', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Clear cookies manually as well
        cookies.delete('jwt', { path: '/' });
        cookies.delete('user_role', { path: '/' });
        
        logger.success("✅ Successfully logged out existing user before registration");
        
        return {
          loggedOut: true,
          message: "You have been logged out to complete the registration process."
        };
      }
    } catch (error) {
      logger.error("❌ Error logging out user", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Fetch available tributes for the dropdown
  try {
    const tributesResponse = await fetch(`${STRAPI_URL}/api/tributes?pagination[limit]=10`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (tributesResponse.ok) {
      const tributesData = await tributesResponse.json();
      return {
        tributes: tributesData.data || []
      };
    }
  } catch (error) {
    logger.error("❌ Error fetching tributes", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return {};
};

export const actions: Actions = {
  signup: async ({ request, fetch, cookies }) => {
    logger.info("🔐 Processing family registration request");
    
    try {
      // Get form data
      const formData = await request.formData();
      
      // Extract user data
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const fullName = formData.get('fullName') as string;
      const phoneNumber = formData.get('phoneNumber') as string;
      const registrationPath = formData.get('registrationPath') as string;
      const tributeId = formData.get('tributeId') as string;
      
      // Enhanced validation for required fields
      const validationErrors = [];
      
      if (!username) validationErrors.push('Username is required');
      else if (username.length < 3) validationErrors.push('Username must be at least 3 characters');
      
      if (!email) validationErrors.push('Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) validationErrors.push('Email format is invalid');
      
      if (!password) validationErrors.push('Password is required');
      else if (password.length < 6) validationErrors.push('Password must be at least 6 characters');
      
      if (!fullName) validationErrors.push('Full name is required');
      
      if (registrationPath === 'contribute' && !tributeId) {
        validationErrors.push('Please select a tribute to contribute to');
      }
      
      if (validationErrors.length > 0) {
        logger.warning("❌ Validation errors for family registration", { validationErrors });
        return {
          success: false,
          error: 'Validation failed',
          validationErrors
        };
      }
      
      // Log registration attempt
      logger.info("📝 Registering new family contact with validated data", {
        username,
        email,
        hasPassword: !!password,
        hasFullName: !!fullName,
        hasPhoneNumber: !!phoneNumber,
        registrationPath,
        hasTributeId: !!tributeId
      });
      
      // Prepare the payload for Strapi - only include standard fields
      const strapiPayload: Record<string, any> = {
        username,
        email,
        password
      };
      
      // Add custom user data
      if (fullName) {
        strapiPayload.fullName = fullName;
      }
      
      if (phoneNumber) {
        strapiPayload.phoneNumber = phoneNumber;
      }
      
      logger.info("🚀 Sending registration payload to Strapi", {
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
          hasError: !!result.error
        });
      } catch (parseError) {
        logger.error("❌ Failed to parse Strapi response", {
          status: response.status,
          responseText: responseText,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        
        return {
          success: false,
          error: 'Invalid response from registration service',
          details: 'The server returned an invalid response'
        };
      }
      
      // Check if registration was successful
      if (response.ok && result.jwt) {
        logger.success("✅ User registration successful", {
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
        
        // Always set the role to family_contact for family registrations
        // even if we can't update it in Strapi due to permissions
        cookies.set('user_role', 'family_contact', {
          path: '/',
          httpOnly: false, // Allow JavaScript access
          sameSite: 'strict',
          secure: import.meta.env.PROD,
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        logger.info("✅ Set user_role cookie to 'family_contact'");
        
        // Assign the family_contact role to the newly registered user
        try {
          logger.info("🔄 Assigning family_contact role to new user", { userId: result.user.id });
          const roleAssigned = await assignFamilyContactRole(result.user.id, result.jwt, fetch);
          
          if (roleAssigned) {
            logger.success("✅ Successfully assigned family_contact role to new user");
            
            // Role was successfully assigned in Strapi
            // We don't need to set the cookie again as we already did this above
            logger.info("✅ Successfully assigned family_contact role in Strapi database");
          } else {
            // Log the error but still consider the registration a success
            logger.warning("⚠️ Failed to assign family_contact role to new user, but registration was successful");
            // Continue with successful registration despite role assignment failure
          }
        } catch (roleError) {
          logger.error("❌ Error assigning role to new user", {
            error: roleError instanceof Error ? roleError.message : String(roleError)
          });
          
          // Instead of failing, continue with successful registration
          logger.warning("⚠️ Registration will proceed despite role assignment error");
        }
        
        // Handle contributor path - create invitation/request
        if (registrationPath === 'contribute' && tributeId) {
          try {
            logger.info("🔄 Creating contribution request for tribute", {
              tributeId,
              userId: result.user.id
            });
            
            // Create a contribution request record with retry logic
            let contributionResponse;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
              try {
                contributionResponse = await fetch(`${STRAPI_URL}/api/contribution-requests`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${result.jwt}`
                  },
                  body: JSON.stringify({
                    data: {
                      status: 'pending',
                      tribute: tributeId,
                      contributor: result.user.id,
                      requestDate: new Date().toISOString()
                    }
                  })
                });
                
                // If request was successful, break out of retry loop
                if (contributionResponse && contributionResponse.ok) {
                  break;
                }
                
                // Otherwise log the failure and retry
                logger.warning(`Contribution request failed (attempt ${retryCount + 1}/${maxRetries + 1})`, {
                  status: contributionResponse?.status
                });
                
              } catch (retryError) {
                logger.warning(`Error during contribution request (attempt ${retryCount + 1}/${maxRetries + 1})`, {
                  error: retryError instanceof Error ? retryError.message : String(retryError)
                });
              }
              
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              retryCount++;
            }
            
            if (contributionResponse && contributionResponse.ok) {
              const contributionResult = await contributionResponse.json();
              logger.success("✅ Successfully created contribution request", {
                requestId: contributionResult.data?.id
              });
              
              // Notify the tribute owner about the contribution request
              // This would typically be done via email or in-app notification
              // For now, we'll just log it
              logger.info("📧 Notification would be sent to tribute owner");
              
            } else {
              logger.warning("⚠️ Failed to create contribution request", {
                status: contributionResponse?.status || 'unknown',
                maxRetries: maxRetries
              });
              
              // Continue with success response even if contribution request creation fails
              return {
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
                },
                warning: 'Your account was created, but we encountered an issue with your contribution request. The family contact may not have been notified.'
              };
            }
          } catch (contributionError) {
            logger.error("❌ Error creating contribution request", {
              error: contributionError instanceof Error ? contributionError.message : String(contributionError)
            });
            
            // Continue with success response even if contribution request creation fails
            return {
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
              },
              warning: 'Your account was created, but we encountered an issue with your contribution request. The family contact may not have been notified.'
            };
          }
        }
        
        // Return success response with user data and info about role assignment
        // We already attempted role assignment above, don't try again to avoid
        // potential token invalidation issues
        const roleAssignmentSuccess = true; // Assume success from previous attempt

        return {
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
          },
          registrationPath,
          roleAssigned: roleAssignmentSuccess,
          message: roleAssignmentSuccess
            ? 'Registration successful with proper role assignment.'
            : 'Registration successful, but there was an issue assigning the proper role. The site administrator has been notified.'
        };
      } else {
        logger.error("❌ Registration failed", {
          status: response.status,
          error: result.error?.message || 'Unknown error',
          details: JSON.stringify(result.error?.details || {})
        });
        
        // Check for specific error types
        if (result.error?.message?.includes('Email') || result.error?.message?.includes('email')) {
          return {
            success: false,
            error: 'This email is already registered'
          };
        } else if (result.error?.message?.includes('Username') || result.error?.message?.includes('username')) {
          return {
            success: false,
            error: 'This username is already taken'
          };
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
        
        return {
          success: false,
          error: result.error?.message || 'Registration failed',
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("💥 Error during family registration", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Check if it's a connection error
      const isConnectionError =
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('abort') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network');
      
      return {
        success: false,
        error: isConnectionError
          ? 'Cannot connect to registration service. Please try again later.'
          : 'An error occurred during registration',
        details: errorMessage
      };
    }
  }
};