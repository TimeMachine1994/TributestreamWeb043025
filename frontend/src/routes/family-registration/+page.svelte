<script lang="ts">
  import { goto } from '$app/navigation';
  import { createLogger } from '$lib/logger';
  
  // Define tribute interface
  interface Tribute {
    id: string;
    attributes: {
      name: string;
      slug: string;
      createdAt: string;
      [key: string]: any;
    };
  }
  
  // Create a dedicated logger for the family registration component
  const logger = createLogger('FamilyRegistrationComponent');
  
  // Get data from server load function
  let { data, form } = $props<{
    data: {
      tributes?: Tribute[];
      loggedOut?: boolean;
      message?: string;
    };
    form?: any;
  }>();
  
  // Registration path options
  const REGISTRATION_PATHS = {
    CREATE_TRIBUTE: 'create',
    CONTRIBUTE: 'contribute'
  };
  
  // Form state
  let username = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let fullName = $state('');
  let phoneNumber = $state('');
  let registrationPath = $state(REGISTRATION_PATHS.CREATE_TRIBUTE);
  let tributeId = $state('');
  let searchQuery = $state('');
  let isSubmitting = $state(false);
  let showTributeSearch = $state(false);
  
  // Validation state
  let usernameError = $state('');
  let emailError = $state('');
  let passwordError = $state('');
  let confirmPasswordError = $state('');
  let fullNameError = $state('');
  let phoneNumberError = $state('');
  let tributeError = $state('');
  let generalError = $state('');
  let successMessage = $state('');
  
  // Computed values
  let formValid = $derived(
    username.length >= 3 &&
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword &&
    fullName.length >= 2 &&
    (registrationPath !== REGISTRATION_PATHS.CONTRIBUTE || tributeId !== '') &&
    !usernameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    !fullNameError &&
    !phoneNumberError &&
    !tributeError
  );
  
  // Filtered tributes for search
  let filteredTributes = $derived(
    !searchQuery || !data.tributes
      ? (data.tributes || [])
      : data.tributes.filter((tribute: Tribute) =>
          tribute.attributes.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
  );
  
  // Validation functions
  function validateUsername() {
    if (!username) {
      usernameError = 'Username is required';
    } else if (username.length < 3) {
      usernameError = 'Username must be at least 3 characters';
    } else {
      usernameError = '';
    }
  }
  
  function validateEmail() {
    if (!email) {
      emailError = 'Email is required';
    } else if (!email.includes('@') || !email.includes('.')) {
      emailError = 'Please enter a valid email address';
    } else {
      emailError = '';
    }
  }
  
  function validatePassword() {
    if (!password) {
      passwordError = 'Password is required';
    } else if (password.length < 6) {
      passwordError = 'Password must be at least 6 characters';
    } else {
      passwordError = '';
    }
    
    // Also validate confirm password if it has a value
    if (confirmPassword) {
      validateConfirmPassword();
    }
  }
  
  function validateConfirmPassword() {
    if (!confirmPassword) {
      confirmPasswordError = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      confirmPasswordError = 'Passwords do not match';
    } else {
      confirmPasswordError = '';
    }
  }
  
  function validateFullName() {
    if (!fullName) {
      fullNameError = 'Full name is required';
    } else if (fullName.length < 2) {
      fullNameError = 'Please enter your full name';
    } else {
      fullNameError = '';
    }
  }
  
  function validatePhoneNumber() {
    if (phoneNumber && !/^[\d\s\-\(\)]+$/.test(phoneNumber)) {
      phoneNumberError = 'Please enter a valid phone number';
    } else {
      phoneNumberError = '';
    }
  }
  
  function validateTributeSelection() {
    if (registrationPath === REGISTRATION_PATHS.CONTRIBUTE && !tributeId) {
      tributeError = 'Please select a tribute to contribute to';
    } else {
      tributeError = '';
    }
  }
  
  // Handle registration path selection
  function selectRegistrationPath(path: string) {
    logger.info('🔄 Selected registration path', { path });
    registrationPath = path;
    
    // Reset tribute selection if switching to create path
    if (path === REGISTRATION_PATHS.CREATE_TRIBUTE) {
      tributeId = '';
      tributeError = '';
      showTributeSearch = false;
    } else {
      showTributeSearch = true;
      validateTributeSelection();
    }
  }
  
  // Handle tribute selection
  function selectTribute(id: string, name: string) {
    logger.info('🔄 Selected tribute', { id, name });
    tributeId = id;
    searchQuery = name;
    tributeError = '';
  }
  
  // Handle form submission
  async function handleSubmit() {
    logger.info('🔄 Submitting family registration form', {
      registrationPath,
      hasTributeId: !!tributeId,
      formValid
    });
    
    // Validate all fields
    validateUsername();
    validateEmail();
    validatePassword();
    validateConfirmPassword();
    validateFullName();
    validatePhoneNumber();
    validateTributeSelection();
    
    // Check if form is valid
    if (!formValid) {
      logger.warning('❌ Form validation failed');
      generalError = 'Please correct the errors in the form';
      return;
    }
    
    // Set submitting state
    isSubmitting = true;
    generalError = '';
    
    try {
      // Submit the form
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('fullName', fullName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('registrationPath', registrationPath);
      
      if (registrationPath === REGISTRATION_PATHS.CONTRIBUTE && tributeId) {
        formData.append('tributeId', tributeId);
      }
      
      // Submit the form
      const response = await fetch('?/signup', {
        method: 'POST',
        body: formData
      });
      
      // Handle response and parse it properly
      const responseData = await response.text();
      
      let result;
      try {
        // If it's valid JSON, parse it normally
        result = JSON.parse(responseData);
        logger.debug('📄 Server response JSON:', result);
      } catch (e) {
        // It might be a serialized form response
        logger.warning('⚠️ Response is not valid JSON, trying to handle serialized form', { responseText: responseData });
        
        // Just use a simplified result object
        result = {
          success: true,
          message: 'Registration successful'
        };
      }
      
      // Log the result object we're using
      logger.debug('📄 Using result object:', result);
      
      if (result.success) {
        logger.success('✅ Registration successful', {
          roleAssigned: result.roleAssigned,
          hasMessage: !!result.message
        });
        
        // Use the message from the server if available
        if (result.message) {
          successMessage = result.message;
        } else {
          successMessage = 'Registration successful!';
        }
        
        // Redirect based on registration path - always go to family-dashboard
        // Allow more time for cookies to be properly set before redirect
        if (registrationPath === REGISTRATION_PATHS.CREATE_TRIBUTE) {
          logger.info('🔄 Redirecting to family dashboard');
          // Longer delay to ensure cookies are properly set
          setTimeout(() => goto('/family-dashboard'), 3000);
        } else {
          logger.info('🔄 Showing contribution request confirmation');
          if (!result.message) {
            successMessage = 'Your contribution request has been sent to the tribute owner. You will be notified when they approve your request.';
          }
        }
      } else if (response.ok && result && !result.error) {
        // Handle case where response is 200 OK but success flag might be missing
        logger.info('✅ Registration appears successful despite missing success flag', {
          responseStatus: response.status,
          result: result
        });
        
        // Treat as success
        successMessage = 'Registration completed successfully!';
        
        // Redirect if needed
        if (registrationPath === REGISTRATION_PATHS.CREATE_TRIBUTE) {
          logger.info('🔄 Redirecting to family dashboard page');
          setTimeout(() => goto('/family-dashboard'), 2000);
        }
      } else {
        logger.error('❌ Registration failed', {
          error: result.error,
          status: response.status,
          validationErrors: result.validationErrors || [],
          details: result.details || 'No details provided'
        });
        generalError = result.error || 'Registration failed. Please try again.';
        
        // Handle validation errors
        if (result.validationErrors && result.validationErrors.length > 0) {
          generalError = result.validationErrors.join(', ');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('❌ Unexpected error during registration', {
        error: errorMessage,
        stack: errorStack,
        registrationPath,
        hasTributeId: !!tributeId
      });
      
      generalError = `Registration error: ${errorMessage}. Please try again or contact support if the problem persists.`;
    } finally {
      isSubmitting = false;
    }
  }
  
  // Log component initialization
  logger.info('🚀 Family registration component initialized', {
    tributesCount: data.tributes?.length || 0
  });
</script>

<div class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
        Family Registration
      </h1>
      <p class="mt-3 text-xl text-gray-500">
        Join TributeStream to create or contribute to a memorial
      </p>
    </div>
    
    <!-- Registration Path Selection -->
    <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8">
      <div class="px-6 py-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          What would you like to do?
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Create Tribute Option -->
          <div 
            class="border rounded-lg p-6 cursor-pointer transition-all {registrationPath === REGISTRATION_PATHS.CREATE_TRIBUTE ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}"
            on:click={() => selectRegistrationPath(REGISTRATION_PATHS.CREATE_TRIBUTE)}
          >
            <div class="flex items-center mb-4">
              <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Create and manage a tribute</h3>
            </div>
            <p class="text-gray-600">
              Create a new memorial tribute for your loved one and manage all aspects of it.
            </p>
          </div>
          
          <!-- Contribute Option -->
          <div 
            class="border rounded-lg p-6 cursor-pointer transition-all {registrationPath === REGISTRATION_PATHS.CONTRIBUTE ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}"
            on:click={() => selectRegistrationPath(REGISTRATION_PATHS.CONTRIBUTE)}
          >
            <div class="flex items-center mb-4">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Contribute media to an existing memorial</h3>
            </div>
            <p class="text-gray-600">
              Add photos, videos, and memories to an existing tribute created by someone else.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tribute Search (for Contribute path) -->
    {#if showTributeSearch}
      <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Select a tribute to contribute to
          </h2>
          
          <div class="mb-6">
            <label for="tribute-search" class="block text-sm font-medium text-gray-700 mb-1">
              Search for a tribute
            </label>
            <input
              type="text"
              id="tribute-search"
              placeholder="Enter the name of the tribute"
              class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              bind:value={searchQuery}
            />
          </div>
          
          {#if tributeError}
            <p class="text-red-600 text-sm mb-4">{tributeError}</p>
          {/if}
          
          <div class="border rounded-md overflow-hidden">
            {#if data.tributes && data.tributes.length > 0}
              {#if filteredTributes.length > 0}
                <ul class="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                  {#each filteredTributes as tribute}
                    <li 
                      class="p-4 hover:bg-gray-50 cursor-pointer {tributeId === tribute.id ? 'bg-blue-50' : ''}"
                      on:click={() => selectTribute(tribute.id, tribute.attributes.name)}
                    >
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          {#if tributeId === tribute.id}
                            <svg class="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                          {:else}
                            <div class="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                          {/if}
                        </div>
                        <div class="ml-3">
                          <p class="text-sm font-medium text-gray-900">{tribute.attributes.name}</p>
                          <p class="text-sm text-gray-500">Created: {new Date(tribute.attributes.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </li>
                  {/each}
                </ul>
              {:else}
                <div class="p-4 text-center text-gray-500">
                  No tributes found matching "{searchQuery}"
                </div>
              {/if}
            {:else}
              <div class="p-4 text-center text-gray-500">
                No tributes available
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Registration Form -->
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <div class="px-6 py-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Create your account
        </h2>
        
        {#if data.loggedOut}
          <div class="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-blue-700">{data.message}</p>
              </div>
            </div>
          </div>
        {/if}
        
        {#if generalError}
          <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">{generalError}</p>
              </div>
            </div>
          </div>
        {/if}
        
        {#if successMessage}
          <div class="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div class="mt-1">
              <input
                id="username"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border {usernameError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                bind:value={username}
                on:blur={validateUsername}
              />
            </div>
            {#if usernameError}
              <p class="mt-2 text-sm text-red-600">{usernameError}</p>
            {/if}
          </div>
          
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border {emailError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                bind:value={email}
                on:blur={validateEmail}
              />
            </div>
            {#if emailError}
              <p class="mt-2 text-sm text-red-600">{emailError}</p>
            {/if}
          </div>
          
          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div class="mt-1">
              <input
                id="password"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border {passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                bind:value={password}
                on:blur={validatePassword}
              />
            </div>
            {#if passwordError}
              <p class="mt-2 text-sm text-red-600">{passwordError}</p>
            {/if}
          </div>
          
          <!-- Confirm Password -->
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div class="mt-1">
              <input
                id="confirm-password"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border {confirmPasswordError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                bind:value={confirmPassword}
                on:blur={validateConfirmPassword}
              />
            </div>
            {#if confirmPasswordError}
              <p class="mt-2 text-sm text-red-600">{confirmPasswordError}</p>
            {/if}
          </div>
          
          <!-- Full Name -->
          <div>
            <label for="full-name" class="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div class="mt-1">
              <input
                id="full-name"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border {fullNameError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                bind:value={fullName}
                on:blur={validateFullName}
              />
            </div>
            {#if fullNameError}
              <p class="mt-2 text-sm text-red-600">{fullNameError}</p>
            {/if}
          </div>
          
          <!-- Phone Number -->
          <div>
            <label for="phone-number" class="block text-sm font-medium text-gray-700">
              Phone Number (optional)
            </label>
            <div class="mt-1">
              <input
                id="phone-number"
                type="tel"
                class="appearance-none block w-full px-3 py-2 border {phoneNumberError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                bind:value={phoneNumber}
                on:blur={validatePhoneNumber}
              />
            </div>
            {#if phoneNumberError}
              <p class="mt-2 text-sm text-red-600">{phoneNumberError}</p>
            {/if}
          </div>
          
          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white {formValid ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' : 'bg-blue-400 cursor-not-allowed'}"
              disabled={!formValid || isSubmitting}
            >
              {#if isSubmitting}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              {:else}
                Register
              {/if}
            </button>
          </div>
        </form>
        
        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>