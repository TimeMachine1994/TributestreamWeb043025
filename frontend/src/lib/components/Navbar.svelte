<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getUser, isAuthenticated, getUserRole, getUserRoleDisplay, logout, isFuneralDirector, isFamilyContact } from '$lib/state/auth.svelte';

  // State for mobile menu
  let mobileMenuOpen = $state(false);
  let isLoggingOut = $state(false);
  
  // Toggle mobile menu
  function toggleMobileMenu() {
    console.log("🍔 Toggling mobile menu");
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  // Handle logout
  async function handleLogout() {
    if (isLoggingOut) return;
    
    console.log("👋 Logging out user");
    isLoggingOut = true;
    
    try {
      await logout();
      console.log("✅ Logout successful");
      // Close mobile menu if open
      mobileMenuOpen = false;
    } catch (error) {
      console.error("❌ Logout failed:", error);
    } finally {
      isLoggingOut = false;
    }
  }
  
  // Check if a link is active
  function isActive(path: string): boolean {
    // Check if the current path starts with the given path
    // This handles both exact matches and nested routes
    if (path === '/') {
      return page.url.pathname === '/';
    }
    return page.url.pathname.startsWith(path);
  }
  
  // Handle My Portal button click
  function handleMyPortalClick() {
    console.log("🔑 My Portal button clicked");
    if (isAuthenticated()) {
      // Redirect to appropriate dashboard based on role
      if (isFuneralDirector()) {
        console.log("👨‍💼 Redirecting to funeral director dashboard");
        goto('/fd-dashboard');
      } else {
        console.log("👪 Redirecting to family dashboard");
        goto('/family-dashboard');
      }
    } else {
      // Redirect to login page
      console.log("🔒 Redirecting to login page");
      goto('/login');
    }
  }
</script>

<nav class="bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and desktop navigation -->
      <div class="flex">
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-2xl font-bold text-green-600">TributeStream</a>
        </div>
        
        <!-- Desktop navigation -->
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a 
            href="/" 
            class="{isActive('/') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
          >
            Home
          </a>
          
          {#if isAuthenticated()}
            {#if isFuneralDirector()}
              <a
                href="/fd-dashboard"
                class="{isActive('/fd-dashboard') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Director Dashboard
              </a>
              <a
                href="/createTribute"
                class="{isActive('/createTribute') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Create Tribute
              </a>
            {:else if isFamilyContact()}
              <a
                href="/family-dashboard"
                class="{isActive('/family-dashboard') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Family Dashboard
              </a>
            {/if}
          {/if}
        </div>
      </div>
      
      <!-- Auth buttons -->
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        {#if isAuthenticated() && getUser()?.role}
          <div class="mr-4 text-sm text-gray-600">
            <span class="font-semibold">{getUserRoleDisplay()}</span>
          </div>
        {/if}
        
        <!-- My Portal Button -->
        <button
          onclick={handleMyPortalClick}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          My Portal
        </button>
        
        {#if isAuthenticated()}
          <button
            onclick={handleLogout}
            class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isLoggingOut}
          >
            {#if isLoggingOut}
              <span class="spinner mr-2"></span> Logging out...
            {:else}
              Logout
            {/if}
          </button>
        {:else}
          <div class="ml-3 flex space-x-2">
            <a
              href="/login"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Login
            </a>
            <a
              href="/funeral-director-registration"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Register as Funeral Director
            </a>
          </div>
        {/if}
      </div>
      
      <!-- Mobile menu button -->
      <div class="flex items-center sm:hidden">
        <button
          onclick={toggleMobileMenu}
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500" 
          aria-expanded="false"
        >
          <span class="sr-only">Open main menu</span>
          <!-- Icon when menu is closed -->
          {#if !mobileMenuOpen}
            <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {:else}
            <!-- Icon when menu is open -->
            <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu, show/hide based on menu state -->
  {#if mobileMenuOpen}
    <div class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <a
          href="/"
          class="{isActive('/') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          onclick={() => mobileMenuOpen = false}
        >
          Home
        </a>
        
        {#if isAuthenticated()}
          {#if isFuneralDirector()}
            <a
              href="/fd-dashboard"
              class="{isActive('/fd-dashboard') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onclick={() => mobileMenuOpen = false}
            >
              Director Dashboard
            </a>
            <a
              href="/createTribute"
              class="{isActive('/createTribute') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onclick={() => mobileMenuOpen = false}
            >
              Create Tribute
            </a>
          {:else if isFamilyContact()}
            <a
              href="/family-dashboard"
              class="{isActive('/family-dashboard') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onclick={() => mobileMenuOpen = false}
            >
              Family Dashboard
            </a>
          {/if}
          
          <!-- My Portal Button for Mobile -->
          <button
            onclick={handleMyPortalClick}
            class="w-full text-left border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-green-600"
          >
            My Portal
          </button>
          
          <button
            onclick={handleLogout}
            class="w-full text-left border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium text-red-600"
            disabled={isLoggingOut}
          >
            {#if isLoggingOut}
              <span class="spinner mr-2"></span> Logging out...
            {:else}
              Logout
            {/if}
          </button>
        {:else}
          <a
            href="/login"
            class="{isActive('/login') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            onclick={() => mobileMenuOpen = false}
          >
            Login
          </a>
          <a
            href="/funeral-director-registration"
            class="{isActive('/funeral-director-registration') ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            onclick={() => mobileMenuOpen = false}
          >
            Register as Funeral Director
          </a>
        {/if}
      </div>
    </div>
  {/if}
</nav>

<style>
  /* Loading spinner */
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease infinite;
    vertical-align: middle;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>