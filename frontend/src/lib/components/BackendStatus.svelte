<!--
  BackendStatus Component
  
  This component initializes the backend availability checker and displays
  a status message when the backend is unavailable. It also provides a
  retry button to manually check the backend availability.
-->
<script>
  import { onMount } from 'svelte';
  import { backendStatus, initBackendChecker, forceCheckBackendAvailability } from '$lib/backendChecker';
  import config from '$lib/config';
  
  // Local state
  let isRetrying = $state(false);
  
  // Initialize the backend checker on mount
  onMount(() => {
    if (config.features.enableBackendCheck) {
      initBackendChecker();
    }
  });
  
  // Handle retry button click
  async function handleRetry() {
    isRetrying = true;
    await forceCheckBackendAvailability();
    isRetrying = false;
  }
</script>

{#if $backendStatus && !$backendStatus.available}
  <div class="backend-status-alert" role="alert">
    <div class="alert-content">
      <div class="alert-icon">⚠️</div>
      <div class="alert-message">
        <strong>Backend Connection Issue</strong>
        <p>{$backendStatus.error || 'Cannot connect to the backend service'}</p>
        <div class="alert-tips">
          <strong>Troubleshooting Tips:</strong>
          <ul>
            <li>Check if the backend server is running</li>
            <li>Verify your network connection</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
      <button
        class="retry-button"
        onclick={handleRetry}
        disabled={isRetrying || $backendStatus.retryScheduled}
      >
        {#if isRetrying}
          <span class="spinner"></span> Retrying...
        {:else if $backendStatus.retryScheduled}
          Retrying soon...
        {:else}
          Retry Now
        {/if}
      </button>
    </div>
    
    {#if $backendStatus.retryScheduled}
      <div class="retry-info">
        Automatic retry in progress (attempt {$backendStatus.retryCount}/{config.api.maxRetries})
      </div>
    {/if}
  </div>
{/if}

<style>
  .backend-status-alert {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #fff3cd;
    color: #856404;
    border-bottom: 1px solid #ffeeba;
    padding: 0.75rem 1.25rem;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .alert-content {
    display: flex;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .alert-icon {
    font-size: 1.5rem;
    margin-right: 1rem;
  }
  
  .alert-message {
    flex: 1;
  }
  
  .alert-message p {
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
  }
  
  .retry-button {
    background-color: #856404;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .retry-button:hover:not(:disabled) {
    background-color: #6d5204;
  }
  
  .retry-button:disabled {
    background-color: #c5b36b;
    cursor: not-allowed;
  }
  
  .retry-info {
    text-align: center;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    color: #856404;
  }
  
  .alert-tips {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    padding-top: 0.5rem;
    border-top: 1px dashed rgba(133, 100, 4, 0.3);
  }
  
  .alert-tips ul {
    margin: 0.25rem 0 0 0;
    padding-left: 1.5rem;
  }
  
  .alert-tips li {
    margin-bottom: 0.25rem;
  }
  
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