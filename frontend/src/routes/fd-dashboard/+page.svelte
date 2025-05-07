<script lang="ts">
  import { page } from '$app/state';
  import { Card, Button } from '@skeletonlabs/skeleton';
  
  // Define props with runes
  let { data } = $props<{
    data: {
      authenticated: boolean;
      tributes: Array<{
        id: number;
        attributes: {
          name: string;
          slug: string;
          createdAt: string;
          updatedAt: string;
        }
      }>;
      error?: string;
      meta?: any;
      isFuneralDirector: boolean;
    }
  }>();
  
  // State variables
  let isLoading = $state(false);
  
  // Derived values
  let tributes = $derived(data.tributes || []);
  let hasError = $derived(!!data.error);
  let errorMessage = $derived(data.error || '');
  
  console.log("🎩 Funeral Director Dashboard loaded", { 
    tributesCount: tributes.length,
    hasError
  });
  
  // Format date for display
  function formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
</script>

<div class="container">
  <div class="space-y-10 p-4">
    <header class="border-b border-surface-300-600-token pb-5">
      <h1 class="h1 mb-2">Funeral Director Dashboard</h1>
      <p class="text-lg text-secondary-500">Welcome to your dedicated funeral director portal</p>
    </header>
    
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="p-5">
        <header class="card-header">
          <h3 class="h3">Active Tributes</h3>
        </header>
        <section class="p-4">
          <p class="h2 text-primary-500">{tributes.length}</p>
        </section>
      </Card>
      
      <Card padding="p-5">
        <header class="card-header">
          <h3 class="h3">Director Tools</h3>
        </header>
        <section class="p-4 flex-end gap-2">
          <a href="/createTribute" class="btn variant-filled-primary">Create New Tribute</a>
        </section>
      </Card>
    </section>
    
    {#if hasError}
      <div class="alert variant-filled-warning p-4">
        <h3 class="h3">⚠️ Error Loading Tributes</h3>
        <p>{errorMessage}</p>
        <div class="pt-4">
          <Button variant="soft" on:click={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    {/if}
    
    <section class="space-y-5">
      <header class="border-b border-surface-300-600-token pb-2">
        <h2 class="h2">Manage Tributes</h2>
      </header>
      
      {#if tributes.length === 0 && !hasError}
        <div class="card variant-soft-surface p-10 text-center">
          <p class="mb-4">No tributes found. Create your first tribute to get started.</p>
          <a href="/createTribute" class="btn variant-filled-primary">Create Tribute</a>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each tributes as tribute (tribute.id)}
            <Card class="card-hover">
              <header class="card-header p-4">
                <h3 class="h3">{tribute.attributes.name}</h3>
                <p class="text-sm text-secondary-500">Created: {formatDate(tribute.attributes.createdAt)}</p>
              </header>
              <footer class="card-footer p-4 flex flex-wrap gap-2">
                <a href="/tributes/{tribute.attributes.slug}" class="btn variant-soft btn-sm">View</a>
                <a href="/tributes/{tribute.attributes.slug}/edit" class="btn variant-filled-primary btn-sm">Edit</a>
                <Button type="button" variant="filled-error" size="sm">Delete</Button>
              </footer>
            </Card>
          {/each}
        </div>
      {/if}
    </section>
    
    <section class="space-y-5">
      <header class="border-b border-surface-300-600-token pb-2">
        <h2 class="h2">Funeral Director Tools</h2>
      </header>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card class="card-hover text-center">
          <header class="card-header flex-center p-4">
            <div class="text-5xl">📊</div>
          </header>
          <section class="p-4">
            <h3 class="h3 mb-2">Analytics</h3>
            <p class="text-secondary-500 mb-4">View tribute engagement statistics</p>
            <Button variant="soft">View Analytics</Button>
          </section>
        </Card>
        
        <Card class="card-hover text-center">
          <header class="card-header flex-center p-4">
            <div class="text-5xl">👪</div>
          </header>
          <section class="p-4">
            <h3 class="h3 mb-2">Family Management</h3>
            <p class="text-secondary-500 mb-4">Manage family contacts and permissions</p>
            <Button variant="soft">Manage Families</Button>
          </section>
        </Card>
        
        <Card class="card-hover text-center">
          <header class="card-header flex-center p-4">
            <div class="text-5xl">🔔</div>
          </header>
          <section class="p-4">
            <h3 class="h3 mb-2">Notifications</h3>
            <p class="text-secondary-500 mb-4">Configure and send notifications</p>
            <Button variant="soft">Notification Center</Button>
          </section>
        </Card>
        
        <Card class="card-hover text-center">
          <header class="card-header flex-center p-4">
            <div class="text-5xl">⚙️</div>
          </header>
          <section class="p-4">
            <h3 class="h3 mb-2">Settings</h3>
            <p class="text-secondary-500 mb-4">Configure your director account</p>
            <Button variant="soft">Account Settings</Button>
          </section>
        </Card>
      </div>
    </section>
  </div>
</div>