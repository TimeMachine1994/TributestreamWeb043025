import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';
import { assignFuneralDirectorRole } from '$lib/userRoles';

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

// Create a dedicated logger for the funeral director registration
const logger = createLogger('FuneralDirectorRegistrationAPI');

// Check if user is already logged in and log them out if needed
export const load: PageServerLoad = async ({ cookies, fetch }) => {
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
  
  return {};
};

export const actions: Actions = {
  default: async ({ request, fetch, cookies }) => {
    logger.info("🔐 Processing funeral director registration request");
    
    try {
      // Get form data
      const formData = await request.formData();
      
      // Extract user data
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const fullName = formData.get('fullName') as string;
      const phoneNumber = formData.get('phoneNumber') as string;
      // This is always a funeral director registration since we're in the funeral-director-registration route
      const isFuneralDirector = true;
      
      // Extract funeral home data
      const funeralHomeId = formData.get('funeralHomeId') as string;
      const funeralHomeName = formData.get('funeralHomeName') as string;
      const funeralHomeAddress = formData.get('funeralHomeAddress') as string;
      const funeralHomeCity = formData.get('funeralHomeCity') as string;
      const funeralHomeState = formData.get('funeralHomeState') as string;
      const funeralHomeZipCode = formData.get('funeralHomeZipCode') as string;
      const funeralHomePhoneNumber = formData.get('funeralHomePhoneNumber') as string;
      
      // Enhanced validation for required fields
      const validationErrors = [];
      
      if (!username) validationErrors.push('Username is required');
      else if (username.length < 3) validationErrors.push('Username must be at least 3 characters');
      
      if (!email) validationErrors.push('Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) validationErrors.push('Email format is invalid');
      
      if (!password) validationErrors.push('Password is required');
      else if (password.length < 6) validationErrors.push('Password must be at least 6 characters');
      
      if (!fullName) validationErrors.push('Full name is required');
      
      // Check if we need to create a new funeral home or use an existing one
      const isCreatingNewFuneralHome = funeralHomeName && funeralHomeAddress;
      
      if (!isCreatingNewFuneralHome && !funeralHomeId) {
        validationErrors.push('Please select a funeral home or create a new one');
      }
      
      if (isCreatingNewFuneralHome) {
        if (!funeralHomeName) validationErrors.push('Funeral home name is required');
        if (!funeralHomeAddress) validationErrors.push('Funeral home address is required');
      }
      
      if (validationErrors.length > 0) {
        logger.warning("❌ Validation errors for funeral director registration", { validationErrors });
        return {
          success: false,
          error: 'Validation failed',
          validationErrors
        };
      }
      
      // Log registration attempt
      logger.info("📝 Registering new funeral director with validated data", {
        username,
        email,
        hasPassword: !!password,
        hasFullName: !!fullName,
        hasPhoneNumber: !!phoneNumber,
        isCreatingNewFuneralHome,
        hasFuneralHomeId: !!funeralHomeId
      });
      
      // Store funeral home data for later creation
      let funeralHomeData = null;
      let finalFuneralHomeId = funeralHomeId;
      
      if (isCreatingNewFuneralHome) {
        logger.info("🏢 Preparing new funeral home data", { name: funeralHomeName });
        funeralHomeData = {
          name: funeralHomeName,
          address: funeralHomeAddress,
          city: funeralHomeCity || null,
          state: funeralHomeState || null,
          zipCode: funeralHomeZipCode || null,
          phoneNumber: funeralHomePhoneNumber || null
        };
      }
      
      // Step 1: Register the user first
      // Prepare the payload for Strapi - only include standard fields
      const strapiPayload: Record<string, any> = {
        username,
        email,
        password
        // Remove isFuneralDirector as it's not accepted by Strapi's default registration
      };
      
      // Add custom user data
      if (fullName) {
        strapiPayload.fullName = fullName;
      }
      
      if (phoneNumber) {
        strapiPayload.phoneNumber = phoneNumber;
      }
      
      if (finalFuneralHomeId) {
        strapiPayload.funeralHomeId = finalFuneralHomeId;
      }
      
      logger.info("🚀 Sending registration payload to Strapi", {
        url: `${STRAPI_URL}/api/auth/local/register`,
        payload: { ...strapiPayload, password: '***' },
        isFuneralDirector: true // Log that this is a funeral director registration
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
        
        // Store user role in a separate cookie for client-side access
        cookies.set('user_role', result.user.role?.type || 'authenticated', {
          path: '/',
          httpOnly: false, // Allow JavaScript access
          sameSite: 'strict',
          secure: import.meta.env.PROD,
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        // Assign the funeral_director role to the newly registered user
        try {
          logger.info("🔄 Assigning funeral_director role to new user", { userId: result.user.id });
          const roleAssigned = await assignFuneralDirectorRole(result.user.id, result.jwt, fetch);
          
          if (roleAssigned) {
            logger.success("✅ Successfully assigned funeral_director role to new user");
            
            // Update the role cookie to reflect the new role
            cookies.set('user_role', 'funeral_director', {
              path: '/',
              httpOnly: false,
              sameSite: 'strict',
              secure: import.meta.env.PROD,
              maxAge: 60 * 60 * 24 * 7 // 1 week
            });
          } else {
            logger.error("❌ Failed to assign funeral_director role to new user - this is a critical error");
            return {
              success: false,
              error: 'Failed to assign funeral director role. Please contact support.',
              details: 'Role assignment failed during registration process.'
            };
          }
        } catch (roleError) {
          logger.error("❌ Error assigning role to new user", {
            error: roleError instanceof Error ? roleError.message : String(roleError)
          });
          return {
            success: false,
            error: 'Failed to assign funeral director role. Please contact support.',
            details: 'Role assignment error during registration process.'
          };
        }
        
        // Step 2: Create a new funeral home if needed (now with authentication)
        if (funeralHomeData) {
          logger.info("🏢 Creating new funeral home with authentication", { name: funeralHomeData.name });
          
          try {
            const funeralHomeResponse = await fetch(`${STRAPI_URL}/api/funeral-homes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${result.jwt}`
              },
              body: JSON.stringify({
                data: funeralHomeData
              })
            });
            
            if (!funeralHomeResponse.ok) {
              logger.error("❌ Failed to create funeral home", {
                status: funeralHomeResponse.status,
                statusText: funeralHomeResponse.statusText
              });
              
              // Continue with success response even if funeral home creation fails
              // The user can create or select a funeral home later
              return {
                success: true,
                user: {
                  username: result.user.username,
                  email: result.user.email,
                  id: result.user.id,
                  role: {
                    id: result.user.role?.id,
                    name: result.user.role?.name || 'Funeral Director',
                    type: result.user.role?.type || 'funeral_director'
                  }
                },
                warning: 'User registered successfully, but funeral home creation failed. Please try again later.'
              };
            }
            
            const funeralHomeResult = await funeralHomeResponse.json();
            finalFuneralHomeId = funeralHomeResult.data.id;
            
            logger.success("✅ Successfully created new funeral home", {
              id: finalFuneralHomeId,
              name: funeralHomeData.name
            });
            
            // Associate the user with the funeral home
            if (finalFuneralHomeId) {
              logger.info("🔄 Associating user with funeral home", {
                userId: result.user.id,
                funeralHomeId: finalFuneralHomeId
              });
              
              const updateResponse = await fetch(`${STRAPI_URL}/api/users/${result.user.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${result.jwt}`
                },
                body: JSON.stringify({
                  funeralHome: finalFuneralHomeId
                })
              });
              
              if (updateResponse.ok) {
                logger.success("✅ Successfully associated user with funeral home");
              } else {
                logger.error("❌ Failed to associate user with funeral home", {
                  status: updateResponse.status
                });
              }
              
              // Fetch the user data with populated funeral home relationship
              logger.info("🔍 Fetching user data with populated funeral home relationship");
              const userResponse = await fetch(`${STRAPI_URL}/api/users/${result.user.id}?populate=funeralHome`, {
                headers: {
                  'Authorization': `Bearer ${result.jwt}`
                }
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                logger.success("✅ Successfully fetched user data with populated relationship", {
                  hasFuneralHome: !!userData.funeralHome
                });
              } else {
                logger.warning("⚠️ Failed to fetch user data with populated relationship", {
                  status: userResponse.status
                });
              }
            }
          } catch (error) {
            logger.error("❌ Error creating funeral home", {
              error: error instanceof Error ? error.message : String(error)
            });
            
            // Continue with success response even if funeral home creation fails
            return {
              success: true,
              user: {
                username: result.user.username,
                email: result.user.email,
                id: result.user.id,
                role: {
                  id: result.user.role?.id,
                  name: result.user.role?.name || 'Funeral Director',
                  type: result.user.role?.type || 'funeral_director'
                }
              },
              warning: 'User registered successfully, but funeral home creation failed. Please try again later.'
            };
          }
        } else if (finalFuneralHomeId) {
          // Associate the user with the existing funeral home
          logger.info("🔄 Associating user with existing funeral home", {
            userId: result.user.id,
            funeralHomeId: finalFuneralHomeId
          });
          
          const updateResponse = await fetch(`${STRAPI_URL}/api/users/${result.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.jwt}`
            },
            body: JSON.stringify({
              funeralHome: finalFuneralHomeId
            })
          });
          
          if (updateResponse.ok) {
            logger.success("✅ Successfully associated user with existing funeral home");
            
            // Fetch the user data with populated funeral home relationship
            logger.info("🔍 Fetching user data with populated funeral home relationship");
            const userResponse = await fetch(`${STRAPI_URL}/api/users/${result.user.id}?populate=funeralHome`, {
              headers: {
                'Authorization': `Bearer ${result.jwt}`
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              logger.success("✅ Successfully fetched user data with populated relationship", {
                hasFuneralHome: !!userData.funeralHome
              });
            } else {
              logger.warning("⚠️ Failed to fetch user data with populated relationship", {
                status: userResponse.status
              });
            }
          } else {
            logger.error("❌ Failed to associate user with existing funeral home", {
              status: updateResponse.status
            });
          }
        }
        
        // Fetch the complete user data with populated relationships before returning
        try {
          logger.info("🔍 Fetching complete user data with populated relationships");
          const completeUserResponse = await fetch(`${STRAPI_URL}/api/users/${result.user.id}?populate=funeralHome,role`, {
            headers: {
              'Authorization': `Bearer ${result.jwt}`
            }
          });
          
          if (completeUserResponse.ok) {
            const completeUserData = await completeUserResponse.json();
            logger.success("✅ Successfully fetched complete user data", {
              username: completeUserData.username,
              hasFuneralHome: !!completeUserData.funeralHome,
              role: completeUserData.role?.type
            });
            
            // Return success response with complete user data
            return {
              success: true,
              user: {
                username: completeUserData.username,
                email: completeUserData.email,
                id: completeUserData.id,
                role: {
                  id: completeUserData.role?.id,
                  name: completeUserData.role?.name || 'Funeral Director',
                  type: completeUserData.role?.type || 'funeral_director'
                },
                funeralHome: completeUserData.funeralHome
              }
            };
          }
        } catch (fetchError) {
          logger.warning("⚠️ Error fetching complete user data", {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError)
          });
        }
        
        // Fallback to basic user data if complete fetch fails
        return {
          success: true,
          user: {
            username: result.user.username,
            email: result.user.email,
            id: result.user.id,
            role: {
              id: result.user.role?.id,
              name: result.user.role?.name || 'Funeral Director',
              type: result.user.role?.type || 'funeral_director'
            }
          }
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
      logger.error("💥 Error during funeral director registration", {
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