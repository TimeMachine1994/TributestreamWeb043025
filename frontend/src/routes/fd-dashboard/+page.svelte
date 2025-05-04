<script lang="ts">
  import { page } from '$app/state';
  
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

<div class="dashboard-container">
  <div class="dashboard-header">
    <h1>Funeral Director Dashboard</h1>
    <p class="welcome-message">Welcome to your dedicated funeral director portal</p>
  </div>
  
  <div class="dashboard-stats">
    <div class="stat-card">
      <h3>Active Tributes</h3>
      <p class="stat-value">{tributes.length}</p>
    </div>
    
    <div class="stat-card">
      <h3>Director Tools</h3>
      <div class="action-buttons">
        <a href="/createTribute" class="button primary">Create New Tribute</a>
      </div>
    </div>
  </div>
  
  {#if hasError}
    <div class="error-container">
      <h3>⚠️ Error Loading Tributes</h3>
      <p>{errorMessage}</p>
      <button class="button secondary" onclick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  {/if}
  
  <div class="tributes-section">
    <h2>Manage Tributes</h2>
    
    {#if tributes.length === 0 && !hasError}
      <div class="empty-state">
        <p>No tributes found. Create your first tribute to get started.</p>
        <a href="/createTribute" class="button primary">Create Tribute</a>
      </div>
    {:else}
      <div class="tributes-grid">
        {#each tributes as tribute (tribute.id)}
          <div class="tribute-card">
            <div class="tribute-header">
              <h3>{tribute.attributes.name}</h3>
              <span class="tribute-date">Created: {formatDate(tribute.attributes.createdAt)}</span>
            </div>
            <div class="tribute-actions">
              <a href="/tributes/{tribute.attributes.slug}" class="button secondary small">View</a>
              <a href="/tributes/{tribute.attributes.slug}/edit" class="button primary small">Edit</a>
              <button class="button danger small">Delete</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <div class="director-tools">
    <h2>Funeral Director Tools</h2>
    <div class="tools-grid">
      <div class="tool-card">
        <div class="tool-icon">📊</div>
        <h3>Analytics</h3>
        <p>View tribute engagement statistics</p>
        <button class="button secondary">View Analytics</button>
      </div>
      
      <div class="tool-card">
        <div class="tool-icon">👪</div>
        <h3>Family Management</h3>
        <p>Manage family contacts and permissions</p>
        <button class="button secondary">Manage Families</button>
      </div>
      
      <div class="tool-card">
        <div class="tool-icon">🔔</div>
        <h3>Notifications</h3>
        <p>Configure and send notifications</p>
        <button class="button secondary">Notification Center</button>
      </div>
      
      <div class="tool-card">
        <div class="tool-icon">⚙️</div>
        <h3>Settings</h3>
        <p>Configure your director account</p>
        <button class="button secondary">Account Settings</button>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .dashboard-header {
    margin-bottom: 30px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 20px;
  }
  
  h1 {
    font-size: 2.2rem;
    color: #2c3e50;
    margin-bottom: 10px;
  }
  
  .welcome-message {
    color: #666;
    font-size: 1.1rem;
  }
  
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .stat-card {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .stat-card h3 {
    font-size: 1.1rem;
    color: #555;
    margin-bottom: 10px;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #4CAF50;
  }
  
  .error-container {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    color: #856404;
  }
  
  .tributes-section, .director-tools {
    margin-bottom: 40px;
  }
  
  h2 {
    font-size: 1.6rem;
    color: #2c3e50;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eaeaea;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  
  .tributes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .tribute-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .tribute-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .tribute-header {
    margin-bottom: 15px;
  }
  
  .tribute-header h3 {
    font-size: 1.3rem;
    margin-bottom: 5px;
    color: #2c3e50;
  }
  
  .tribute-date {
    font-size: 0.9rem;
    color: #777;
  }
  
  .tribute-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }
  
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .tool-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .tool-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .tool-icon {
    font-size: 2.5rem;
    margin-bottom: 15px;
  }
  
  .tool-card h3 {
    font-size: 1.2rem;
    margin-bottom: 10px;
    color: #2c3e50;
  }
  
  .tool-card p {
    color: #666;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }
  
  /* Buttons */
  .button {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
  }
  
  .button.small {
    padding: 6px 12px;
    font-size: 0.9rem;
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
  
  .danger {
    background-color: #f44336;
    color: white;
  }
  
  .danger:hover {
    background-color: #d32f2f;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .tributes-grid, .tools-grid {
      grid-template-columns: 1fr;
    }
    
    .dashboard-stats {
      grid-template-columns: 1fr;
    }
    
    .tribute-actions {
      flex-direction: column;
    }
    
    .button {
      width: 100%;
      text-align: center;
    }
  }
</style>