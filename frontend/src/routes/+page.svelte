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

<main class="container mx-auto max-w-7xl p-4">
  <!-- Hero Section -->
  <section class="card p-10 mb-16 text-center variant-soft">
    <div class="max-w-3xl mx-auto">
      <h1 class="h1 mb-6">Preserve Memories, Celebrate Lives</h1>
      <p class="text-xl mb-6">
        Tributestream helps you create beautiful digital memorials to honor and
        remember your loved ones for generations to come.
      </p>
      
      <!-- Search and Create Form -->
      <div class="my-8">
        <div class="flex flex-col gap-4 mb-4">
          <input
            type="text"
            placeholder="Enter your loved one's full name"
            bind:value={lovedOnesFullName}
            class="input"
          />
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="btn variant-filled-primary" on:click={handleSearch}>Search</button>
            <button class="btn variant-soft-secondary" on:click={showForm}>Create</button>
          </div>
        </div>
        
        {#if errorMessage}
          <div class="alert variant-filled-error">{errorMessage}</div>
        {/if}
        
        {#if showCreateForm}
          <div class="card p-6 mt-6 variant-soft text-left">
            <h3 class="h3 mb-6 text-center">Create a Tribute</h3>
            
            <label class="label mb-4">
              <span>Loved One's Full Name</span>
              <input
                type="text"
                id="lovedOnesName"
                bind:value={lovedOnesFullName}
                placeholder="Enter your loved one's full name"
                class="input"
              />
            </label>
            
            <label class="label mb-4">
              <span>Your Full Name</span>
              <input
                type="text"
                id="usersName"
                bind:value={usersFullName}
                placeholder="Enter your full name"
                class="input"
              />
            </label>
            
            <label class="label mb-4">
              <span>Your Email Address</span>
              <input
                type="email"
                id="usersEmail"
                bind:value={usersEmailAddress}
                placeholder="Enter your email address"
                class="input"
              />
            </label>
            
            <label class="label mb-4">
              <span>Your Phone Number</span>
              <input
                type="tel"
                id="usersPhone"
                bind:value={usersPhoneNumber}
                placeholder="Enter your phone number"
                class="input"
              />
            </label>
            
            <button
              class="btn variant-filled-primary w-full mt-4"
              on:click={createTribute}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Tribute'}
            </button>
          </div>
        {/if}
      </div>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        {#if data.authenticated}
          {#if data.user?.role?.type === 'funeral_director'}
            <a href="/fd-dashboard" class="btn variant-filled-primary">Director Dashboard</a>
            <a href="/createTribute" class="btn variant-soft-secondary">Create New Tribute</a>
          {:else}
            <a href="/family-dashboard" class="btn variant-filled-primary">Family Dashboard</a>
            <a href="/tributes" class="btn variant-soft-secondary">View Tributes</a>
          {/if}
        {:else}
          <a href="/login" class="btn variant-filled-primary text-lg py-4">Get Started</a>
          <a href="/family-registration" class="btn variant-soft-success">Family Registration</a>
          <a href="/funeral-director-registration" class="btn variant-soft-tertiary">Register as Funeral Director</a>
          <a href="/about" class="btn variant-ghost-surface">Learn More</a>
        {/if}
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-16 text-center mb-16">
    <h2 class="h2 mb-12">Why Choose Tributestream</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="card p-6 variant-soft transition-transform hover:-translate-y-1 hover:shadow-lg">
        <div class="text-4xl mb-4">📝</div>
        <h3 class="h3 mb-4">Easy Creation</h3>
        <p>Simple tools to create meaningful tributes without technical knowledge</p>
      </div>
      
      <div class="card p-6 variant-soft transition-transform hover:-translate-y-1 hover:shadow-lg">
        <div class="text-4xl mb-4">🖼️</div>
        <h3 class="h3 mb-4">Photo Collections</h3>
        <p>Upload and organize cherished photos with captions and stories</p>
      </div>
      
      <div class="card p-6 variant-soft transition-transform hover:-translate-y-1 hover:shadow-lg">
        <div class="text-4xl mb-4">👪</div>
        <h3 class="h3 mb-4">Family Collaboration</h3>
        <p>Invite family members to contribute their own memories and media</p>
      </div>
      
      <div class="card p-6 variant-soft transition-transform hover:-translate-y-1 hover:shadow-lg">
        <div class="text-4xl mb-4">🔒</div>
        <h3 class="h3 mb-4">Privacy Controls</h3>
        <p>Choose who can view and contribute to your family's tributes</p>
      </div>
      
      <div class="card p-6 variant-soft-tertiary border border-tertiary-300 transition-transform hover:-translate-y-1 hover:shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
        <div class="text-4xl mb-4">⚰️</div>
        <h3 class="h3 mb-4">For Funeral Directors</h3>
        <p>Streamline your services with our dedicated funeral director tools</p>
        <a href="/funeral-director-registration" class="anchor">Register Now</a>
      </div>
    </div>
  </section>

  <!-- Call to Action Section -->
  <section class="card p-10 variant-soft-success text-center mb-16">
    <h2 class="h2 mb-4">Ready to Create Your First Tribute?</h2>
    <p class="text-lg mb-8">Join thousands of families preserving their precious memories</p>
    
    {#if !data.authenticated}
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/login" class="btn variant-filled-primary text-lg py-4">Create Your Account</a>
        <a href="/family-registration" class="btn variant-soft-success">Family Registration</a>
        <a href="/funeral-director-registration" class="btn variant-soft-tertiary">Funeral Director? Register Here</a>
      </div>
    {:else if data.user?.role?.type === 'funeral_director'}
      <a href="/createTribute" class="btn variant-filled-primary text-lg py-4">Start a New Tribute</a>
    {:else}
      <a href="/family-dashboard" class="btn variant-filled-primary text-lg py-4">View Your Tributes</a>
    {/if}
  </section>
</main>

<!-- No custom styles - using SkeletonUI theme -->
