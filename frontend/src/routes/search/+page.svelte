<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  
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

<main>
  <section class="search-section">
    <h1>Search Tributes</h1>
    
    <div class="search-container">
      <input 
        type="text" 
        placeholder="Enter your loved one's full name" 
        bind:value={searchTerm}
        class="search-input"
      />
      <button 
        class="button primary search-button" 
        onclick={handleSearch} 
        disabled={isSearching}
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </div>
    
    {#if errorMessage}
      <div class="error-message">{errorMessage}</div>
    {/if}
    
    <div class="search-results">
      <h2>Search Results for "{data.searchTerm}"</h2>
      
      {#if data.tributes && data.tributes.length > 0}
        <div class="results-grid">
          {#each data.tributes as tribute}
            <div class="tribute-card">
              <h3>{tribute.attributes?.name || tribute.name}</h3>
              <p class="tribute-date">
                {new Date(tribute.attributes?.createdAt || tribute.createdAt).toLocaleDateString()}
              </p>
              <a href="/tribute/{tribute.attributes?.slug || tribute.slug}" class="button secondary">
                View Tribute
              </a>
            </div>
          {/each}
        </div>
      {:else if data.searchTerm}
        <div class="no-results">
          <p>No tributes found for "{data.searchTerm}"</p>
          <p>Would you like to <a href="/" class="create-link">create a tribute</a> for {data.searchTerm}?</p>
        </div>
      {/if}
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
  
  .search-section {
    padding: 60px 0;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #2c3e50;
    text-align: center;
  }
  
  h2 {
    font-size: 1.8rem;
    margin: 2rem 0;
    color: #2c3e50;
  }
  
  .search-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .search-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 1.1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
  }
  
  .search-button {
    padding: 12px 24px;
  }
  
  .error-message {
    color: #e74c3c;
    margin: 1rem 0;
    text-align: center;
    font-weight: bold;
  }
  
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }
  
  .tribute-card {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    text-align: center;
  }
  
  .tribute-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .tribute-card h3 {
    font-size: 1.4rem;
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }
  
  .tribute-date {
    color: #7f8c8d;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }
  
  .no-results {
    text-align: center;
    padding: 3rem 0;
    color: #7f8c8d;
  }
  
  .create-link {
    color: #4CAF50;
    text-decoration: underline;
    font-weight: bold;
  }
  
  .button {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    font-size: 1rem;
    transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
    border: none;
    cursor: pointer;
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
    .search-container {
      flex-direction: column;
    }
    
    .search-button {
      width: 100%;
    }
    
    .results-grid {
      grid-template-columns: 1fr;
    }
  }
</style>