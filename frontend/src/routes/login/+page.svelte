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

<div class="container h-auto mx-auto max-w-md p-4">
  <h1 class="h1 mb-4">Login</h1>
  
  {#if success}
    <div class="card variant-filled-success p-4">
      <h2 class="h2">Login successful! 🎉</h2>
      {#if userData}
        <div class="card p-4 variant-soft mt-4">
          <p>Welcome back, <strong>{userData.username}</strong>!</p>
          {#if userData.email}
            <p>Email: {userData.email}</p>
          {/if}
        </div>
      {:else}
        <p>Welcome back!</p>
      {/if}
      <p class="mt-4 text-sm">
        {#if redirecting}
          <span class="badge-icon"><i class="fa-solid fa-spinner fa-spin-pulse"></i></span>
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
      <div class="alert variant-filled-warning mb-4">
        <span class="badge-icon">⚠️</span>
        <p>
          You need <strong>{formattedRequiredRoles}</strong> permissions to access the requested page.
        </p>
        <p class="text-sm mt-2">
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
    }} class="card p-4 variant-soft space-y-4">
      <div class="form-group">
        <label class="label" for="username">
          <span>Username/Email</span>
          <input
            class="input"
            type="text"
            id="username"
            name="username"
            value={form?.username ?? ''}
            required
            autocomplete="username"
          />
        </label>
      </div>

      <div class="form-group">
        <label class="label" for="password">
          <span>Password</span>
          <input
            class="input"
            type="password"
            id="password"
            name="password"
            required
            autocomplete="current-password"
          />
        </label>
      </div>

      {#if form?.error}
        <div class="alert {isConnectionError ? 'variant-filled-warning' : form.error.includes('Invalid format') ? 'variant-filled-tertiary' : 'variant-filled-error'}">
          <div class="flex items-center">
            {#if isConnectionError}
              <span class="mr-2">🔌</span>
            {:else if form.error.includes('Invalid format')}
              <span class="mr-2">⚠️</span>
            {:else}
              <span class="mr-2">❌</span>  
            {/if}
            <strong>{form.error}</strong>
          </div>
          
          {#if isConnectionError}
            <div class="mt-2 text-sm">
              <p>The authentication service is currently unavailable. This could be due to:</p>
              <ul class="list-disc list-inside ml-2 my-2">
                <li>Server maintenance</li>
                <li>Network connectivity issues</li>
                <li>Temporary service outage</li>
              </ul>
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
          {:else if form.error.includes('Invalid format')}
            <div class="mt-2 text-sm">
              <p>There was a problem with the login request format. Please try:</p>
              <ul class="list-disc list-inside ml-2 my-2">
                <li>Checking your username/email format</li>
                <li>Using only alphanumeric characters in your password</li>
                <li>Clearing your browser cache and cookies</li>
              </ul>
            </div>
          {/if}
        </div>
      {/if}

      <button type="submit" class="btn variant-filled-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      
      <div class="card-footer border-t border-surface-200/30 pt-4 mt-4">
        <p class="text-center mb-4">Don't have an account?</p>
        <div class="flex flex-col md:flex-row gap-2 justify-center">
          <a href="/register" class="btn variant-soft-primary">
            Register as Family Member
          </a>
          <a href="/funeral-director-registration" class="btn variant-soft-tertiary">
            Register as Funeral Director
          </a>
        </div>
      </div>
    </form>
  {/if}
</div>