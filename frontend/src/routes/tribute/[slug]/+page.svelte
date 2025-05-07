<script lang="ts">
  // Define props with runes
  let { data } = $props<{ data: { tribute: any } }>();
  
  // Extract tribute data
  const tribute = data.tribute;
  const attributes = tribute.attributes || tribute;
  const name = attributes.name;
  const createdAt = new Date(attributes.createdAt || attributes.created_at).toLocaleDateString();
  
  console.log("📄 Tribute page loaded", { name, slug: attributes.slug });
</script>

<div class="container h-full mx-auto p-4">
  <section class="card p-4 mb-8">
    <header class="text-center p-8 border-b border-surface-300-border-token">
      <h1 class="h1 mb-4">{name}</h1>
      <p class="text-sm opacity-70">Created on {createdAt}</p>
    </header>
    
    <div class="p-8 border-b border-surface-300-border-token">
      <div class="mb-8">
        <h2 class="h2 mb-4">About {name}</h2>
        
        {#if attributes.description}
          <p class="text-lg">{attributes.description}</p>
        {:else}
          <p class="text-lg italic opacity-70">
            This tribute page is being set up. More information will be added soon.
          </p>
        {/if}
      </div>
      
      <div class="card p-6 variant-soft text-center">
        <h3 class="h3 mb-4">Contribute to this Tribute</h3>
        <div class="flex justify-center flex-wrap gap-4">
          <a href="/tribute/{attributes.slug}/photos" class="btn variant-soft">
            <span class="mr-2">🖼️</span> Add Photos
          </a>
          <a href="/tribute/{attributes.slug}/memories" class="btn variant-soft">
            <span class="mr-2">📝</span> Share Memories
          </a>
          <a href="/tribute/{attributes.slug}/timeline" class="btn variant-soft">
            <span class="mr-2">📅</span> Add to Timeline
          </a>
        </div>
      </div>
    </div>
    
    <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card p-6 variant-soft text-center transition-transform hover:translate-y-[-5px]">
        <h3 class="h3 mb-4">Photo Gallery</h3>
        <div class="p-6">
          <div class="text-6xl mb-4">🖼️</div>
          <p>No photos have been added yet.</p>
          <a href="/tribute/{attributes.slug}/photos" class="btn variant-filled-primary mt-4">Add Photos</a>
        </div>
      </div>
      
      <div class="card p-6 variant-soft text-center transition-transform hover:translate-y-[-5px]">
        <h3 class="h3 mb-4">Memories & Stories</h3>
        <div class="p-6">
          <div class="text-6xl mb-4">📝</div>
          <p>No memories have been shared yet.</p>
          <a href="/tribute/{attributes.slug}/memories" class="btn variant-filled-primary mt-4">Share a Memory</a>
        </div>
      </div>
      
      <div class="card p-6 variant-soft text-center transition-transform hover:translate-y-[-5px]">
        <h3 class="h3 mb-4">Life Timeline</h3>
        <div class="p-6">
          <div class="text-6xl mb-4">📅</div>
          <p>The timeline is being created.</p>
          <a href="/tribute/{attributes.slug}/timeline" class="btn variant-filled-primary mt-4">Add to Timeline</a>
        </div>
      </div>
    </div>
  </section>
</div>
