<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  
  // Define the type for form errors
  interface FormErrors {
    directorsFirstName?: string;
    directorsLastName?: string;
    funeralHomeName?: string;
    funeralHomeAddress?: string;
    lovedOnesFullName?: string;
    lovedOnesDOB?: string;
    lovedOnesDateOfPassing?: string;
    usersFullName?: string;
    usersEmailAddress?: string;
    usersDOB?: string;
    usersPhoneNumber?: string;
    memorialLocationName?: string;
    memorialLocationAddress?: string;
    memorialStartTime?: string;
    memorialDate?: string;
    [key: string]: string | undefined;
  }
  
  // Form state using Svelte 5 runes
  let directorsFirstName = $state('');
  let directorsLastName = $state('');
  let funeralHomeName = $state('');
  let funeralHomeAddress = $state('');
  let lovedOnesFullName = $state('');
  let lovedOnesDOB = $state('');
  let lovedOnesDateOfPassing = $state('');
  let usersFullName = $state('');
  let usersEmailAddress = $state('');
  let usersDOB = $state('');
  let usersPhoneNumber = $state('');
  let memorialLocationName = $state('');
  let memorialLocationAddress = $state('');
  let memorialStartTime = $state('');
  let memorialDate = $state('');
  
  let isSubmitting = $state(false);
  let formErrors = $state<FormErrors>({});
  
  // Validation state
  let formValid = $derived(
    directorsFirstName.trim() !== '' &&
    directorsLastName.trim() !== '' &&
    funeralHomeName.trim() !== '' &&
    funeralHomeAddress.trim() !== '' &&
    lovedOnesFullName.trim() !== '' &&
    usersFullName.trim() !== '' &&
    usersEmailAddress.trim() !== '' &&
    usersPhoneNumber.trim() !== '' &&
    validateEmail(usersEmailAddress)
  );
  
  // Email validation function
  function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email.trim() === '' || regex.test(email);
  }
  
  // Handle form submission with enhanced form
  function handleSubmit(): boolean {
    console.log('🚀 Submitting funeral director form');
    
    // Reset errors
    formErrors = {};
    
    // Client-side validation
    if (!formValid) {
      console.log('❌ Form validation failed');
      
      // Set specific error messages
      if (!directorsFirstName.trim()) formErrors.directorsFirstName = 'Director\'s first name is required';
      if (!directorsLastName.trim()) formErrors.directorsLastName = 'Director\'s last name is required';
      if (!funeralHomeName.trim()) formErrors.funeralHomeName = 'Funeral home name is required';
      if (!funeralHomeAddress.trim()) formErrors.funeralHomeAddress = 'Funeral home address is required';
      if (!lovedOnesFullName.trim()) formErrors.lovedOnesFullName = 'Loved one\'s full name is required';
      if (!usersFullName.trim()) formErrors.usersFullName = 'User\'s full name is required';
      if (!usersEmailAddress.trim()) formErrors.usersEmailAddress = 'User\'s email address is required';
      if (!validateEmail(usersEmailAddress)) formErrors.usersEmailAddress = 'Please enter a valid email address';
      if (!usersPhoneNumber.trim()) formErrors.usersPhoneNumber = 'User\'s phone number is required';
      
      return false;
    }
    
    return true;
  }
</script>

