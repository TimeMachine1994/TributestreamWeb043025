<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { getRoleDisplayName } from '$lib/auth';
  import type { ActionData } from './$types';
  
  // Define props with runes
  let { form } = $props<{ form: ActionData & { redirectTo?: string; connectionError?: boolean } }>();
  
  // Form state using runes
  let isSubmitting = $state(false);
  let retryCount = $state(0);
  
  // Derived states
  let success = $derived(form?.success === true);
  let userData = $derived(form?.user || null);
  let redirecting = $state(false);
  let redirectTo = $derived(form?.redirectTo || '/family-dashboard');
  let isConnectionError = $derived(form?.connectionError === true);
  
  // Check for required role parameter
  let requiredRoleParam = $derived(page.url.searchParams.get('required_role') || '');
  let requiredRoles = $derived(
    requiredRoleParam ? requiredRoleParam.split(',') : []
  );
  let formattedRequiredRoles = $derived(
    requiredRoles.map(role => getRoleDisplayName(role)).join(' or ')
  );
  let hasRoleMessage = $derived(!!requiredRoleParam);
  
  console.log("🔄 Login form data updated:", form);
  console.log("🔑 Required role check:", { requiredRoleParam, hasRoleMessage });
  
  // Handle successful login with role-based redirect
  $effect(() => {
    if (success && !redirecting) {
      redirecting = true;
      console.log("🚀 Login successful, redirecting to:", redirectTo);
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);
    }
  });
</script>

<div class="login-container">
  <h1>Login</h1>
  
  {#if success}
    <div class="success-message">
      <h2>Login successful! 🎉</h2>
      {#if userData}
        <div class="user-info">
          <p>Welcome back, <strong>{userData.username}</strong>!</p>
          {#if userData.email}
            <p>Email: {userData.email}</p>
          {/if}
        </div>
      {:else}
        <p>Welcome back!</p>
      {/if}
      <p class="redirect-message">
        {#if redirecting}
          <span class="spinner"></span>
          {#if redirectTo.includes('fd-dashboard')}
            Redirecting to Funeral Director dashboard...
          {:else}
            Redirecting to Family dashboard...
          {/if}
        {/if}
      </p>
    </div>
  {:else}
    {#if hasRoleMessage}
      <div class="role-message">
        <p>
          <span class="role-icon">⚠️</span>
          You need <strong>{formattedRequiredRoles}</strong> permissions to access the requested page.
        </p>
        <p class="role-info">
          Please log in with an account that has the required permissions.
        </p>
      </div>
    {/if}
    
    <form method="POST" use:enhance={() => {
      isSubmitting = true;
      
      return async ({ result }) => {
        isSubmitting = false;
        console.log("🏁 Login process completed", result);
      };
    }}>
      <div class="form-group">
        <label for="username">Username/Email</label>
        <input
          type="text"
          id="username"
          name="username"
          value={form?.username ?? ''}
          required
          autocomplete="username"
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autocomplete="current-password"
        />
      </div>

      {#if form?.error}
        <div class="error-message" class:connection-error={isConnectionError} class:validation-error={form.error.includes('Invalid format')}>
          {#if isConnectionError}
            <div class="error-icon">🔌</div>
          {:else if form.error.includes('Invalid format')}
            <div class="error-icon">⚠️</div>
          {:else}
            <div class="error-icon">❌</div>
          {/if}
          <div class="error-content">
            <strong>{form.error}</strong>
            
            {#if isConnectionError}
              <div class="error-details">
                <p>The authentication service is currently unavailable. This could be due to:</p>
                <ul>
                  <li>Server maintenance</li>
                  <li>Network connectivity issues</li>
                  <li>Temporary service outage</li>
                </ul>
                <p>Please try again later or contact support if the problem persists.</p>
              </div>
            {:else if form.error.includes('Invalid format')}
              <div class="error-details">
                <p>There was a problem with the login request format. Please try:</p>
                <ul>
                  <li>Checking your username/email format</li>
                  <li>Using only alphanumeric characters in your password</li>
                  <li>Clearing your browser cache and cookies</li>
                </ul>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      
      <div class="registration-options">
        <p>Don't have an account?</p>
        <div class="registration-buttons">
          <a href="/register" class="register-button family">
            Register as Family Member
          </a>
          <a href="/funeral-director-registration" class="register-button funeral-director">
            Register as Funeral Director
          </a>
        </div>
      </div>
    </form>
  {/if}
</div>

<style>
  .login-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error-message {
    color: #f44336;
    margin: 10px 0;
    padding: 10px;
    border-radius: 4px;
    border-left: 4px solid #f44336;
    background-color: rgba(244, 67, 54, 0.1);
    display: flex;
    align-items: flex-start;
  }
  
  .connection-error {
    color: #ff9800;
    border-left-color: #ff9800;
    background-color: rgba(255, 152, 0, 0.1);
  }
  
  .validation-error {
    color: #9c27b0;
    border-left-color: #9c27b0;
    background-color: rgba(156, 39, 176, 0.1);
  }
  
  .error-icon {
    font-size: 1.5rem;
    margin-right: 10px;
    padding-top: 2px;
  }
  
  .error-content {
    flex: 1;
  }
  
  .error-details {
    font-size: 0.9rem;
    margin-top: 8px;
    color: #666;
  }
  
  .error-details ul {
    margin-top: 5px;
    margin-bottom: 5px;
    padding-left: 20px;
  }

  .success-message {
    color: #4CAF50;
    margin: 10px 0;
    padding: 15px;
    border: 1px solid #4CAF50;
    border-radius: 4px;
    text-align: center;
  }
  
  .user-info {
    background-color: #f8f8f8;
    border-radius: 4px;
    padding: 10px;
    margin-top: 10px;
    text-align: left;
  }
  
  h2 {
    margin-top: 0;
  }
  
  /* Loading spinner */
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
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .role-message {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    color: #856404;
  }
  
  .role-icon {
    font-size: 1.2rem;
    margin-right: 8px;
    vertical-align: middle;
  }
  
  .role-info {
    margin-top: 8px;
    font-size: 0.9rem;
    color: #666;
  }
  /* Registration options */
  .registration-options {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
  }
  
  .registration-options p {
    margin-bottom: 10px;
    color: #666;
  }
  
  .registration-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .register-button {
    padding: 10px 15px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .register-button.family {
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
  }
  
  .register-button.family:hover {
    background-color: #bbdefb;
  }
  
  .register-button.funeral-director {
    background-color: #f3e5f5;
    color: #9c27b0;
    border: 1px solid #e1bee7;
  }
  
  .register-button.funeral-director:hover {
    background-color: #e1bee7;
  }
  
  @media (min-width: 480px) {
    .registration-buttons {
      flex-direction: row;
      justify-content: center;
    }
  }
</style>