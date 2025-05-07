<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Input, Button, Card, Alert } from '@skeletonlabs/skeleton';

  // Define props with runes
  let { data } = $props<{ data: { tributes: any[], searchTerm: string } }>();
  
  // State for search
  let searchTerm = $state(data.searchTerm || '');
  let isSearching = $state(false);
  let errorMessage = $state('');
  
  // Function to handle search
  async function handleSearch() {
    console.log('🔍 Searching for tribute:', searchTerm);
    if (!searchTerm.trim()) {
      errorMessage = 'Please enter a name to search';
      return;
    }
    
    isSearching = true;
    errorMessage = '';
    
    // Navigate to the same page with updated search parameter
    goto(`/search?name=${encodeURIComponent(searchTerm)}`);
  }
  
  console.log("🔍 Search page loaded", { 
    searchTerm: data.searchTerm,
    resultsCount: data.tributes?.length || 0
  });
</script>

<div class="container-xl mx-auto p-4 space-y-8">
  <section class="space-y-4">
    <h1 class="h1 text-center">Search Tributes</h1>
    
    <div class="card p-4 max-w-3xl mx-auto">
      <div class="input-group input-group-divider grid-cols-[1fr_auto]">
        <Input
          type="text"
          placeholder="Enter your loved one's full name"
          bind:value={searchTerm}
        />
        <Button 
          type="button" 
          color="primary" 
          on:click={handleSearch} 
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {#if errorMessage}
        <div class="mt-4">
          <Alert variant="filled" color="error">{errorMessage}</Alert>
        </div>
      {/if}
    </div>
    
    <div class="space-y-4">
      <h2 class="h2">Search Results for "{data.searchTerm}"</h2>
      
      {#if data.tributes && data.tributes.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each data.tributes as tribute}
            <Card padding="lg" hover="true" class="transition-all">
              <header class="card-header text-center">
                <h3 class="h3">{tribute.attributes?.name || tribute.name}</h3>
                <p class="opacity-70">
                  {new Date(tribute.attributes?.createdAt || tribute.createdAt).toLocaleDateString()}
                </p>
              </header>
              <footer class="card-footer text-center pt-4">
                <a href="/tribute/{tribute.attributes?.slug || tribute.slug}" class="btn variant-ghost-surface">
                  View Tribute
                </a>
              </footer>
            </Card>
          {/each}
        </div>
      {:else if data.searchTerm}
        <div class="card variant-ghost p-8 text-center">
          <p class="mb-4">No tributes found for "{data.searchTerm}"</p>
          <p>Would you like to <a href="/" class="anchor">create a tribute</a> for {data.searchTerm}?</p>
        </div>
      {/if}
    </div>
  </section>
</div>