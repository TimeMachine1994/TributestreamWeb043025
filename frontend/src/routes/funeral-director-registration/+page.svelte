<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { getStrapiUrl } from '$lib/config';
  import { createLogger } from '$lib/logger';
  import type { SubmitFunction } from '@sveltejs/kit';
  
  // Define proper types for the API responses
  interface FuneralHome {
    id: string;
    name: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phoneNumber?: string;
    directors?: User[];
  }
  
  interface User {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    role?: {
      id: string;
      name: string;
      type: string;
    };
  }
  
  interface FormData {
    success?: boolean;
    user?: User;
    error?: string;
    validationErrors?: string[];
    details?: string;
    warning?: string;
  }
  
  // Define props with runes
  let { form, data } = $props<{ form?: FormData, data?: { loggedOut?: boolean, message?: string } }>();
  
  // Form state using runes
  let isSubmitting = $state(false);
  let showNewFuneralHomeForm = $state(false);
  let searchQuery = $state('');
  let searchResults = $state<FuneralHome[]>([]);
  let selectedFuneralHome = $state<FuneralHome | null>(null);
  let isSearching = $state(false);
  let searchError = $state('');
  let logoutMessage = $derived(data?.loggedOut ? data.message : '');
  
  // Form data
  let username = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let fullName = $state('');
  let phoneNumber = $state('');
  
  // New funeral home data
  let funeralHomeName = $state('');
  let funeralHomeAddress = $state('');
  let funeralHomeCity = $state('');
  let funeralHomeState = $state('');
  let funeralHomeZipCode = $state('');
  let funeralHomePhoneNumber = $state('');
  
  // Validation state
  let validationErrors = $state<Record<string, string>>({});
  
  // Derived states
  let success = $derived(form?.success === true);
  let userData = $derived(form?.user || null);
  let redirecting = $state(false);
  
  // Create a logger for this component
  const logger = createLogger('FuneralDirectorRegistration');
  
  // Form validation
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    // Validate user data
    if (!username) errors.username = 'Username is required';
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email format is invalid';
    
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    if (!fullName) errors.fullName = 'Full name is required';
    
    // Validate funeral home data if adding a new one
    if (showNewFuneralHomeForm) {
      if (!funeralHomeName) errors.funeralHomeName = 'Funeral home name is required';
      if (!funeralHomeAddress) errors.funeralHomeAddress = 'Address is required';
    } else if (!selectedFuneralHome) {
      errors.selectedFuneralHome = 'Please select a funeral home or create a new one';
    }
    
    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }
  
  // Search for funeral homes
  async function searchFuneralHomes(): Promise<void> {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }
    
    isSearching = true;
    searchError = '';
    
    try {
      logger.info("🔍 Searching for funeral homes", { query: searchQuery });
      const strapiUrl = getStrapiUrl();
      const response = await fetch(`${strapiUrl}/api/funeral-homes/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      searchResults = data as FuneralHome[];
      logger.info("✅ Search results received", { count: data.length });
    } catch (error) {
      logger.error("❌ Error searching funeral homes", {
        error: error instanceof Error ? error.message : String(error)
      });
      searchError = 'Failed to search funeral homes. Please try again.';
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }
  
  // Handle funeral home selection
  function selectFuneralHome(funeralHome: FuneralHome): void {
    selectedFuneralHome = funeralHome;
    logger.info("🏢 Funeral home selected", { id: funeralHome.id, name: funeralHome.name });
  }
  
  // Toggle between selecting existing and creating new funeral home
  function toggleFuneralHomeForm(): void {
    showNewFuneralHomeForm = !showNewFuneralHomeForm;
    if (showNewFuneralHomeForm) {
      selectedFuneralHome = null;
    }
    logger.info(`${showNewFuneralHomeForm ? '➕' : '🔍'} Toggled funeral home form`, {
      showNewFuneralHomeForm
    });
  }
  
  // Handle successful registration with redirect
  $effect(() => {
    if (success && !redirecting) {
      redirecting = true;
      logger.success("🎉 Registration successful, redirecting to dashboard");
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        window.location.href = '/fd-dashboard';
      }, 1500);
    }
  });
  
  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout>;
  $effect(() => {
    clearTimeout(searchTimeout);
    if (searchQuery.trim()) {
      searchTimeout = setTimeout(() => {
        searchFuneralHomes();
      }, 300);
    }
  });
</script>

<div class="registration-container">
  <h1>Funeral Director Registration</h1>
  
  {#if logoutMessage}
    <div class="logout-message">
      <div class="logout-icon">🔓</div>
      <div class="logout-content">{logoutMessage}</div>
    </div>
  {/if}
  
  {#if success}
    <div class="success-message">
      <h2>Registration successful! 🎉</h2>
      {#if userData}
        <div class="user-info">
          <p>Welcome, <strong>{userData.username}</strong>!</p>
          {#if userData.email}
            <p>Email: {userData.email}</p>
          {/if}
          {#if userData.role?.type === 'funeral_director'}
            <p class="role-info">Role: <span class="role-badge">Funeral Director</span></p>
          {/if}
          {#if userData.funeralHome}
            <div class="funeral-home-info">
              <h3>Associated Funeral Home:</h3>
              <p><strong>{userData.funeralHome.name}</strong></p>
              <p>{userData.funeralHome.address}</p>
              {#if userData.funeralHome.city || userData.funeralHome.state}
                <p>{userData.funeralHome.city || ''} {userData.funeralHome.state || ''} {userData.funeralHome.zipCode || ''}</p>
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <p>Your account has been created successfully!</p>
      {/if}
      
      {#if form?.warning}
        <div class="warning-message">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">{form.warning}</div>
        </div>
      {/if}
      
      <p class="redirect-message">
        {#if redirecting}
          <span class="spinner"></span>
          Redirecting to Funeral Director dashboard...
        {/if}
      </p>
    </div>
  {:else}
    <form 
      method="POST" 
      use:enhance={(() => {
        if (!validateForm()) {
          return { update: () => {} };
        }
        
        isSubmitting = true;
        logger.info("🚀 Submitting funeral director registration form");
        
        return async ({ result }: { result: { type: string; status?: number; data?: any } }) => {
          isSubmitting = false;
          logger.info("🏁 Registration process completed", result);
        };
      }) as SubmitFunction}
    >
      <div class="form-section">
        <h2>Personal Information</h2>
        
        <div class="form-group">
          <label for="username">Username*</label>
          <input
            type="text"
            id="username"
            name="username"
            bind:value={username}
            required
            autocomplete="username"
            class:error={validationErrors.username}
          />
          {#if validationErrors.username}
            <div class="error-text">{validationErrors.username}</div>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="email">Email*</label>
          <input
            type="email"
            id="email"
            name="email"
            bind:value={email}
            required
            autocomplete="email"
            class:error={validationErrors.email}
          />
          {#if validationErrors.email}
            <div class="error-text">{validationErrors.email}</div>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="password">Password*</label>
          <input
            type="password"
            id="password"
            name="password"
            bind:value={password}
            required
            autocomplete="new-password"
            class:error={validationErrors.password}
          />
          {#if validationErrors.password}
            <div class="error-text">{validationErrors.password}</div>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password*</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            bind:value={confirmPassword}
            required
            autocomplete="new-password"
            class:error={validationErrors.confirmPassword}
          />
          {#if validationErrors.confirmPassword}
            <div class="error-text">{validationErrors.confirmPassword}</div>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="fullName">Full Name*</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            bind:value={fullName}
            required
            class:error={validationErrors.fullName}
          />
          {#if validationErrors.fullName}
            <div class="error-text">{validationErrors.fullName}</div>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            bind:value={phoneNumber}
          />
        </div>
      </div>
      
      <div class="form-section">
        <h2>Funeral Home Information</h2>
        
        <div class="toggle-container">
          <button 
            type="button" 
            class="toggle-button" 
            class:active={!showNewFuneralHomeForm} 
            on:click={() => {
              if (showNewFuneralHomeForm) toggleFuneralHomeForm();
            }}
          >
            Select Existing
          </button>
          <button 
            type="button" 
            class="toggle-button" 
            class:active={showNewFuneralHomeForm} 
            on:click={() => {
              if (!showNewFuneralHomeForm) toggleFuneralHomeForm();
            }}
          >
            Add New
          </button>
        </div>
        
        {#if !showNewFuneralHomeForm}
          <div class="search-section">
            <div class="form-group">
              <label for="searchQuery">Search Funeral Homes</label>
              <div class="search-container">
                <input
                  type="text"
                  id="searchQuery"
                  bind:value={searchQuery}
                  placeholder="Enter funeral home name"
                />
                <button 
                  type="button" 
                  class="search-button" 
                  on:click={searchFuneralHomes}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? '🔄' : '🔍'}
                </button>
              </div>
            </div>
            
            {#if searchError}
              <div class="error-message">
                <div class="error-icon">❌</div>
                <div class="error-content">{searchError}</div>
              </div>
            {/if}
            
            {#if searchResults.length > 0}
              <div class="search-results">
                <h3>Select a Funeral Home</h3>
                <div class="results-list">
                  {#each searchResults as funeralHome}
                    <div 
                      class="result-item" 
                      class:selected={selectedFuneralHome?.id === funeralHome.id}
                      on:click={() => selectFuneralHome(funeralHome)}
                    >
                      <div class="result-name">{funeralHome.name}</div>
                      <div class="result-address">
                        {funeralHome.address}
                        {#if funeralHome.city || funeralHome.state}
                          , {funeralHome.city || ''} {funeralHome.state || ''}
                        {/if}
                        {#if funeralHome.zipCode}
                          {funeralHome.zipCode}
                        {/if}
                      </div>
                      {#if funeralHome.phoneNumber}
                        <div class="result-phone">{funeralHome.phoneNumber}</div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {:else if searchQuery && !isSearching}
              <div class="no-results">
                <p>No funeral homes found matching "{searchQuery}"</p>
                <button type="button" class="link-button" on:click={toggleFuneralHomeForm}>
                  Add a new funeral home instead
                </button>
              </div>
            {/if}
            
            {#if validationErrors.selectedFuneralHome && !selectedFuneralHome}
              <div class="error-text">{validationErrors.selectedFuneralHome}</div>
            {/if}
            
            {#if selectedFuneralHome}
              <div class="selected-funeral-home">
                <h3>Selected Funeral Home</h3>
                <div class="selected-details">
                  <p><strong>{selectedFuneralHome.name}</strong></p>
                  <p>{selectedFuneralHome.address}</p>
                  {#if selectedFuneralHome.city || selectedFuneralHome.state}
                    <p>{selectedFuneralHome.city || ''} {selectedFuneralHome.state || ''} {selectedFuneralHome.zipCode || ''}</p>
                  {/if}
                  {#if selectedFuneralHome.phoneNumber}
                    <p>Phone: {selectedFuneralHome.phoneNumber}</p>
                  {/if}
                </div>
                <input type="hidden" name="funeralHomeId" value={selectedFuneralHome.id} />
              </div>
            {/if}
          </div>
        {:else}
          <div class="new-funeral-home-form">
            <div class="form-group">
              <label for="funeralHomeName">Funeral Home Name*</label>
              <input
                type="text"
                id="funeralHomeName"
                name="funeralHomeName"
                bind:value={funeralHomeName}
                required={showNewFuneralHomeForm}
                class:error={validationErrors.funeralHomeName}
              />
              {#if validationErrors.funeralHomeName}
                <div class="error-text">{validationErrors.funeralHomeName}</div>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="funeralHomeAddress">Address*</label>
              <input
                type="text"
                id="funeralHomeAddress"
                name="funeralHomeAddress"
                bind:value={funeralHomeAddress}
                required={showNewFuneralHomeForm}
                class:error={validationErrors.funeralHomeAddress}
              />
              {#if validationErrors.funeralHomeAddress}
                <div class="error-text">{validationErrors.funeralHomeAddress}</div>
              {/if}
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="funeralHomeCity">City</label>
                <input
                  type="text"
                  id="funeralHomeCity"
                  name="funeralHomeCity"
                  bind:value={funeralHomeCity}
                />
              </div>
              
              <div class="form-group">
                <label for="funeralHomeState">State</label>
                <input
                  type="text"
                  id="funeralHomeState"
                  name="funeralHomeState"
                  bind:value={funeralHomeState}
                />
              </div>
              
              <div class="form-group">
                <label for="funeralHomeZipCode">Zip Code</label>
                <input
                  type="text"
                  id="funeralHomeZipCode"
                  name="funeralHomeZipCode"
                  bind:value={funeralHomeZipCode}
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="funeralHomePhoneNumber">Phone Number</label>
              <input
                type="tel"
                id="funeralHomePhoneNumber"
                name="funeralHomePhoneNumber"
                bind:value={funeralHomePhoneNumber}
              />
            </div>
          </div>
        {/if}
      </div>
      
      <!-- We no longer need to send isFuneralDirector to the API -->
      <!-- The server-side code will handle role assignment after registration -->
      
      {#if form?.error}
        <div class="error-message">
          <div class="error-icon">❌</div>
          <div class="error-content">
            <strong>{form.error}</strong>
            
            {#if form.validationErrors && form.validationErrors.length > 0}
              <ul class="validation-errors-list">
                {#each form.validationErrors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      {/if}
      
      <div class="form-actions">
        <button type="submit" class="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register as Funeral Director'}
        </button>
        <a href="/login" class="login-link">Already have an account? Log in</a>
      </div>
    </form>
  {/if}
</div>

<style>
  .registration-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #333; /* Add explicit text color for all content */
  }
  
  .logout-message {
    background-color: #e3f2fd;
    border-left: 4px solid #2196F3;
    color: #0d47a1;
    margin: 15px 0;
    padding: 15px;
    border-radius: 4px;
    display: flex;
    align-items: flex-start;
  }
  
  .logout-icon {
    font-size: 1.5rem;
    margin-right: 10px;
    padding-top: 2px;
  }
  
  .logout-content {
    flex: 1;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }
  
  h2 {
    color: #444;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  
  .form-section {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333; /* Ensure label text is dark */
  }
  
  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    color: #333; /* Ensure input text is dark */
    background-color: #fff; /* Explicit white background */
  }
  
  input.error {
    border-color: #f44336;
    background-color: rgba(244, 67, 54, 0.05);
  }
  
  .error-text {
    color: #f44336;
    font-size: 14px;
    margin-top: 5px;
  }
  
  .toggle-container {
    display: flex;
    margin-bottom: 20px;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .toggle-button {
    flex: 1;
    padding: 10px;
    background-color: #f0f0f0;
    color: #333; /* Ensure toggle button text is dark */
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .toggle-button.active {
    background-color: #4CAF50;
    color: white;
    font-weight: bold;
  }
  
  .search-container {
    display: flex;
    gap: 10px;
  }
  
  .search-button {
    padding: 10px 15px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .search-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .search-results {
    margin-top: 20px;
  }
  
  .search-results h3 {
    color: #333; /* Ensure heading text is dark */
  }
  
  .results-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .result-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
    color: #333; /* Ensure result item text is dark */
  }
  
  .result-item:last-child {
    border-bottom: none;
  }
  
  .result-item:hover {
    background-color: #f5f5f5;
  }
  
  .result-item.selected {
    background-color: #e8f5e9;
    border-left: 4px solid #4CAF50;
  }
  
  .result-name {
    font-weight: bold;
    margin-bottom: 5px;
    color: #333; /* Ensure result name is dark */
  }
  
  .result-address, .result-phone {
    font-size: 14px;
    color: #555; /* Slightly darker for better contrast */
  }
  
  .no-results {
    text-align: center;
    padding: 20px;
    color: #555; /* Slightly darker for better contrast */
  }
  
  .link-button {
    background: none;
    border: none;
    color: #2196F3;
    text-decoration: underline;
    cursor: pointer;
    font-size: 14px;
  }
  
  .selected-funeral-home {
    margin-top: 20px;
    padding: 15px;
    background-color: #e8f5e9;
    border-radius: 4px;
    border-left: 4px solid #4CAF50;
  }
  
  .selected-funeral-home h3 {
    color: #333; /* Ensure heading text is dark */
  }
  
  .selected-details p {
    margin: 5px 0;
    color: #333; /* Ensure selected details text is dark */
  }
  
  .error-message {
    color: #f44336;
    margin: 15px 0;
    padding: 15px;
    border-radius: 4px;
    border-left: 4px solid #f44336;
    background-color: rgba(244, 67, 54, 0.1);
    display: flex;
    align-items: flex-start;
  }
  
  .warning-message {
    color: #ff9800;
    margin: 15px 0;
    padding: 15px;
    border-radius: 4px;
    border-left: 4px solid #ff9800;
    background-color: rgba(255, 152, 0, 0.1);
    display: flex;
    align-items: flex-start;
  }
  
  .error-icon, .warning-icon {
    font-size: 1.5rem;
    margin-right: 10px;
    padding-top: 2px;
  }
  
  .error-content, .warning-content {
    flex: 1;
  }
  
  .validation-errors-list {
    margin-top: 10px;
    padding-left: 20px;
    font-size: 14px;
    color: #f44336; /* Ensure validation errors are visible */
  }
  
  .form-actions {
    text-align: center;
    margin-top: 30px;
  }
  
  .submit-button {
    background-color: #4CAF50;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    width: 100%;
    max-width: 400px;
    margin-bottom: 15px;
  }
  
  .submit-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .login-link {
    display: block;
    margin-top: 10px;
    color: #2196F3;
    text-decoration: none;
  }
  
  .login-link:hover {
    text-decoration: underline;
  }
  
  .success-message {
    color: #4CAF50;
    margin: 20px 0;
    padding: 20px;
    border: 1px solid #4CAF50;
    border-radius: 4px;
    text-align: center;
    background-color: #e8f5e9;
  }
  
  .user-info {
    background-color: #f8f8f8;
    border-radius: 4px;
    padding: 15px;
    margin-top: 15px;
    text-align: left;
    color: #333; /* Ensure user info text is dark */
  }
  
  .role-info {
    margin-top: 10px;
  }
  
  .role-badge {
    background-color: #4CAF50;
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.9em;
  }
  
  .funeral-home-info {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
  }
  
  .funeral-home-info h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.1em;
    color: #555;
  }
  
  .funeral-home-info p {
    margin: 5px 0;
  }
  
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(76, 175, 80, 0.3);
    border-radius: 50%;
    border-top-color: #4CAF50;
    animation: spin 0.8s ease infinite;
    margin-right: 0.5rem;
    vertical-align: middle;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .redirect-message {
    margin-top: 15px;
    font-size: 16px;
    color: #555; /* Slightly darker for better contrast */
  }
</style>