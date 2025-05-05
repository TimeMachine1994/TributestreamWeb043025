<script lang="ts">
  import { goto } from '$app/navigation';
  
  // Define props with runes
  let { data } = $props<{ data: { authenticated: boolean } }>();
  
  // State for tribute search and creation
  let lovedOnesFullName = $state('');
  let showCreateForm = $state(false);
  let usersFullName = $state('');
  let usersEmailAddress = $state('');
  let usersPhoneNumber = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state('');
  
  // Function to handle search
  async function handleSearch() {
    console.log('🔍 Searching for tribute:', lovedOnesFullName);
    if (!lovedOnesFullName.trim()) {
      errorMessage = 'Please enter a name to search';
      return;
    }
    
    // Navigate to search page with the name as a query parameter
    goto(`/search?name=${encodeURIComponent(lovedOnesFullName)}`);
  }
  
  // Function to show the create form
  function showForm() {
    console.log('📝 Showing create tribute form');
    showCreateForm = true;
    errorMessage = '';
  }
  
  // Function to create a tribute
  async function createTribute() {
    console.log('✨ Creating new tribute');
    
    // Validate form
    if (!lovedOnesFullName.trim()) {
      errorMessage = 'Please enter your loved one\'s name';
      return;
    }
    
    if (!usersFullName.trim()) {
      errorMessage = 'Please enter your full name';
      return;
    }
    
    if (!usersEmailAddress.trim() || !usersEmailAddress.includes('@')) {
      errorMessage = 'Please enter a valid email address';
      return;
    }
    
    isSubmitting = true;
    errorMessage = '';
    
    try {
      // Register the user
      const registerResponse = await fetch('/api/auth/local/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: usersEmailAddress.split('@')[0],
          email: usersEmailAddress,
          password: `${usersFullName.replace(/\s+/g, '')}${usersPhoneNumber.slice(-4)}`,
          fullName: usersFullName,
          phoneNumber: usersPhoneNumber
        })
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        console.error('❌ Registration failed:', registerData);
        errorMessage = registerData.error?.message || 'Registration failed. Please try again.';
        isSubmitting = false;
        return;
      }
      
      console.log('✅ User registered successfully');
      
      // User is now logged in with the JWT from registration
      // Create the tribute
      const tributeResponse = await fetch('/api/tributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: lovedOnesFullName,
          contactName: usersFullName,
          contactEmail: usersEmailAddress,
          contactPhone: usersPhoneNumber
        })
      });
      
      const tributeData = await tributeResponse.json();
      
      if (!tributeResponse.ok) {
        console.error('❌ Tribute creation failed:', tributeData);
        errorMessage = tributeData.error || 'Failed to create tribute. Please try again.';
        isSubmitting = false;
        return;
      }
      
      console.log('✅ Tribute created successfully:', tributeData);
      
      // Navigate to the tribute page
      const tributeSlug = tributeData.data?.attributes?.slug || tributeData.data?.slug;
      goto(`/tribute/${tributeSlug}`);
      
    } catch (error) {
      console.error('💥 Error during tribute creation:', error);
      errorMessage = 'An unexpected error occurred. Please try again.';
      isSubmitting = false;
    }
  }
  
  console.log("🏠 Home page loaded", { authenticated: data.authenticated });
</script>

