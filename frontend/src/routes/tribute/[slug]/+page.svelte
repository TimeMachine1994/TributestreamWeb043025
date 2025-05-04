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

<main>
  <section class="tribute-header">
    <h1>{name}</h1>
    <p class="tribute-date">Created on {createdAt}</p>
  </section>
  
  <section class="tribute-content">
    <div class="tribute-info">
      <h2>About {name}</h2>
      
      {#if attributes.description}
        <p class="tribute-description">{attributes.description}</p>
      {:else}
        <p class="tribute-description placeholder">
          This tribute page is being set up. More information will be added soon.
        </p>
      {/if}
    </div>
    
    <div class="tribute-actions">
      <h3>Contribute to this Tribute</h3>
      <div class="action-buttons">
        <a href="/tribute/{attributes.slug}/photos" class="button secondary">
          <span class="icon">🖼️</span> Add Photos
        </a>
        <a href="/tribute/{attributes.slug}/memories" class="button secondary">
          <span class="icon">📝</span> Share Memories
        </a>
        <a href="/tribute/{attributes.slug}/timeline" class="button secondary">
          <span class="icon">📅</span> Add to Timeline
        </a>
      </div>
    </div>
  </section>
  
  <section class="tribute-sections">
    <div class="section-card">
      <h3>Photo Gallery</h3>
      <div class="placeholder-content">
        <div class="placeholder-icon">🖼️</div>
        <p>No photos have been added yet.</p>
        <a href="/tribute/{attributes.slug}/photos" class="button primary">Add Photos</a>
      </div>
    </div>
    
    <div class="section-card">
      <h3>Memories & Stories</h3>
      <div class="placeholder-content">
        <div class="placeholder-icon">📝</div>
        <p>No memories have been shared yet.</p>
        <a href="/tribute/{attributes.slug}/memories" class="button primary">Share a Memory</a>
      </div>
    </div>
    
    <div class="section-card">
      <h3>Life Timeline</h3>
      <div class="placeholder-content">
        <div class="placeholder-icon">📅</div>
        <p>The timeline is being created.</p>
        <a href="/tribute/{attributes.slug}/timeline" class="button primary">Add to Timeline</a>
      </div>
    </div>
  </section>
</main>

<style>
  main {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  .tribute-header {
    padding: 60px 0 40px;
    text-align: center;
    border-bottom: 1px solid #eee;
  }
  
  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #2c3e50;
  }
  
  .tribute-date {
    color: #7f8c8d;
    font-size: 1.1rem;
  }
  
  .tribute-content {
    padding: 40px 0;
    border-bottom: 1px solid #eee;
  }
  
  .tribute-info {
    margin-bottom: 40px;
  }
  
  h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: #2c3e50;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #2c3e50;
  }
  
  .tribute-description {
    font-size: 1.2rem;
    line-height: 1.6;
    color: #555;
  }
  
  .placeholder {
    color: #7f8c8d;
    font-style: italic;
  }
  
  .tribute-actions {
    background-color: #f8f9fa;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .tribute-sections {
    padding: 60px 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
  }
  
  .section-card {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .section-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .placeholder-content {
    padding: 30px 0;
  }
  
  .placeholder-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .icon {
    margin-right: 8px;
  }
  
  .button {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    font-size: 1rem;
    transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
    margin-top: 20px;
  }
  
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .primary {
    background-color: #4CAF50;
    color: white;
  }
  
  .primary:hover {
    background-color: #3e8e41;
  }
  
  .secondary {
    background-color: #f8f8f8;
    color: #333;
    border: 1px solid #ddd;
  }
  
  .secondary:hover {
    background-color: #eaeaea;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    h1 {
      font-size: 2.2rem;
    }
    
    .action-buttons {
      flex-direction: column;
    }
    
    .tribute-sections {
      grid-template-columns: 1fr;
    }
  }
</style>