<script lang="ts">
  import { page } from '$app/state';
  import { getUser, isAuthenticated, getUserRole, getUserRoleDisplay } from '$lib/state/auth.svelte';
  import { status as backendStatus } from '$lib/state/backend.svelte';
  import { getTributes, getLoading, getError, fetchTributes, createTribute } from '$lib/api/tributes.svelte';
  
  // Local state using runes
  let searchTerm = $state('');
  let newTributeName = $state('');
  let newTributeDescription = $state('');
  let isCreating = $state(false);
  let createError = $state<string | null>(null);
  
  // Derived values
  let filteredTributes = $derived(
    searchTerm
      ? getTributes().filter(tribute =>
          tribute.attributes.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : getTributes()
  );
  
  let sortedTributes = $derived(
    [...filteredTributes].sort((a, b) => 
      a.attributes.name.localeCompare(b.attributes.name)
    )
  );
  
  let tributeCount = $derived(getTributes().length);
  let filteredCount = $derived(filteredTributes.length);
  let isFiltering = $derived(searchTerm.length > 0);
  let formIsValid = $derived(
    newTributeName.length >= 3 && 
    newTributeDescription.length > 0 &&
    newTributeDescription.length <= 500
  );
  
  // Effects
  $effect(() => {
    console.log('🔄 Effect running: Tribute count changed to', tributeCount);
  });
  
  $effect(() => {
    if (searchTerm) {
      console.log(`🔍 Filtering tributes with term: "${searchTerm}"`);
    }
  });
  
  // Load tributes on mount
  $effect(() => {
    loadTributes();
  });
  
  // Methods
  async function loadTributes() {
    console.log('📚 Loading tributes');
    
    // Get JWT from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='))
      ?.split('=')[1];
      
    if (!token) {
      console.error('🔒 No JWT token found');
      return;
    }
    
    await fetchTributes(token);
    console.log(`✅ Loaded ${getTributes().length} tributes`);
  }
  
  async function handleCreateTribute() {
    if (!formIsValid || isCreating) return;
    
    isCreating = true;
    createError = null;
    console.log('🆕 Creating new tribute:', newTributeName);
    
    try {
      // Get JWT from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        ?.split('=')[1];
        
      if (!token) {
        throw new Error('No JWT token found');
      }
      
      const result = await createTribute({
        name: newTributeName,
        description: newTributeDescription
      }, token);
      
      if (result) {
        console.log('✅ Tribute created successfully:', result.id);
        // Reset form
        newTributeName = '';
        newTributeDescription = '';
      } else {
        createError = 'Failed to create tribute';
      }
    } catch (err) {
      console.error('❌ Error creating tribute:', err);
      createError = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isCreating = false;
    }
  }
  
  function clearSearch() {
    searchTerm = '';
  }
</script>

<svelte:head>
  <title>Runes Demo | TributeStream</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
  <div class="bg-white shadow-md rounded-lg p-6 mb-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">Svelte 5 Runes Demo</h1>
    <p class="text-gray-600 mb-4">
      This page demonstrates the migration patterns for Svelte 5 runes with Strapi integration.
    </p>
    
    <!-- Authentication Status -->
    <div class="bg-gray-100 p-4 rounded-md mb-6">
      <h2 class="text-xl font-semibold mb-2">Authentication State</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p><span class="font-medium">Authenticated:</span> {isAuthenticated() ? '✅ Yes' : '❌ No'}</p>
          {#if isAuthenticated() && getUser()}
            <p><span class="font-medium">Username:</span> {getUser()?.username}</p>
            <p><span class="font-medium">Role:</span> {getUserRoleDisplay()}</p>
          {/if}
        </div>
        <div>
          <p><span class="font-medium">Backend Status:</span> {backendStatus.available ? '✅ Available' : '❌ Unavailable'}</p>
          {#if !backendStatus.available}
            <p class="text-red-600">{backendStatus.error}</p>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Create Tribute Form -->
    {#if isAuthenticated()}
      <div class="bg-blue-50 p-4 rounded-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Create New Tribute</h2>
        <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); handleCreateTribute(); }}>
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              bind:value={newTributeName}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter tribute name"
              required
              minlength="3"
            />
            {#if newTributeName && newTributeName.length < 3}
              <p class="mt-1 text-sm text-red-600">Name must be at least 3 characters</p>
            {/if}
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              bind:value={newTributeDescription}
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter tribute description"
              required
            ></textarea>
            {#if newTributeDescription && newTributeDescription.length > 500}
              <p class="mt-1 text-sm text-red-600">Description must be less than 500 characters</p>
            {/if}
          </div>
          
          <div>
            <button
              type="submit"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!formIsValid || isCreating}
            >
              {#if isCreating}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              {:else}
                Create Tribute
              {/if}
            </button>
          </div>
          
          {#if createError}
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {createError}
            </div>
          {/if}
        </form>
      </div>
    {/if}
    
    <!-- Tributes List -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Tributes</h2>
        <div class="relative">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search tributes..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {#if searchTerm}
            <button 
              onclick={clearSearch}
              class="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
      
      {#if getLoading()}
        <div class="flex justify-center py-8">
          <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      {:else if getError()}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p class="font-medium">Error loading tributes</p>
          <p>{getError()}</p>
          <button 
            onclick={loadTributes}
            class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      {:else if sortedTributes.length === 0}
        <div class="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
          {#if isFiltering}
            <p class="text-lg font-medium">No tributes match your search</p>
            <button 
              onclick={clearSearch}
              class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              Clear Search
            </button>
          {:else}
            <p class="text-lg font-medium">No tributes available</p>
            {#if isAuthenticated()}
              <p class="mt-1">Create your first tribute using the form above</p>
            {:else}
              <p class="mt-1">Please log in to create tributes</p>
            {/if}
          {/if}
        </div>
      {:else}
        <div class="mb-2 text-sm text-gray-500">
          {isFiltering ? `Showing ${filteredCount} of ${tributeCount} tributes` : `${tributeCount} tributes`}
        </div>
        <div class="bg-white border border-gray-200 rounded-md divide-y">
          {#each sortedTributes as tribute (tribute.id)}
            <div class="p-4 hover:bg-gray-50">
              <h3 class="text-lg font-medium text-gray-900">{tribute.attributes.name}</h3>
              <p class="mt-1 text-sm text-gray-600">
                {tribute.attributes.description || 'No description available'}
              </p>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ID: {tribute.id}
                </span>
                {#if tribute.attributes.createdAt}
                  <span class="ml-2">
                    Created: {new Date(tribute.attributes.createdAt).toLocaleDateString()}
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Reactive State Debug Panel -->
  <div class="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
    <h2 class="text-xl font-semibold mb-4">Reactive State Debug</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <h3 class="text-lg font-medium mb-2">Auth State</h3>
        <pre class="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
isAuthenticated: {isAuthenticated()}
userRole: {getUserRole()}
userRoleDisplay: {getUserRoleDisplay()}
        </pre>
      </div>
      <div>
        <h3 class="text-lg font-medium mb-2">Tributes State</h3>
        <pre class="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
tributeCount: {tributeCount}
filteredCount: {filteredCount}
isFiltering: {isFiltering}
loading: {getLoading()}
error: {getError()}
        </pre>
      </div>
      <div>
        <h3 class="text-lg font-medium mb-2">Form State</h3>
        <pre class="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
newTributeName: {newTributeName}
newTributeDescription: {newTributeDescription.substring(0, 30)}...
formIsValid: {formIsValid}
isCreating: {isCreating}
createError: {createError}
        </pre>
      </div>
      <div>
        <h3 class="text-lg font-medium mb-2">Backend State</h3>
        <pre class="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
available: {backendStatus.available}
lastChecked: {backendStatus.lastChecked?.toLocaleTimeString()}
retryCount: {backendStatus.retryCount}
retryScheduled: {backendStatus.retryScheduled}
        </pre>
      </div>
    </div>
  </div>
</div>