<main>
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1>Preserve Memories, Celebrate Lives</h1>
      <p class="hero-subtitle">
        Tributestream helps you create beautiful digital memorials to honor and
        remember your loved ones for generations to come.
      </p>
      
      <!-- Search and Create Form -->
      <div class="tribute-actions">
        <div class="search-container">
          <input
            type="text"
            placeholder="Enter your loved one's full name"
            bind:value={lovedOnesFullName}
            class="name-input"
          />
          <div class="button-group">
            <button class="button primary" onclick={handleSearch}>Search</button>
            <button class="button secondary" onclick={showForm}>Create</button>
          </div>
        </div>
        
        {#if errorMessage}
          <div class="error-message">{errorMessage}</div>
        {/if}
        
        {#if showCreateForm}
          <div class="create-form">
            <h3>Create a Tribute</h3>
            <div class="form-group">
              <label for="lovedOnesName">Loved One's Full Name</label>
              <input
                type="text"
                id="lovedOnesName"
                bind:value={lovedOnesFullName}
                placeholder="Enter your loved one's full name"
              />
            </div>
            
            <div class="form-group">
              <label for="usersName">Your Full Name</label>
              <input
                type="text"
                id="usersName"
                bind:value={usersFullName}
                placeholder="Enter your full name"
              />
            </div>
            
            <div class="form-group">
              <label for="usersEmail">Your Email Address</label>
              <input
                type="email"
                id="usersEmail"
                bind:value={usersEmailAddress}
                placeholder="Enter your email address"
              />
            </div>
            
            <div class="form-group">
              <label for="usersPhone">Your Phone Number</label>
              <input
                type="tel"
                id="usersPhone"
                bind:value={usersPhoneNumber}
                placeholder="Enter your phone number"
              />
            </div>
            
            <button
              class="button primary create-button"
              onclick={createTribute}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Tribute'}
            </button>
          </div>
        {/if}
      </div>
      
      <div class="hero-actions">
        {#if data.authenticated}
          {#if data.user?.role?.type === 'funeral_director'}
            <a href="/fd-dashboard" class="button primary">Director Dashboard</a>
            <a href="/createTribute" class="button secondary">Create New Tribute</a>
          {:else}
            <a href="/family-dashboard" class="button primary">Family Dashboard</a>
            <a href="/tributes" class="button secondary">View Tributes</a>
          {/if}
        {:else}
          <a href="/login" class="button primary cta">Get Started</a>
          <a href="/funeral-director-registration" class="button secondary fd-button">Register as Funeral Director</a>
          <a href="/about" class="button tertiary">Learn More</a>
        {/if}
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <h2>Why Choose Tributestream</h2>
    
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">📝</div>
        <h3>Easy Creation</h3>
        <p>Simple tools to create meaningful tributes without technical knowledge</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🖼️</div>
        <h3>Photo Collections</h3>
        <p>Upload and organize cherished photos with captions and stories</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">👪</div>
        <h3>Family Collaboration</h3>
        <p>Invite family members to contribute their own memories and media</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Privacy Controls</h3>
        <p>Choose who can view and contribute to your family's tributes</p>
      </div>
      
      <div class="feature-card fd-feature">
        <div class="feature-icon">⚰️</div>
        <h3>For Funeral Directors</h3>
        <p>Streamline your services with our dedicated funeral director tools</p>
        <a href="/funeral-director-registration" class="feature-link">Register Now</a>
      </div>
    </div>
  </section>

  <!-- Call to Action Section -->
  <section class="cta-section">
    <h2>Ready to Create Your First Tribute?</h2>
    <p>Join thousands of families preserving their precious memories</p>
    
    {#if !data.authenticated}
      <div class="cta-buttons">
        <a href="/login" class="button primary cta">Create Your Account</a>
        <a href="/funeral-director-registration" class="button secondary cta">Funeral Director? Register Here</a>
      </div>
    {:else if data.user?.role?.type === 'funeral_director'}
      <a href="/createTribute" class="button primary cta">Start a New Tribute</a>
    {:else}
      <a href="/family-dashboard" class="button primary cta">View Your Tributes</a>
    {/if}
  </section>
</main>

<style>
  main {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Hero Section */
  .hero {
    padding: 80px 20px;
    text-align: center;
    background: linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9));
    border-radius: 8px;
    margin-bottom: 60px;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    color: #2c3e50;
  }

  .hero-subtitle {
    font-size: 1.4rem;
    margin-bottom: 1.5rem;
    color: #555;
    line-height: 1.6;
  }

  /* Search and Create Form */
  .tribute-actions {
    margin: 2rem 0;
  }

  .search-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .name-input {
    padding: 12px 16px;
    font-size: 1.1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 100%;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .create-form {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 1.5rem;
    text-align: left;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .create-form h3 {
    margin-bottom: 1.5rem;
    text-align: center;
    color: #2c3e50;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .create-button {
    width: 100%;
    margin-top: 1rem;
  }

  .error-message {
    color: #e74c3c;
    margin: 0.5rem 0;
    font-weight: bold;
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
  }

  /* Features Section */
  .features {
    padding: 60px 20px;
    text-align: center;
    margin-bottom: 60px;
  }

  .features h2 {
    font-size: 2.2rem;
    margin-bottom: 50px;
    color: #2c3e50;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    margin: 0 auto;
  }

  .feature-card {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 30px 20px;
    transition: transform 0.3s, box-shadow 0.3s;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 15px;
  }

  .feature-card h3 {
    font-size: 1.4rem;
    margin-bottom: 15px;
    color: #2c3e50;
  }

  .feature-card p {
    color: #555;
    line-height: 1.5;
  }

  /* CTA Section */
  .cta-section {
    background-color: #f1f8e9;
    padding: 60px 20px;
    text-align: center;
    border-radius: 8px;
    margin-bottom: 60px;
  }

  .cta-section h2 {
    font-size: 2rem;
    margin-bottom: 15px;
    color: #2c3e50;
  }

  .cta-section p {
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: #555;
  }
  
  .cta-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
  
  @media (min-width: 768px) {
    .cta-buttons {
      flex-direction: row;
      justify-content: center;
    }
  }
  
  .fd-feature {
    border: 1px solid #e1bee7;
    background-color: #faf5fb;
  }
  
  .feature-link {
    display: inline-block;
    margin-top: 10px;
    color: #9c27b0;
    text-decoration: none;
    font-weight: 500;
  }
  
  .feature-link:hover {
    text-decoration: underline;
  }

  /* Buttons */
  .button {
    display: inline-block;
    padding: 14px 28px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.1rem;
    transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
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
  
  .tertiary {
    background-color: transparent;
    color: #555;
    border: 1px solid #ddd;
  }
  
  .tertiary:hover {
    background-color: #f5f5f5;
  }
  
  .fd-button {
    background-color: #f3e5f5;
    color: #9c27b0;
    border: 1px solid #e1bee7;
  }
  
  .fd-button:hover {
    background-color: #e1bee7;
  }

  .cta {
    font-size: 1.2rem;
    padding: 16px 32px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    h1 {
      font-size: 2.2rem;
    }
    
    .hero-subtitle {
      font-size: 1.2rem;
    }
    
    .hero-actions {
      flex-direction: column;
      gap: 15px;
    }
    
    .feature-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .button {
      width: 100%;
      display: block;
      text-align: center;
    }
    
    .button-group {
      flex-direction: column;
    }
  }
</style>
