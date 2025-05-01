<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  
  // Define props with runes
  let { form } = $props<{ form: ActionData }>();
  
  // Form state using runes
  let isSubmitting = $state(false);
  
  // Derived states
  let success = $derived(form?.success === true);
  let userData = $derived(form?.user || null);
  
  console.log("🔄 Form data updated:", form);
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
    </div>
  {:else}
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
        <div class="error-message">
          {form.error}
        </div>
      {/if}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
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
</style>
