<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { PageProps } from './$types';
  import { createLogger } from '$lib/logger';
  import { getRoleDisplayName } from '$lib/auth';
  import Navbar from '$lib/components/Navbar.svelte';
  
  // Create a dedicated logger for the family dashboard component
  const logger = createLogger('FamilyDashboardComponent');
  
  // Define tribute type
  // Define interfaces for data structures
  interface Location {
    id: number;
    name: string;
    address: string;
    startTime: string;
    duration: number;
  }
  
  interface MediaItem {
    id: number;
    name: string;
    url: string;
    type: string; // image, video, document
    thumbnailUrl?: string;
  }
  
  interface TributeAttributes {
    name: string;
    slug: string;
    packageId?: string;
    liveStreamDate?: string;
    liveStreamStartTime?: string;
    liveStreamDuration?: number;
    locations?: Location[];
    mediaItems?: MediaItem[];
    priceTotal?: number;
    packageInfo?: any;
    [key: string]: any;
  }
  
  interface Tribute {
    id: string;
    attributes: TributeAttributes;
    [key: string]: any;
  }
  
  // Define data type from server load function
  interface DashboardData {
    authenticated?: boolean;
    tributes?: Tribute[];
    error?: string;
    meta?: any;
  }
  
  // Get data from server load function
  let { data } = $props<{ data: DashboardData & { user?: { role?: { type?: string, name?: string } } } }>();
  
  // State for loading and data fetching
  let isLoading = $state(false);
  let loadingTributeId = $state<string | null>(null);
  let loadingLocations = $state(false);
  let loadingMedia = $state(false);
  let fetchError = $state('');
  
  // Log when component initializes with data
  $effect(() => {
    logger.info('🚀 Family dashboard component initialized');
    logger.debug('📦 Initial data received', {
      authenticated: data.authenticated,
      tributesCount: data.tributes?.length || 0,
      hasError: !!data.error,
      userRole: data.user?.role?.type || 'unknown'
    });
    
    // If we have a featured tribute, load its details
    if (featuredTribute) {
      loadTributeDetails(featuredTribute.id);
    }
  });
  
  // Check if user is a funeral director
  let isFuneralDirector = $derived(data.user?.role?.type === 'funeral_director');
  
  // Check if user is a family contact
  let isFamilyContact = $derived(data.user?.role?.type === 'family_contact');
  
  // Get user role display name
  let userRoleDisplay = $derived(getRoleDisplayName(data.user?.role?.type));
  
  // State management with Svelte 5 runes
  let isEditing = $state<string | null>(null); // ID of tribute being edited
  let editName = $state('');
  let isDeleting = $state<string | null>(null); // ID of tribute being deleted
  let isCreating = $state(false);
  let newTributeName = $state('');
  let isSubmitting = $state(false);
  let error = $state('');
  let successMessage = $state('');
  
  // Computed values
  let tributes = $derived<Tribute[]>(data.tributes || []);
  let hasError = $derived(!!data.error || !!error);
  let errorMessage = $derived(data.error || error || '');
  
  // Validation
  let nameError = $state('');
  let formValid = $derived(newTributeName.trim().length >= 2 && nameError === '');
  
  $effect(() => {
    if (newTributeName.trim() === '') {
      nameError = 'Name is required';
    } else if (newTributeName.length < 2) {
      nameError = 'Name must be at least 2 characters';
    } else if (newTributeName.length > 100) {
      nameError = 'Name must be less than 100 characters';
    } else {
      nameError = '';
    }
  });
  
  // Format date
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Not scheduled';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }
  
  // Format time
  function formatTime(timeString: string | undefined): string {
    if (!timeString) return 'Not set';
    return timeString;
  }
  
  // Format currency
  function formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  // Navigate to calculator page
  function goToCalculator(tributeId: string) {
    logger.info('🔄 Navigating to calculator page', { tributeId });
    goto('/calculator?tributeId=' + tributeId);
  }
  
  // Start editing a tribute
  function startEdit(tribute: Tribute) {
    isEditing = tribute.id;
    editName = tribute.attributes.name;
    logger.info(`Started editing tribute`, { id: tribute.id, name: tribute.attributes.name });
  }
  
  // Cancel editing
  function cancelEdit() {
    logger.info('Cancelled editing tribute', { id: isEditing });
    isEditing = null;
    editName = '';
  }
  
  // Save edited tribute
  async function saveEdit() {
    if (editName.trim().length < 2) {
      logger.warning('Validation failed: Name too short', { name: editName });
      error = 'Name must be at least 2 characters';
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    try {
      logger.info(`Saving edited tribute`, { id: isEditing, newName: editName });
      
      // Call the API to update the tribute
      const response = await fetch(`/api/tributes/${isEditing}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1] || ''}`
        },
        body: JSON.stringify({ name: editName })
      });
      
      const result = await response.json();
      
      if (result.success) {
        logger.success('Tribute updated successfully', { id: isEditing });
        successMessage = 'Tribute updated successfully';
        
        // Update the local data with the response from the server
        if (result.data) {
          tributes = tributes.map((tribute: Tribute) =>
            tribute.id === isEditing
              ? {
                  id: result.data.id,
                  attributes: {
                    name: result.data.attributes.name,
                    slug: result.data.attributes.slug,
                    ...result.data.attributes
                  }
                }
              : tribute
          );
        } else {
          // Fallback to local update if server doesn't return data
          tributes = tributes.map((tribute: Tribute) =>
            tribute.id === isEditing
              ? { ...tribute, attributes: { ...tribute.attributes, name: editName } }
              : tribute
          );
        }
        
        // Reset editing state
        isEditing = null;
        editName = '';
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage = '';
        }, 3000);
      } else {
        error = result.error || 'Failed to update tribute';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
  
  // Confirm deletion
  function confirmDelete(tribute: Tribute) {
    isDeleting = tribute.id;
    logger.info(`Confirming deletion of tribute`, { id: tribute.id, name: tribute.attributes.name });
  }
  
  // Cancel deletion
  function cancelDelete() {
    logger.info('Cancelled deletion', { id: isDeleting });
    isDeleting = null;
  }
  
  // Delete tribute
  async function deleteTribute() {
    isSubmitting = true;
    error = '';
    
    try {
      logger.info(`Deleting tribute`, { id: isDeleting });
      
      // Call the API to delete the tribute
      const response = await fetch(`/api/tributes/${isDeleting}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        logger.success('Tribute deleted successfully', { id: isDeleting });
        successMessage = 'Tribute deleted successfully';
        
        // Update the local data
        tributes = tributes.filter((tribute: Tribute) => tribute.id !== isDeleting);
        
        // Reset deleting state
        isDeleting = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage = '';
        }, 3000);
      } else {
        error = result.error || 'Failed to delete tribute';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
  
  // Toggle create form
  function toggleCreateForm() {
    isCreating = !isCreating;
    if (!isCreating) {
      newTributeName = '';
    }
    logger.info(`${isCreating ? 'Showing' : 'Hiding'} create form`);
  }
  
  // Create new tribute
  async function createTribute() {
    if (!formValid) {
      logger.warning('Form validation failed', { name: newTributeName, nameError });
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    try {
      logger.info(`Creating new tribute`, { name: newTributeName });
      
      // Submit to API
      const response = await fetch('/api/tributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newTributeName })
      });
      
      const result = await response.json();
      
      if (result.success) {
        logger.success('Tribute created successfully', { id: result.data?.id });
        successMessage = 'Tribute created successfully';
        
        // Add the new tribute to the list
        if (result.data) {
          tributes = [...tributes, result.data];
        }
        
        // Reset form
        newTributeName = '';
        isCreating = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage = '';
        }, 3000);
      } else {
        error = result.error || 'Failed to create tribute';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }

  // Function to load tribute details including locations and media
  async function loadTributeDetails(tributeId: string) {
    if (!tributeId) return;
    
    loadingTributeId = tributeId;
    isLoading = true;
    fetchError = '';
    
    try {
      logger.info('🔄 Loading tribute details', { tributeId });
      
      // Load locations
      loadingLocations = true;
      await loadTributeLocations(tributeId);
      loadingLocations = false;
      
      // Load media items
      loadingMedia = true;
      await loadTributeMedia(tributeId);
      loadingMedia = false;
      
      logger.success('✅ Tribute details loaded successfully', { tributeId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('❌ Error loading tribute details', { tributeId, error: errorMessage });
      fetchError = `Failed to load tribute details: ${errorMessage}`;
    } finally {
      isLoading = false;
      loadingTributeId = null;
    }
  }
  
  // Function to load tribute locations
  async function loadTributeLocations(tributeId: string) {
    logger.info('🔄 Loading tribute locations', { tributeId });
    
    try {
      const response = await fetch(`/api/tributes/${tributeId}?populate=locations`, {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1] || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load locations (${response.status})`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the tribute with locations data
        tributes = tributes.map(tribute =>
          tribute.id === tributeId
            ? {
                ...tribute,
                attributes: {
                  ...tribute.attributes,
                  locations: result.data.attributes.locations || []
                }
              }
            : tribute
        );
        
        logger.success('✅ Locations loaded successfully', {
          tributeId,
          locationsCount: result.data.attributes.locations?.length || 0
        });
      } else {
        throw new Error(result.error || 'Failed to load locations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('❌ Error loading locations', { tributeId, error: errorMessage });
      throw new Error(`Failed to load locations: ${errorMessage}`);
    }
  }
  
  // Function to load tribute media
  async function loadTributeMedia(tributeId: string) {
    logger.info('🔄 Loading tribute media', { tributeId });
    
    try {
      const response = await fetch(`/api/tributes/${tributeId}?populate=mediaItems`, {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1] || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load media (${response.status})`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the tribute with media data
        tributes = tributes.map(tribute =>
          tribute.id === tributeId
            ? {
                ...tribute,
                attributes: {
                  ...tribute.attributes,
                  mediaItems: result.data.attributes.mediaItems || []
                }
              }
            : tribute
        );
        
        logger.success('✅ Media loaded successfully', {
          tributeId,
          mediaCount: result.data.attributes.mediaItems?.length || 0
        });
      } else {
        throw new Error(result.error || 'Failed to load media');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('❌ Error loading media', { tributeId, error: errorMessage });
      throw new Error(`Failed to load media: ${errorMessage}`);
    }
  }
  
  // Function to share tribute
  async function shareTribute(tribute: Tribute, platform: string) {
    logger.info('🔄 Sharing tribute', { tributeId: tribute.id, platform });
    
    const tributeUrl = `https://tributestream.com/${tribute.attributes.slug}`;
    const tributeName = tribute.attributes.name;
    
    try {
      let shareUrl = '';
      
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tributeUrl)}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(tributeUrl)}&text=${encodeURIComponent(`View the tribute for ${tributeName}`)}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tributeUrl)}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=${encodeURIComponent(`Tribute for ${tributeName}`)}&body=${encodeURIComponent(`View the tribute for ${tributeName} at ${tributeUrl}`)}`;
          break;
        default:
          // Copy to clipboard
          await navigator.clipboard.writeText(tributeUrl);
          successMessage = 'Tribute URL copied to clipboard';
          setTimeout(() => { successMessage = ''; }, 3000);
          return;
      }
      
      // Open share URL in new window
      window.open(shareUrl, '_blank', 'width=600,height=400');
      logger.success('✅ Tribute shared successfully', { platform });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('❌ Error sharing tribute', { platform, error: errorMessage });
      error = `Failed to share: ${errorMessage}`;
    }
  }
  
  // Function to get schedule data from tribute locations
  function getScheduleData(tribute: Tribute) {
    if (!tribute?.attributes?.locations || tribute.attributes.locations.length === 0) {
      return [
        { startTime: '10:00 AM', streamType: 'Visitation', duration: '1 hour', location: 'Chapel A' },
        { startTime: '11:30 AM', streamType: 'Service', duration: '2 hours', location: 'Main Hall' },
        { startTime: '2:00 PM', streamType: 'Burial', duration: '1 hour', location: 'Memorial Gardens' }
      ];
    }
    
    return tribute.attributes.locations.map(location => ({
      startTime: formatTime(location.startTime),
      streamType: location.name,
      duration: `${location.duration} hour${location.duration !== 1 ? 's' : ''}`,
      location: location.address
    }));
  }
  
  // Function to upload media
  function uploadMedia(tribute: Tribute) {
    logger.info('🔄 Opening media upload for tribute', { tributeId: tribute.id });
    // This would typically open a file picker and upload to the server
    // For now, just navigate to a hypothetical upload page
    goto(`/media-upload?tributeId=${tribute.id}`);
  }
  
  // Function to edit schedule
  function editSchedule(tribute: Tribute) {
    logger.info('🔄 Opening schedule editor for tribute', { tributeId: tribute.id });
    // Navigate to a schedule editor page
    goto(`/schedule-editor?tributeId=${tribute.id}`);
  }
  
  // Function to transfer contacts
  function transferContacts(tribute: Tribute) {
    logger.info('🔄 Opening contact transfer for tribute', { tributeId: tribute.id });
    goto(`/contact-transfer?tributeId=${tribute.id}`);
  }
  
  // Function to invite others
  function inviteOthers(tribute: Tribute) {
    logger.info('🔄 Inviting others to tribute', { tributeId: tribute.id });
    
    // For now, just open email with pre-filled content
    const tributeUrl = `https://tributestream.com/${tribute.attributes.slug}`;
    const tributeName = tribute.attributes.name;
    const emailSubject = `Invitation to view tribute for ${tributeName}`;
    const emailBody = `You're invited to view the tribute for ${tributeName}.\n\nVisit: ${tributeUrl}`;
    
    try {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;
      logger.success('✅ Email invitation opened');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('❌ Error opening email invitation', { error: errorMessage });
      error = `Failed to open email: ${errorMessage}`;
    }
  }
  
  // Get the first tribute with livestream data for the hero section
  let featuredTribute = $derived(tributes.find(t => t.attributes.liveStreamDate));
  
  // Get schedule data for the featured tribute
  let scheduleData = $derived(featuredTribute ? getScheduleData(featuredTribute) : []);
  
  // Get media items for the featured tribute
  let mediaItems = $derived(featuredTribute?.attributes?.mediaItems || []);
</script>

<!-- Global Navigation -->
<Navbar authenticated={data.authenticated} user={data.user} />

<!-- Main Dashboard Content -->
<div class="bg-gray-50 min-h-screen">
  <!-- Dashboard Content Container -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- TributeHeader Section -->
    <div class="bg-white shadow rounded-lg mb-6 overflow-hidden">
      <div class="p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Family Dashboard</h1>
            <p class="text-gray-600 mt-1">Manage your family tributes and livestreams</p>
          </div>
          <div class="mt-4 md:mt-0">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Role: {userRoleDisplay}
            </span>
          </div>
        </div>
        
        <!-- Tribute URL Section -->
        <div class="mt-6 border-t border-gray-200 pt-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 class="text-lg font-medium text-gray-900">Your Tribute URL</h2>
              <div class="mt-2 flex items-center">
                <span class="text-gray-600 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono">
                  tributestream.com/{featuredTribute?.attributes.slug || 'your-tribute'}
                </span>
                <button class="ml-2 text-blue-600 hover:text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Social Share Group -->
            <div class="mt-4 sm:mt-0">
              <h3 class="text-sm font-medium text-gray-700">Share with</h3>
              <div class="mt-2 flex space-x-2">
                <button
                  class="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                  onclick={() => featuredTribute && shareTribute(featuredTribute, 'facebook')}
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button
                  class="p-2 rounded-full bg-blue-400 text-white hover:bg-blue-500"
                  onclick={() => featuredTribute && shareTribute(featuredTribute, 'twitter')}
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button
                  class="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                  onclick={() => featuredTribute && shareTribute(featuredTribute, 'linkedin')}
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                <button
                  class="p-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                  onclick={() => featuredTribute && shareTribute(featuredTribute, 'email')}
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018 0-3.878 3.132-7.018 7-7.018s7 3.14 7 7.018c0 3.878-3.132 7.018-7 7.018zm3.86-11.689a.994.994 0 01-.012 1.402l-4.496 4.341a.997.997 0 01-1.388-.002l-2.496-2.445a.996.996 0 111.414-1.41l1.787 1.752 3.783-3.648a.994.994 0 011.408.01z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Payment Status -->
            <div class="mt-4 sm:mt-0">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg class="mr-1.5 h-2 w-2 text-green-600" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Payment Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Notifications -->
    {#if hasError}
      <div class="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">❌ {errorMessage}</p>
          </div>
        </div>
      </div>
    {/if}
    
    {#if successMessage}
      <div class="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">✅ {successMessage}</p>
          </div>
        </div>
      </div>
    {/if}
    
    {#if fetchError}
      <div class="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">⚠️ {fetchError}</p>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Schedule Table -->
    <div class="bg-white shadow rounded-lg mb-6 overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">Livestream Schedule</h2>
          {#if featuredTribute}
            <button
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              onclick={() => featuredTribute && goto(`/schedule-editor?tributeId=${featuredTribute.id}`)}
            >
              <svg class="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Schedule
            </button>
          {/if}
        </div>
        
        {#if loadingLocations}
          <div class="py-8 flex justify-center">
            <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream Type</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each scheduleData as item}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.startTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.streamType}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.duration}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Tributes List -->
    {#if tributes.length > 0}
      <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Your Tributes</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each tributes as tribute (tribute.id)}
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                  <h3 class="text-lg font-medium text-gray-900">{tribute.attributes.name}</h3>
                  {#if tribute.attributes.packageId}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tribute.attributes.packageInfo?.name || 'Standard Package'}
                    </span>
                  {/if}
                </div>
                <p class="text-sm text-gray-500 mt-1">/{tribute.attributes.slug}</p>
                
                {#if tribute.attributes.liveStreamDate}
                  <div class="mt-3 bg-gray-50 rounded-md p-2">
                    <p class="text-sm text-gray-600">📅 {formatDate(tribute.attributes.liveStreamDate)}</p>
                    <p class="text-sm text-gray-600">⏰ {formatTime(tribute.attributes.liveStreamStartTime)}</p>
                  </div>
                {/if}
                
                <div class="mt-4 flex justify-end space-x-2">
                  <a href={`/${tribute.attributes.slug}`} class="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <button onclick={() => startEdit(tribute)} class="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onclick={() => goToCalculator(tribute.id)} class="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {#if isFuneralDirector}
                    <button onclick={() => confirmDelete(tribute)} class="inline-flex items-center p-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                      <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div class="p-6 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tributes</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating a new tribute.</p>
          <div class="mt-6">
            <button onclick={toggleCreateForm} class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create a tribute
            </button>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Main Tribute Card Section -->
    {#if featuredTribute}
      <div class="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div class="p-6">
          <div class="flex flex-col lg:flex-row">
            <!-- Tribute Info -->
            <div class="lg:w-2/3 pr-0 lg:pr-6">
              <div class="flex justify-between items-start">
                <h2 class="text-xl font-bold text-gray-900">{featuredTribute.attributes.name}</h2>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {featuredTribute.attributes.packageInfo?.name || 'Standard Package'}
                </span>
              </div>
              
              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500">Date</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">{formatDate(featuredTribute.attributes.liveStreamDate)}</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500">Time</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">{formatTime(featuredTribute.attributes.liveStreamStartTime)}</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500">Duration</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">
                    {featuredTribute.attributes.liveStreamDuration || 1} hour{featuredTribute.attributes.liveStreamDuration !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-medium text-gray-500">Location</h3>
                  <p class="mt-1 text-lg font-semibold text-gray-900">
                    {featuredTribute.attributes.locations?.[0]?.name || 'Not specified'}
                  </p>
                  <p class="text-sm text-gray-500">
                    {featuredTribute.attributes.locations?.[0]?.address || ''}
                  </p>
                </div>
              </div>
              
              <div class="mt-6">
                <h3 class="text-sm font-medium text-gray-500">Notes</h3>
                <p class="mt-1 text-gray-600">
                  Please arrive 15 minutes early. The service will be livestreamed for those who cannot attend in person.
                </p>
              </div>
            </div>
            
            <!-- Media Preview -->
            <div class="lg:w-1/3 mt-6 lg:mt-0">
              <div class="bg-gray-100 rounded-lg p-4 h-full">
                <div class="flex justify-between items-center mb-3">
                  <h3 class="text-sm font-medium text-gray-700">Media Preview</h3>
                  <button
                    class="text-xs text-blue-600 hover:text-blue-800"
                    onclick={() => featuredTribute && uploadMedia(featuredTribute)}
                  >
                    Upload New
                  </button>
                </div>
                
                {#if loadingMedia}
                  <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                    <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                {:else if mediaItems.length > 0}
                  <!-- Display first media item as main preview -->
                  <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-md overflow-hidden">
                    {#if mediaItems[0].type === 'image'}
                      <img src={mediaItems[0].url} alt={mediaItems[0].name} class="object-cover w-full h-full" />
                    {:else if mediaItems[0].type === 'video'}
                      <div class="relative">
                        <img src={mediaItems[0].thumbnailUrl || ''} alt={mediaItems[0].name} class="object-cover w-full h-full" />
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div class="bg-black bg-opacity-50 rounded-full p-3">
                            <svg class="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    {:else}
                      <div class="flex items-center justify-center h-full bg-gray-100">
                        <svg class="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Thumbnails for additional media -->
                  <div class="mt-3 grid grid-cols-3 gap-2">
                    {#each mediaItems.slice(1, 4) as item, i}
                      <div class="bg-gray-200 rounded-md h-16 overflow-hidden">
                        {#if item.type === 'image'}
                          <img src={item.thumbnailUrl || item.url} alt={item.name} class="object-cover w-full h-full" />
                        {:else if item.type === 'video'}
                          <div class="relative h-full">
                            <img src={item.thumbnailUrl || ''} alt={item.name} class="object-cover w-full h-full" />
                            <div class="absolute inset-0 flex items-center justify-center">
                              <svg class="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        {:else}
                          <div class="flex items-center justify-center h-full">
                            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        {/if}
                      </div>
                    {/each}
                    
                    {#if mediaItems.length === 1}
                      <!-- Placeholder thumbnails if only one media item -->
                      {#each Array(3) as _, i}
                        <div class="bg-gray-200 rounded-md h-16 flex items-center justify-center">
                          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      {/each}
                    {:else if mediaItems.length === 2}
                      <!-- Placeholder thumbnails if only two media items -->
                      {#each Array(2) as _, i}
                        <div class="bg-gray-200 rounded-md h-16 flex items-center justify-center">
                          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      {/each}
                    {:else if mediaItems.length === 3}
                      <!-- Placeholder thumbnail if only three media items -->
                      <div class="bg-gray-200 rounded-md h-16 flex items-center justify-center">
                        <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <!-- Empty state when no media items -->
                  <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-md overflow-hidden">
                    <div class="flex items-center justify-center h-full">
                      <svg class="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="mt-3 grid grid-cols-3 gap-2">
                    {#each Array(3) as _}
                      <div class="bg-gray-200 rounded-md h-16 flex items-center justify-center">
                        <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Action Button Group -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <button
        class="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
        onclick={() => featuredTribute && uploadMedia(featuredTribute)}
        disabled={!featuredTribute || loadingMedia}
      >
        <div class="bg-blue-100 p-3 rounded-full mb-3">
          {#if loadingMedia}
            <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {:else}
            <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          {/if}
        </div>
        <span class="text-sm font-medium text-gray-900">Upload Media</span>
      </button>
      
      <button
        class="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
        onclick={() => featuredTribute && editSchedule(featuredTribute)}
        disabled={!featuredTribute || loadingLocations}
      >
        <div class="bg-purple-100 p-3 rounded-full mb-3">
          {#if loadingLocations}
            <svg class="animate-spin h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {:else}
            <svg class="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          {/if}
        </div>
        <span class="text-sm font-medium text-gray-900">Edit Schedule</span>
      </button>
      
      <button
        class="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
        onclick={() => featuredTribute && transferContacts(featuredTribute)}
        disabled={!featuredTribute || isLoading}
      >
        <div class="bg-green-100 p-3 rounded-full mb-3">
          <svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-900">Transfer Contacts</span>
      </button>
      
      <button
        class="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
        onclick={() => featuredTribute && inviteOthers(featuredTribute)}
        disabled={!featuredTribute || isLoading}
      >
        <div class="bg-yellow-100 p-3 rounded-full mb-3">
          <svg class="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-900">Invite Others</span>
      </button>
    </div>
  </div>
</div>