<div class="funeral-director-container">
  <h1>Funeral Director Portal</h1>
  <p class="subtitle">Create a new tribute for a family</p>
  
  {#if page.form?.success}
    <div class="success-message">
      <h2>🎉 Tribute created successfully!</h2>
      <p>The tribute is now available at: <a href="/tribute/{page.form.slug}">{page.form.slug}</a></p>
      <p>An account has been created for the family contact with the provided email address.</p>
      <a href="/funeral-director" class="button">Create another tribute</a>
    </div>
  {:else}
    {#if page.form?.error}
      <div class="error-message">
        <p>❌ {page.form.error}</p>
      </div>
    {/if}
    
    <form 
      method="POST" 
      action="?/createTribute" 
      on:submit|preventDefault={() => handleSubmit()}
      use:enhance={() => {
        isSubmitting = true;
        
        return async ({ result }) => {
          isSubmitting = false;
          
          if (result.type === 'success' && result.data?.success) {
            console.log('✅ Tribute created successfully');
          } else if (result.type === 'failure') {
            console.log('❌ Form submission failed', result.data);
            formErrors = { ...formErrors, ...result.data?.errors || {} };
          }
        };
      }}
    >
      <div class="form-section">
        <h2>Funeral Director Information</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="directorsFirstName">
              First Name <span class="required">*</span>
            </label>
            <input
              type="text"
              id="directorsFirstName"
              name="directorsFirstName"
              bind:value={directorsFirstName}
              placeholder="Enter your first name"
              class:error={formErrors.directorsFirstName}
              disabled={isSubmitting}
              required
            />
            {#if formErrors.directorsFirstName}
              <p class="input-error">{formErrors.directorsFirstName}</p>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="directorsLastName">
              Last Name <span class="required">*</span>
            </label>
            <input
              type="text"
              id="directorsLastName"
              name="directorsLastName"
              bind:value={directorsLastName}
              placeholder="Enter your last name"
              class:error={formErrors.directorsLastName}
              disabled={isSubmitting}
              required
            />
            {#if formErrors.directorsLastName}
              <p class="input-error">{formErrors.directorsLastName}</p>
            {/if}
          </div>
        </div>
        
        <div class="form-group">
          <label for="funeralHomeName">
            Funeral Home Name <span class="required">*</span>
          </label>
          <input
            type="text"
            id="funeralHomeName"
            name="funeralHomeName"
            bind:value={funeralHomeName}
            placeholder="Enter funeral home name"
            class:error={formErrors.funeralHomeName}
            disabled={isSubmitting}
            required
          />
          {#if formErrors.funeralHomeName}
            <p class="input-error">{formErrors.funeralHomeName}</p>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="funeralHomeAddress">
            Funeral Home Address <span class="required">*</span>
          </label>
          <input
            type="text"
            id="funeralHomeAddress"
            name="funeralHomeAddress"
            bind:value={funeralHomeAddress}
            placeholder="Enter funeral home address"
            class:error={formErrors.funeralHomeAddress}
            disabled={isSubmitting}
            required
          />
          {#if formErrors.funeralHomeAddress}
            <p class="input-error">{formErrors.funeralHomeAddress}</p>
          {/if}
        </div>
      </div>
      
      <div class="form-section">
        <h2>Loved One's Information</h2>
        
        <div class="form-group">
          <label for="lovedOnesFullName">
            Full Name <span class="required">*</span>
          </label>
          <input
            type="text"
            id="lovedOnesFullName"
            name="lovedOnesFullName"
            bind:value={lovedOnesFullName}
            placeholder="Enter loved one's full name"
            class:error={formErrors.lovedOnesFullName}
            disabled={isSubmitting}
            required
          />
          {#if formErrors.lovedOnesFullName}
            <p class="input-error">{formErrors.lovedOnesFullName}</p>
          {/if}
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="lovedOnesDOB">
              Date of Birth
            </label>
            <input
              type="date"
              id="lovedOnesDOB"
              name="lovedOnesDOB"
              bind:value={lovedOnesDOB}
              class:error={formErrors.lovedOnesDOB}
              disabled={isSubmitting}
            />
            {#if formErrors.lovedOnesDOB}
              <p class="input-error">{formErrors.lovedOnesDOB}</p>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="lovedOnesDateOfPassing">
              Date of Passing
            </label>
            <input
              type="date"
              id="lovedOnesDateOfPassing"
              name="lovedOnesDateOfPassing"
              bind:value={lovedOnesDateOfPassing}
              class:error={formErrors.lovedOnesDateOfPassing}
              disabled={isSubmitting}
            />
            {#if formErrors.lovedOnesDateOfPassing}
              <p class="input-error">{formErrors.lovedOnesDateOfPassing}</p>
            {/if}
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Family Contact Information</h2>
        <p class="section-note">This person will be registered as the tribute administrator</p>
        
        <div class="form-group">
          <label for="usersFullName">
            Full Name <span class="required">*</span>
          </label>
          <input
            type="text"
            id="usersFullName"
            name="usersFullName"
            bind:value={usersFullName}
            placeholder="Enter family contact's full name"
            class:error={formErrors.usersFullName}
            disabled={isSubmitting}
            required
          />
          {#if formErrors.usersFullName}
            <p class="input-error">{formErrors.usersFullName}</p>
          {/if}
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="usersEmailAddress">
              Email Address <span class="required">*</span>
            </label>
            <input
              type="email"
              id="usersEmailAddress"
              name="usersEmailAddress"
              bind:value={usersEmailAddress}
              placeholder="Enter email address"
              class:error={formErrors.usersEmailAddress}
              disabled={isSubmitting}
              required
            />
            {#if formErrors.usersEmailAddress}
              <p class="input-error">{formErrors.usersEmailAddress}</p>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="usersPhoneNumber">
              Phone Number <span class="required">*</span>
            </label>
            <input
              type="tel"
              id="usersPhoneNumber"
              name="usersPhoneNumber"
              bind:value={usersPhoneNumber}
              placeholder="Enter phone number"
              class:error={formErrors.usersPhoneNumber}
              disabled={isSubmitting}
              required
            />
            {#if formErrors.usersPhoneNumber}
              <p class="input-error">{formErrors.usersPhoneNumber}</p>
            {/if}
          </div>
        </div>
        
        <div class="form-group">
          <label for="usersDOB">
            Date of Birth
          </label>
          <input
            type="date"
            id="usersDOB"
            name="usersDOB"
            bind:value={usersDOB}
            class:error={formErrors.usersDOB}
            disabled={isSubmitting}
          />
          {#if formErrors.usersDOB}
            <p class="input-error">{formErrors.usersDOB}</p>
          {/if}
        </div>
      </div>
      
      <div class="form-section">
        <h2>Memorial Service Information (Optional)</h2>
        
        <div class="form-group">
          <label for="memorialLocationName">
            Location Name
          </label>
          <input
            type="text"
            id="memorialLocationName"
            name="memorialLocationName"
            bind:value={memorialLocationName}
            placeholder="Enter memorial location name"
            class:error={formErrors.memorialLocationName}
            disabled={isSubmitting}
          />
          {#if formErrors.memorialLocationName}
            <p class="input-error">{formErrors.memorialLocationName}</p>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="memorialLocationAddress">
            Location Address
          </label>
          <input
            type="text"
            id="memorialLocationAddress"
            name="memorialLocationAddress"
            bind:value={memorialLocationAddress}
            placeholder="Enter memorial location address"
            class:error={formErrors.memorialLocationAddress}
            disabled={isSubmitting}
          />
          {#if formErrors.memorialLocationAddress}
            <p class="input-error">{formErrors.memorialLocationAddress}</p>
          {/if}
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="memorialDate">
              Date
            </label>
            <input
              type="date"
              id="memorialDate"
              name="memorialDate"
              bind:value={memorialDate}
              class:error={formErrors.memorialDate}
              disabled={isSubmitting}
            />
            {#if formErrors.memorialDate}
              <p class="input-error">{formErrors.memorialDate}</p>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="memorialStartTime">
              Start Time
            </label>
            <input
              type="time"
              id="memorialStartTime"
              name="memorialStartTime"
              bind:value={memorialStartTime}
              class:error={formErrors.memorialStartTime}
              disabled={isSubmitting}
            />
            {#if formErrors.memorialStartTime}
              <p class="input-error">{formErrors.memorialStartTime}</p>
            {/if}
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button
          type="submit"
          class="button"
          disabled={isSubmitting || !formValid}
        >
          {#if isSubmitting}
            <span class="spinner"></span> Creating...
          {:else}
            Create Tribute
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .funeral-director-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    color: #333;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  
  .subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 2rem;
  }
  
  .form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  
  .form-section h2 {
    font-size: 1.25rem;
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 0.5rem;
  }
  
  .section-note {
    font-size: 0.9rem;
    color: #666;
    margin-top: -0.5rem;
    margin-bottom: 1rem;
    font-style: italic;
  }
  
  .form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .form-row {
      flex-direction: column;
      gap: 0;
    }
  }
  
  .form-group {
    margin-bottom: 1.5rem;
    flex: 1;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  
  .required {
    color: #e53935;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
  
  input.error {
    border-color: #e53935;
    background-color: rgba(229, 57, 53, 0.05);
  }
  
  .input-error {
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }
  
  .form-actions {
    margin-top: 2rem;
    text-align: center;
  }
  
  .button {
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }
  
  .button:hover {
    background-color: #1976d2;
  }
  
  .button:disabled {
    background-color: #90caf9;
    cursor: not-allowed;
  }
  
  .success-message {
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .success-message h2 {
    color: #2e7d32;
    margin-top: 0;
    font-size: 1.5rem;
  }
  
  .success-message p {
    margin-bottom: 1rem;
  }
  
  .success-message a {
    color: #2196f3;
    text-decoration: none;
    font-weight: 600;
  }
  
  .success-message a:hover {
    text-decoration: underline;
  }
  
  .success-message .button {
    margin-top: 1rem;
  }
  
  .error-message {
    background-color: #ffebee;
    border-left: 4px solid #e53935;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .error-message p {
    color: #c62828;
    margin: 0;
  }
  
  /* Loading spinner */
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>