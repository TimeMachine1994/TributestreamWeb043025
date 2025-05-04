<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { PageProps } from './$types';
  import { createLogger } from '$lib/logger';
  import { getRoleDisplayName } from '$lib/auth';
  
  // Create a dedicated logger for the family dashboard component
  const logger = createLogger('FamilyDashboardComponent');
  
  // Define tribute type
  interface TributeAttributes {
    name: string;
    slug: string;
    packageId?: string;
    liveStreamDate?: string;
    liveStreamStartTime?: string;
    liveStreamDuration?: number;
    locations?: Location[];
    priceTotal?: number;
    packageInfo?: any;
    [key: string]: any;
  }
  
  interface Location {
    name: string;
    address: string;
    startTime: string;
    duration: number;
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
  
  // Log when component initializes with data
  $effect(() => {
    logger.info('🚀 Family dashboard component initialized');
    logger.debug('📦 Initial data received', {
      authenticated: data.authenticated,
      tributesCount: data.tributes?.length || 0,
      hasError: !!data.error,
      userRole: data.user?.role?.type || 'unknown'
    });
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
      logger.debug('API response for tribute update', {
        status: response.status,
        result,
        responseOk: response.ok,
        resultData: result.data
      });
      
      if (result.success) {
        logger.success('Tribute updated successfully', { id: isEditing });
        successMessage = 'Tribute updated successfully';
        
        // Update the local data with the response from the server
        if (result.data) {
          logger.debug('Updating local data with server response', { serverData: result.data });
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
          logger.debug('Server did not return data, using local values for update');
          tributes = tributes.map((tribute: Tribute) =>
            tribute.id === isEditing
              ? { ...tribute, attributes: { ...tribute.attributes, name: editName } }
              : tribute
          );
        }
        logger.debug('Local tribute data updated');
        
        // Reset editing state
        isEditing = null;
        editName = '';
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage = '';
          logger.debug('Success message cleared');
        }, 3000);
      } else {
        logger.error('Error updating tribute', { error: result.error });
        error = result.error || 'Failed to update tribute';
      }
    } catch (err) {
      logger.error('Exception during tribute update', { error: err });
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
      logger.debug('API response for tribute deletion', { status: response.status, result });
      
      if (result.success) {
        logger.success('Tribute deleted successfully', { id: isDeleting });
        successMessage = 'Tribute deleted successfully';
        
        // Update the local data
        tributes = tributes.filter((tribute: Tribute) => tribute.id !== isDeleting);
        logger.debug('Local tribute data updated after deletion');
        
        // Reset deleting state
        isDeleting = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage = '';
          logger.debug('Success message cleared');
        }, 3000);
      } else {
        logger.error('Error deleting tribute', { error: result.error });
        error = result.error || 'Failed to delete tribute';
      }
    } catch (err) {
      logger.error('Exception during tribute deletion', { error: err });
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
      logger.debug('API response for tribute creation', { status: response.status, result });
      
      if (result.success) {
        logger.success('Tribute created successfully', { id: result.data?.id });
        successMessage = 'Tribute created successfully';
        
        // Add the new tribute to the list
        if (result.data) {
          tributes = [...tributes, result.data];
          logger.debug('Added new tribute to local data', {
            newTributeId: result.data.id,
            totalTributes: tributes.length
          });
        }
        
        // Reset form
        newTributeName = '';
        isCreating = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage = '';
          logger.debug('Success message cleared');
        }, 3000);
      } else {
        logger.error('Error creating tribute', { error: result.error });
        error = result.error || 'Failed to create tribute';
      }
    } catch (err) {
      logger.error('Exception during tribute creation', { error: err });
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="dashboard-container">
  <header>
    <h1>Family Dashboard</h1>
    <p>Manage your family tributes</p>
    <div class="role-badge">
      <span>Role: {userRoleDisplay}</span>
    </div>
  </header>
  
  {#if hasError}
    <div class="error-message">
      <p>❌ {errorMessage}</p>
    </div>
  {/if}
  
  {#if successMessage}
    <div class="success-message">
      <p>✅ {successMessage}</p>
    </div>
  {/if}
  
  <div class="dashboard-actions">
    {#if !isCreating}
      {#if isFuneralDirector}
        <button class="button create-button" onclick={toggleCreateForm}>
          <span class="icon">➕</span> Add New Tribute
        </button>
        <button class="button secondary-button">
          <span class="icon">👥</span> Manage Users
        </button>
      {:else if isFamilyContact}
        <div class="info-message">
          <p>As a Family Contact, you can manage existing tributes but cannot create new ones.</p>
        </div>
      {:else}
        <div class="info-message">
          <p>Your current role does not allow creating new tributes.</p>
        </div>
      {/if}
    {:else}
      <div class="create-form">
        <h2>Create New Tribute</h2>
        <div class="form-group">
          <label for="new-tribute-name">
            Tribute Name <span class="required">*</span>
          </label>
          <input
            type="text"
            id="new-tribute-name"
            bind:value={newTributeName}
            placeholder="Enter tribute name"
            class:error={nameError !== ''}
            disabled={isSubmitting}
            required
          />
          {#if nameError !== ''}
            <p class="input-error">{nameError}</p>
          {/if}
        </div>
        
        <div class="form-actions">
          <button
            type="button"
            class="button secondary-button"
            onclick={toggleCreateForm}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            class="button"
            onclick={createTribute}
            disabled={!formValid || isSubmitting}
          >
            {#if isSubmitting}
              <span class="spinner"></span> Creating...
            {:else}
              Create Tribute
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Featured Livestream Card (First tribute with livestream data) -->
  {#if tributes.length > 0 && tributes.some(t => t.attributes.liveStreamDate)}
    {#each tributes.filter(t => t.attributes.liveStreamDate) as tribute, i}
      {#if i === 0}
        <div class="featured-livestream">
          <h2>Upcoming Livestream</h2>
          <div class="livestream-card">
            <div class="livestream-header">
              <h3>{tribute.attributes.name}</h3>
              <div class="livestream-badge">
                {tribute.attributes.packageInfo?.name || 'Standard Package'}
              </div>
            </div>
            
            <div class="livestream-details">
              <div class="detail-item">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">{formatDate(tribute.attributes.liveStreamDate)}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">⏰ Start Time:</span>
                <span class="detail-value">{tribute.attributes.liveStreamStartTime || 'Not set'}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">
                  {tribute.attributes.liveStreamDuration || 1} hour{tribute.attributes.liveStreamDuration !== 1 ? 's' : ''}
                </span>
              </div>
              
              {#if tribute.attributes.priceTotal}
                <div class="detail-item">
                  <span class="detail-label">💰 Total Cost:</span>
                  <span class="detail-value">{formatCurrency(tribute.attributes.priceTotal)}</span>
                </div>
              {/if}
            </div>
            
            {#if tribute.attributes.locations && tribute.attributes.locations.length > 0}
              <div class="location-info">
                <h4>Primary Location</h4>
                <div class="location-card">
                  <p class="location-name">{tribute.attributes.locations[0].name}</p>
                  <p class="location-address">{tribute.attributes.locations[0].address}</p>
                  <div class="location-time">
                    <span>Start: {tribute.attributes.locations[0].startTime}</span>
                    <span>Duration: {tribute.attributes.locations[0].duration} hour{tribute.attributes.locations[0].duration !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            {/if}
            
            <div class="livestream-actions">
              <button class="button" onclick={() => goToCalculator(tribute.id)}>
                <span class="icon">📝</span> Change Schedule
              </button>
              <a href={`/${tribute.attributes.slug}`} class="button secondary-button">
                <span class="icon">👁️</span> View Tribute
              </a>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  {/if}
  
  <!-- Schedule Table -->
  {#if tributes.some(t => t.attributes.locations && t.attributes.locations.length > 0)}
    <div class="schedule-section">
      <h2>Your Schedule</h2>
      <div class="schedule-table-container">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Tribute</th>
              <th>Date</th>
              <th>Location</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each tributes as tribute}
              {#if tribute.attributes.locations && tribute.attributes.locations.length > 0}
                {#each tribute.attributes.locations as location, locationIndex}
                  <tr>
                    <td>{tribute.attributes.name}</td>
                    <td>{formatDate(tribute.attributes.liveStreamDate)}</td>
                    <td>
                      <div class="location-cell">
                        <span class="location-name">{location.name}</span>
                        <span class="location-address">{location.address}</span>
                      </div>
                    </td>
                    <td>{location.startTime || 'Not set'}</td>
                    <td>{location.duration || 1} hour{location.duration !== 1 ? 's' : ''}</td>
                    <td>
                      <div class="table-actions">
                        <button class="button small-button" onclick={() => goToCalculator(tribute.id)}>
                          Edit
                        </button>
                        <a href={`/${tribute.attributes.slug}`} class="button small-button secondary-button">
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
  
  <div class="tributes-container">
    <h2>Your Tributes</h2>
    
    {#if tributes.length === 0}
      <div class="empty-state">
        <p>You don't have any tributes yet.</p>
        {#if !isCreating}
          <button class="button" onclick={toggleCreateForm}>Create your first tribute</button>
        {/if}
      </div>
    {:else}
      <div class="tributes-grid">
        {#each tributes as tribute (tribute.id)}
          <div class="tribute-card">
            {#if isEditing === tribute.id}
              <div class="edit-form">
                <div class="form-group">
                  <label for="edit-name">
                    Tribute Name <span class="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    bind:value={editName}
                    placeholder="Enter tribute name"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div class="card-actions">
                  <button
                    type="button"
                    class="button secondary-button"
                    onclick={cancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="button"
                    onclick={saveEdit}
                    disabled={editName.trim().length < 2 || isSubmitting}
                  >
                    {#if isSubmitting}
                      <span class="spinner"></span> Saving...
                    {:else}
                      Save
                    {/if}
                  </button>
                </div>
              </div>
            {:else if isDeleting === tribute.id}
              <div class="delete-confirmation">
                <p>Are you sure you want to delete <strong>{tribute.attributes.name}</strong>?</p>
                <p class="warning">This action cannot be undone.</p>
                
                <div class="card-actions">
                  <button
                    type="button"
                    class="button secondary-button"
                    onclick={cancelDelete}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="button danger-button"
                    onclick={deleteTribute}
                    disabled={isSubmitting}
                  >
                    {#if isSubmitting}
                      <span class="spinner"></span> Deleting...
                    {:else}
                      Delete
                    {/if}
                  </button>
                </div>
              </div>
            {:else}
              <h3 class="tribute-name">{tribute.attributes.name}</h3>
              <p class="tribute-slug">/{tribute.attributes.slug}</p>
              
              {#if tribute.attributes.packageId}
                <div class="package-badge">
                  {tribute.attributes.packageInfo?.name || 'Standard Package'}
                </div>
              {/if}
              
              {#if tribute.attributes.liveStreamDate}
                <div class="tribute-schedule">
                  <p>📅 {formatDate(tribute.attributes.liveStreamDate)}</p>
                  <p>⏰ {tribute.attributes.liveStreamStartTime || 'Time not set'}</p>
                </div>
              {/if}
              
              <div class="card-actions">
                <!-- All roles can view tributes -->
                <a
                  href={`/${tribute.attributes.slug}`}
                  class="button icon-button"
                  title="View tribute"
                >
                  👁️
                </a>
                
                <!-- Both Funeral Directors and Family Contacts can edit tributes -->
                <button
                  type="button"
                  class="button icon-button"
                  onclick={() => startEdit(tribute)}
                  title="Edit tribute"
                >
                  ✏️
                </button>
                
                <!-- Schedule button -->
                <button
                  type="button"
                  class="button icon-button"
                  onclick={() => goToCalculator(tribute.id)}
                  title="Schedule livestream"
                >
                  📅
                </button>
                
                <!-- Only Funeral Directors can delete tributes -->
                {#if isFuneralDirector}
                  <button
                    type="button"
                    class="button icon-button danger"
                    onclick={() => confirmDelete(tribute)}
                    title="Delete tribute"
                  >
                    🗑️
                  </button>
                  
                  <!-- Additional Funeral Director actions -->
                  <button
                    type="button"
                    class="button icon-button"
                    title="Publish/Unpublish tribute"
                  >
                    📢
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .dashboard-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  header {
    margin-bottom: 2rem;
    text-align: center;
  }
  
  header h1 {
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  header p {
    color: #666;
    font-size: 1.1rem;
  }
  
  .dashboard-actions {
    margin-bottom: 2rem;
  }
  
  /* Featured Livestream */
  .featured-livestream {
    margin-bottom: 2rem;
  }
  
  .featured-livestream h2 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
  }
  
  .livestream-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    background-color: #f0f7ff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .livestream-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 0.75rem;
  }
  
  .livestream-header h3 {
    margin: 0;
    color: #1565c0;
    font-size: 1.5rem;
  }
  
  .livestream-badge {
    background-color: #1565c0;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .livestream-details {
    margin-bottom: 1.5rem;
  }
  
  .detail-item {
    display: flex;
    margin-bottom: 0.5rem;
  }
  
  .detail-label {
    width: 120px;
    font-weight: 600;
    color: #555;
  }
  
  .detail-value {
    flex: 1;
    color: #333;
  }
  
  .location-info {
    margin-bottom: 1.5rem;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
  }
  
  .location-info h4 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: #333;
    font-size: 1.1rem;
  }
  
  .location-card {
    background-color: white;
    border-radius: 6px;
    padding: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .location-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .location-address {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .location-time {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #555;
  }
  
  .livestream-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  /* Schedule Table */
  .schedule-section {
    margin-bottom: 2rem;
  }
  
  .schedule-section h2 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
  }
  
  .schedule-table-container {
    overflow-x: auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .schedule-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
  }
  
  .schedule-table th {
    background-color: #f5f5f5;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .schedule-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e0e0e0;
    color: #333;
  }
  
  .schedule-table tr:last-child td {
    border-bottom: none;
  }
  
  .schedule-table tr:hover {
    background-color: #f9f9f9;
  }
  
  .location-cell {
    display: flex;
    flex-direction: column;
  }
  
  .location-cell .location-name {
    margin-bottom: 0.25rem;
  }
  
  .location-cell .location-address {
    font-size: 0.85rem;
    color: #666;
  }
  
  .table-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .small-button {
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
  }
  
  /* Package Badge */
  .package-badge {
    display: inline-block;
    background-color: #1565c0;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  
  /* Tribute Schedule */
  .tribute-schedule {
    margin-bottom: 1rem;
    background-color: #f5f5f5;
    border-radius: 6px;
    padding: 0.75rem;
  }
  
  .tribute-schedule p {
    margin: 0.25rem 0;
    color: #555;
    font-size: 0.9rem;
  }
  
  .tributes-container {
    margin-top: 2rem;
  }
  
  .tributes-container h2 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
  }
  
  .tributes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .tribute-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    background-color: #f9f9f9;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .tribute-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  .tribute-name {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #333;
    font-size: 1.25rem;
  }
  
  .tribute-slug {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
  
  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    background-color: #f5f5f5;
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  .empty-state p {
    margin-bottom: 1rem;
    color: #666;
  }
  
  .create-form, .edit-form {
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .create-form h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.25rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .required {
    color: #e53935;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
  
  input.error {
    border-color: #e53935;
    background-color: rgba(229, 57, 53, 0.05);
  }
  
  .input-error {
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }
  
  .button {
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }
  
  .button:hover {
    background-color: #1976d2;
  }
  
  .button:disabled {
    background-color: #90caf9;
    cursor: not-allowed;
  }
  
  .secondary-button {
    background-color: #e0e0e0;
    color: #333;
  }
  
  .secondary-button:hover {
    background-color: #d0d0d0;
  }
  
  .danger-button {
    background-color: #e53935;
  }
  
  .danger-button:hover {
    background-color: #c62828;
  }
  
  .icon-button {
    padding: 0.5rem;
    font-size: 1rem;
  }
  
  .icon-button.danger {
    background-color: #ffebee;
    color: #e53935;
  }
  
  .icon-button.danger:hover {
    background-color: #ffcdd2;
  }
  
  .create-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .icon {
    font-size: 1rem;
  }
  
  .delete-confirmation {
    text-align: center;
  }
  
  .delete-confirmation p {
    margin-bottom: 0.5rem;
  }
  
  .delete-confirmation .warning {
    color: #e53935;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
  
  .success-message {
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .success-message p {
    color: #2e7d32;
    margin: 0;
  }
  
  .error-message {
    background-color: #ffebee;
    border-left: 4px solid #e53935;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .error-message p {
    color: #c62828;
    margin: 0;
  }
  
  .info-message {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .info-message p {
    color: #0d47a1;
    margin: 0;
  }
  
  .role-badge {
    display: inline-block;
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }
  
  /* Loading spinner */
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .dashboard-container {
      padding: 1rem;
      margin: 1rem;
    }
    
    .tributes-grid {
      grid-template-columns: 1fr;
    }
  }
</style>