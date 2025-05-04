<script>
  // Import types and utilities
  import { page } from '$app/state';
  
  // Form state using Svelte 5 runes
  let name = $state('');
  let isSubmitting = $state(false);
  let success = $state(false);
  let error = $state('');
  let generatedSlug = $state('');
  
  // Validation state
  let nameError = $state('');
  let formValid = $state(false);
  
  // Update validation when name changes
  $effect(() => {
    if (name.trim() === '') {
      nameError = 'Name is required';
    } else if (name.length < 2) {
      nameError = 'Name must be at least 2 characters';
    } else if (name.length > 100) {
      nameError = 'Name must be less than 100 characters';
    } else {
      nameError = '';
    }
    
    formValid = nameError === '';
  });
  
  // Reset form and states
  function resetForm() {
    name = '';
    success = false;
    error = '';
    generatedSlug = '';
  }
  
  // Handle form submission
  async function handleSubmit() {
    console.log('🚀 Submitting tribute creation form');
    
    // Validate form
    if (!formValid) {
      console.log('❌ Form validation failed');
      return;
    }
    
    // Set loading state
    isSubmitting = true;
    error = '';
    
    try {
      console.log(`📝 Creating tribute with name: "${name}"`);
      
      // Submit to API
      const response = await fetch('/api/tributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      
      const result = await response.json();
      console.log('📊 API response:', result);
      
      if (result.success) {
        console.log('✅ Tribute created successfully');
        success = true;
        
        // Handle different possible response structures
        if (result.data?.attributes) {
          // Direct Strapi data
          generatedSlug = result.data.attributes.slug || '';
        } else if (result.data?.data?.attributes) {
          // Nested Strapi data structure
          generatedSlug = result.data.data.attributes.slug || '';
        }
        
        console.log(`🔗 Generated slug: ${generatedSlug}`);
        name = ''; // Reset the form
      } else {
        console.log('❌ Error creating tribute:', result.error);
        error = result.error || 'Failed to create tribute';
      }
    } catch (err) {
      console.error('💥 Exception during tribute creation:', err);
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="create-tribute-container">
  <h1>Create a New Tribute</h1>
  
  {#if success}
    <div class="success-message">
      <h2>🎉 Tribute created successfully!</h2>
      <p>Your tribute is now available at: <a href="/{generatedSlug}">{generatedSlug}</a></p>
      <button class="button" on:click={resetForm}>Create another tribute</button>
    </div>
  {:else}
    {#if error}
      <div class="error-message">
        <p>❌ {error}</p>
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">
          Tribute Name <span class="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          bind:value={name}
          placeholder="Enter tribute name"
          class:error={nameError !== ''}
          disabled={isSubmitting}
          required
        />
        {#if nameError !== ''}
          <p class="input-error">{nameError}</p>
        {/if}
      </div>
      
      <button
        type="submit"
        class="button"
        disabled={!formValid || isSubmitting}
      >
        {#if isSubmitting}
          <span class="spinner"></span> Creating...
        {:else}
          Create Tribute
        {/if}
      </button>
    </form>
  {/if}
</div>

<style>
  .create-tribute-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
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
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .success-message h2 {
    color: #2e7d32;
    margin-top: 0;
    font-size: 1.25rem;
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