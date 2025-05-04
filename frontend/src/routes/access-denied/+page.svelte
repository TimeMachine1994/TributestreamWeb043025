<script lang="ts">
  import { page } from '$app/state';
  import { getRoleDisplayName } from '$lib/auth';
  
  // Get the required role from the URL query parameter
  let requiredRoleParam = $derived(page.url.searchParams.get('required') || '');
  
  // Parse the required roles (could be a comma-separated list)
  let requiredRoles = $derived(
    requiredRoleParam ? requiredRoleParam.split(',') : []
  );
  
  // Format the required roles for display
  let formattedRoles = $derived(
    requiredRoles.map(role => getRoleDisplayName(role)).join(' or ')
  );
  
  // Get the current user's role
  let currentUserRole = $derived(
    page.data.user?.role?.type 
      ? getRoleDisplayName(page.data.user.role.type) 
      : 'Guest'
  );
  
  console.log('🚫 Access denied page loaded', { 
    requiredRoles, 
    currentUserRole 
  });
</script>

<div class="access-denied-container">
  <div class="access-denied-card">
    <div class="icon-container">
      <span class="access-denied-icon">🔒</span>
    </div>
    
    <h1>Access Denied</h1>
    
    <div class="message">
      <p>
        You don't have the required permissions to access this page.
      </p>
      
      {#if requiredRoles.length > 0}
        <div class="role-info">
          <p>
            <strong>Required role:</strong> {formattedRoles}
          </p>
          <p>
            <strong>Your current role:</strong> {currentUserRole}
          </p>
        </div>
      {/if}
    </div>
    
    <div class="actions">
      <a href="/" class="button primary">Return to Home</a>
      <a href="mailto:support@tributestream.com" class="button secondary">Contact Administrator</a>
    </div>
  </div>
</div>

<style>
  .access-denied-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 2rem;
  }
  
  .access-denied-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    text-align: center;
  }
  
  .icon-container {
    margin-bottom: 1rem;
  }
  
  .access-denied-icon {
    font-size: 4rem;
    color: #e74c3c;
  }
  
  h1 {
    color: #e74c3c;
    margin-bottom: 1.5rem;
  }
  
  .message {
    margin-bottom: 2rem;
    color: #555;
    font-size: 1.1rem;
  }
  
  .role-info {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 6px;
    text-align: left;
  }
  
  .actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
    transition: background-color 0.2s, transform 0.1s;
  }
  
  .button:hover {
    transform: translateY(-2px);
  }
  
  .primary {
    background-color: #3498db;
    color: white;
  }
  
  .primary:hover {
    background-color: #2980b9;
  }
  
  .secondary {
    background-color: #ecf0f1;
    color: #34495e;
  }
  
  .secondary:hover {
    background-color: #bdc3c7;
  }
  
  @media (min-width: 768px) {
    .actions {
      flex-direction: row;
      justify-content: center;
    }
  }
</style>