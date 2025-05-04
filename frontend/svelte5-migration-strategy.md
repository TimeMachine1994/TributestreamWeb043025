 n # Svelte 5 Runes Migration Strategy for TributeStream

This document outlines a comprehensive strategy for migrating TributeStream from traditional Svelte stores to Svelte 5 runes, with a particular focus on improving Strapi backend integration.

## 1. Executive Summary

We'll implement a phased migration approach, converting components and modules to leverage runes incrementally. The strategy is designed to:

- Improve state management performance with Svelte 5 runes
- Create consistent patterns for Strapi data fetching
- Enable better server/client data sharing
- Maintain backward compatibility during migration
- Minimize disruption to the application

## 2. Benefits of Svelte 5 Runes for Strapi Integration

Svelte 5 runes provide several significant advantages for our Strapi-backed application:

### Performance Improvements
- **Fine-grained reactivity**: Runes create more efficient reactive updates when data changes
- **Reduced bundle size**: No need to import store functions from separate modules
- **Faster rendering**: Better control over reactive state updates and component lifecycle

### Developer Experience
- **Simpler syntax**: Runes avoid the verbosity of store subscriptions and unsubscriptions
- **Consistent patterns**: Unified approach to state management across components
- **Type safety**: Better TypeScript integration with runes compared to stores
- **Improved code organization**: Clearer separation of concerns and data flow

### Strapi-Specific Benefits
- **Seamless data flow**: Better integration between server-loaded data and client state
- **Enhanced caching**: More control over which parts of Strapi data trigger updates
- **Reduced network requests**: Better state sharing between components
- **Optimistic UI updates**: Easier implementation of optimistic updates with Strapi

## 3. Core Architecture Patterns

### 3.1 Shared State with .svelte.js Files

For shared global state that needs to be accessed by multiple components (replacing writable stores):

```js
// src/lib/state/auth.svelte.js
export const user = $state(null);
export const isAuthenticated = $derived(!!user);

export function setUser(userData) {
  user = userData;
}

export function clearUser() {
  user = null;
}

// Optional reactive computations
export const userRole = $derived(user?.role?.type || 'guest');
export const userDisplayName = $derived(user?.username || 'Guest');
```

### 3.2 Module-Level API Integration

For Strapi API interactions:

```js
// src/lib/api/tributes.svelte.js
import { getStrapiUrl } from '$lib/config';

// Current fetch state
export const loading = $state(false);
export const error = $state(null);
export const tributes = $state([]);

// Get tributes from Strapi
export async function fetchTributes(token) {
  loading = true;
  error = null;
  
  try {
    const response = await fetch(`${getStrapiUrl()}/api/tributes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tributes: ${response.status}`);
    }
    
    const data = await response.json();
    tributes = data.data || [];
    return tributes;
  } catch (err) {
    error = err.message;
    return null;
  } finally {
    loading = false;
  }
}

// Create tribute in Strapi
export async function createTribute(tribute, token) {
  loading = true;
  error = null;
  
  try {
    const response = await fetch(`${getStrapiUrl()}/api/tributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data: tribute })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create tribute: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Update local state with new tribute
    tributes = [...tributes, result.data];
    
    return result.data;
  } catch (err) {
    error = err.message;
    return null;
  } finally {
    loading = false;
  }
}
```

### 3.3 Server-Loaded Data Pattern

For handling data from SvelteKit's load functions:

```svelte
<!-- Component.svelte -->
<script>
  // Receive server data with runes
  let { data } = $props<PageProps>();

  // Extract and enhance with local state
  let tributes = $derived(data.tributes || []);
  let filteredTributes = $state(tributes);
  let searchTerm = $state('');
  
  // Reactive filtering
  $effect(() => {
    if (!searchTerm) {
      filteredTributes = tributes;
    } else {
      filteredTributes = tributes.filter(tribute => 
        tribute.attributes.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });
</script>
```

### 3.4 Form Handling with Runes

For form state and validation:

```svelte
<script>
  import { createTributes } from '$lib/api/tributes.svelte.js';

  // Form state
  let formData = $state({
    name: '',
    description: '',
    date: ''
  });

  // Validation state
  let errors = $state({
    name: '',
    description: '',
    date: ''
  });
  
  // Derived validation state
  let isValid = $derived(
    !errors.name && 
    !errors.description && 
    !errors.date && 
    formData.name.length > 0
  );

  // Validate form fields
  $effect(() => {
    errors.name = formData.name.length < 3 
      ? 'Name must be at least 3 characters' 
      : '';
      
    errors.description = formData.description.length > 500 
      ? 'Description must be less than 500 characters' 
      : '';
      
    errors.date = !formData.date 
      ? 'Date is required' 
      : '';
  });

  // Form submission
  async function handleSubmit() {
    if (!isValid) return;
    
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='))
      ?.split('=')[1];
      
    if (!token) {
      errors.form = 'Authentication required';
      return;
    }
    
    const newTribute = await createTribute(formData, token);
    
    if (newTribute) {
      // Reset form or redirect
      formData = { name: '', description: '', date: '' };
    }
  }
</script>
```

### 3.5 Error Handling and Loading States

Standardized pattern for handling loading and error states:

```svelte
<script>
  import { fetchTributes, loading, error, tributes } from '$lib/api/tributes.svelte.js';
  
  async function loadData() {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='))
      ?.split('=')[1];
      
    await fetchTributes(token);
  }
  
  // Load data on mount
  $effect(() => {
    loadData();
  });
</script>

{#if loading}
  <LoadingSpinner />
{:else if error}
  <ErrorMessage message={error} onRetry={loadData} />
{:else if tributes.length === 0}
  <EmptyState message="No tributes found" />
{:else}
  <!-- Render tributes -->
  {#each tributes as tribute (tribute.id)}
    <TributeCard {tribute} />
  {/each}
{/if}
```

## 4. Migration Strategy

### 4.1 Phase 1: Preparation

1. **Create runes utility files**
   - Build helpers for common rune patterns
   - Create migration helpers for gradual transition

2. **Update TypeScript configuration**
   - Ensure compatibility with runes syntax
   - Add necessary type definitions

3. **Create shared state modules**
   - Implement `.svelte.js` files for global state
   - Build API integration modules

4. **Establish test coverage**
   - Implement unit tests for core functionality
   - Create migration validation tests

### 4.2 Phase 2: Core Infrastructure Migration

1. **Migrate backend checker**
   - Convert `backendChecker.ts` store to runes implementation
   - Update `BackendStatus.svelte` to use runes

2. **Create API integration modules**
   - Implement `tributes.svelte.js` for tribute API interactions
   - Implement `auth.svelte.js` for authentication

3. **Update utility functions**
   - Refactor helpers to work with runes
   - Create new utility functions specific to runes

4. **Refactor shared components**
   - Update `Navbar.svelte` to use runes
   - Other widely used components

### 4.3 Phase 3: Feature Migration

1. **Migrate calculator page**
   - Convert local state to runes (already done)
   - Implement form validation with runes
   - Connect to Strapi using runes-based API modules

2. **Migrate family dashboard**
   - Convert remaining local state to runes
   - Update data fetching to use runes modules
   - Implement optimistic UI updates

3. **Migrate tribute creation/editing flows**
   - Implement form handling with runes
   - Add validation with reactive effects
   - Connect to Strapi API

4. **Update remaining pages**
   - Systematically migrate remaining components
   - Update tests to validate functionality

### 4.4 Phase 4: Optimization & Cleanup

1. **Implement caching layer**
   - Add SvelteKit's caching mechanisms
   - Implement data prefetching

2. **Performance optimization**
   - Audit and improve reactive dependencies
   - Implement lazy loading where beneficial

3. **Remove deprecated code**
   - Clean up old store implementations
   - Remove transition helpers

4. **Documentation & knowledge sharing**
   - Document patterns and best practices
   - Create examples for team reference

## 5. Specific Migration Examples

### 5.1 Converting backendChecker.ts

**Current implementation:**

```typescript
export const backendStatus = writable<BackendStatus>({
  available: false,
  lastChecked: null,
  error: null,
  retryCount: 0,
  retryScheduled: false
});

// Update the store in functions
backendStatus.update(status => ({
  ...status,
  available: true,
  lastChecked: new Date()
}));
```

**Migrated implementation:**

```typescript
// backend.svelte.js
export const status = $state<BackendStatus>({
  available: false,
  lastChecked: null,
  error: null,
  retryCount: 0,
  retryScheduled: false
});

// Update the state directly
export function updateStatus(available: boolean) {
  status.available = available;
  status.lastChecked = new Date();
  
  // Reset error if available
  if (available) {
    status.error = null;
  }
}
```

### 5.2 Converting a Component

**Current implementation:**

```svelte
<script>
  import { backendStatus } from '$lib/backendChecker';
  
  let isRetrying = false;
  
  async function handleRetry() {
    isRetrying = true;
    await forceCheckBackendAvailability();
    isRetrying = false;
  }
</script>

{#if $backendStatus && !$backendStatus.available}
  <div class="alert">
    <p>{$backendStatus.error}</p>
    <button on:click={handleRetry}>Retry</button>
  </div>
{/if}
```

**Migrated implementation:**

```svelte
<script>
  import { status, forceCheckBackendAvailability } from '$lib/state/backend.svelte.js';
  
  let isRetrying = $state(false);
  
  async function handleRetry() {
    isRetrying = true;
    await forceCheckBackendAvailability();
    isRetrying = false;
  }
</script>

{#if !status.available}
  <div class="alert">
    <p>{status.error}</p>
    <button onclick={handleRetry}>Retry</button>
  </div>
{/if}
```

### 5.3 Server-loaded Data Pattern

**Current approach:**

```svelte
<script>
  export let data;
  
  let tributes = [];
  let loading = false;
  
  $: tributes = data.tributes || [];
</script>
```

**Migrated approach:**

```svelte
<script>
  let { data } = $props<PageProps>();
  
  let tributes = $derived(data.tributes || []);
  let loading = $state(false);
  
  // Additional derived values
  let totalTributes = $derived(tributes.length);
  let userHasTributes = $derived(totalTributes > 0);
</script>
```

## 6. Handling Data Flow with Strapi

### 6.1 Server-Side Data Loading

1. **SvelteKit load functions fetch data from Strapi**
   - Authentication via JWT token
   - Data transformation in server-side code
   - Type validation before sending to client

2. **Data passed to components via props**
   - Use `$props()` rune to receive data
   - Extract into reactive state with `$derived` and `$state`

3. **Updates trigger reactivity**
   - Changes to props automatically update derived values
   - Effects run based on reactive dependencies

### 6.2 Client-Side Data Updates

1. **User interactions trigger state changes**
   - Local state updates immediately for optimistic UI
   - API calls made to persist changes to Strapi

2. **Strapi responses update local state**
   - Success responses update local state with server data
   - Error responses restore previous state or show error messages

3. **Shared state modules maintain consistency**
   - `.svelte.js` modules share state across components
   - `$effect` runs to synchronize related state

### 6.3 Offline/Caching Strategy

1. **Implement local caching**
   - Use SvelteKit's built-in caching for API responses
   - Store frequently-accessed data in runes state

2. **Offline detection**
   - Track connection status with runes
   - Queue updates for when connection is restored

3. **Background synchronization**
   - Periodically check for changes when online
   - Update local state when new data is available

## 7. Potential Challenges and Solutions

### 7.1 Performance with Large Data Sets

**Challenge**: Large data sets from Strapi may cause performance issues with naive reactivity.

**Solution**: 
- Use `$state.raw` for large objects that don't need deep reactivity
- Implement virtualization for long lists
- Use pagination and lazy loading for large data sets

### 7.2 Server/Client State Consistency

**Challenge**: Keeping server and client state in sync can be complex.

**Solution**:
- Use server actions for data mutations
- Implement optimistic UI patterns with rollback on error
- Clear validation and consistent error handling

### 7.3 Migration Complexity

**Challenge**: Partial migration may lead to inconsistent patterns.

**Solution**:
- Create adapter functions to bridge old and new patterns
- Implement feature flags to enable new functionality gradually
- Comprehensive testing to catch integration issues

### 7.4 Learning Curve

**Challenge**: Team members may need time to adjust to runes syntax.

**Solution**:
- Create documentation with clear examples
- Pair programming sessions for knowledge sharing
- Code reviews focused on runes patterns

## 8. Conclusion

Migrating to Svelte 5 runes will significantly improve the TributeStream application's performance and developer experience. The phased approach allows for incremental adoption while maintaining application stability.

By addressing Strapi integration specifically, we can create a more robust data flow between our frontend and backend, resulting in a more responsive and maintainable application.

## Next Steps

1. Begin with the preparation phase, creating utility files and establishing test coverage
2. Migrate core infrastructure to establish patterns
3. Implement feature migrations based on priority
4. Optimize and clean up the codebase

## 9. Appendix: Concrete Implementation Examples

### 9.1 Backend Status Module

```js
// src/lib/state/backend.svelte.js
import { browser } from '$app/environment';
import config, { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger for the backend checker
const logger = createLogger('BackendChecker');

/**
 * Backend status interface
 */
export interface BackendStatus {
  available: boolean;        // Whether the backend is currently available
  lastChecked: Date | null;  // When the last check was performed
  error: string | null;      // Error message if the backend is unavailable
  retryCount: number;        // Number of retry attempts made
  retryScheduled: boolean;   // Whether a retry is scheduled
}

// Reactive state using runes
export const status = $state<BackendStatus>({
  available: false,
  lastChecked: null,
  error: null,
  retryCount: 0,
  retryScheduled: false
});

// Store the retry timer ID for cleanup
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Check if the backend is available
 * @returns Promise that resolves to true if the backend is available, false otherwise
 */
export async function checkBackendAvailability(): Promise<boolean> {
  if (!browser) {
    // Skip checking in SSR context
    return true;
  }

  const strapiUrl = getStrapiUrl();
  logger.info(`Checking backend availability`, { url: `${strapiUrl}/api/tributes` });

  try {
    // Use AbortController to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);

    // Make a GET request to the tributes endpoint
    const response = await fetch(`${strapiUrl}/api/tributes`, {
      method: 'GET',
      signal: controller.signal
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // Any response (even 403 Forbidden) means the server is running
    const available = response.status !== 404;
    
    // Update the status directly with runes
    status.available = available;
    status.lastChecked = new Date();
    status.error = available ? null : `Backend responded with status ${response.status}`;
    
    if (available) {
      // Reset retry count on success
      status.retryCount = 0;
      logger.success(`Backend is available`);
    } else {
      logger.warning(`Backend responded with status ${response.status}`);
    }

    return available;
  } catch (error) {
    // Handle fetch errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('abort');
    const isConnectionRefused = errorMessage.includes('ECONNREFUSED');
    
    logger.error(`Backend availability check failed`, {
      error: errorMessage,
      isTimeout,
      isConnectionRefused
    });

    // Update the state directly
    status.available = false;
    status.lastChecked = new Date();
    status.error = isTimeout
      ? 'Connection to backend timed out'
      : isConnectionRefused
        ? 'Backend server is not running or unreachable'
        : `Connection error: ${errorMessage}`;

    return false;
  }
}

/**
 * Schedule a retry of the backend availability check
 */
function scheduleRetry(): void {
  // Clear any existing timer
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  // If we've reached the maximum number of retries, stop retrying
  if (status.retryCount >= config.api.maxRetries) {
    logger.warning(`Maximum retry attempts (${config.api.maxRetries}) reached, stopping retries`);
    status.retryScheduled = false;
    return;
  }

  // Schedule the next retry
  const retryInterval = config.api.retryInterval;
  const nextRetryCount = status.retryCount + 1;
  logger.info(`Scheduling retry in ${retryInterval}ms (attempt ${nextRetryCount}/${config.api.maxRetries})`);
  
  // Update state
  status.retryScheduled = true;
  status.retryCount += 1;

  // Set the retry timer
  retryTimer = setTimeout(async () => {
    logger.info(`Executing scheduled retry attempt ${nextRetryCount}/${config.api.maxRetries}`);
    
    // Check availability
    const available = await checkBackendAvailability();
    
    // If still not available, schedule another retry
    if (!available) {
      scheduleRetry();
    } else {
      // Reset retry count and scheduled status
      status.retryScheduled = false;
      status.retryCount = 0;
      logger.success('Backend is now available after retry');
    }
  }, retryInterval);
}

/**
 * Initialize the backend checker
 * This should be called once when the application starts
 */
export function initBackendChecker(): void {
  if (!browser || !config.features.enableBackendCheck) {
    return;
  }

  logger.info('Initializing backend availability checker');
  
  // Perform an initial check
  checkBackendAvailability().then(available => {
    if (!available) {
      // If not available, schedule a retry
      scheduleRetry();
    }
  });

  // Clean up on page unload
  if (browser) {
    window.addEventListener('beforeunload', () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    });
  }
}

/**
 * Force a check of backend availability
 * This can be called manually, e.g., from a "Retry" button in the UI
 */
export async function forceCheckBackendAvailability(): Promise<boolean> {
  logger.info('Forcing backend availability check');
  
  // Reset retry count
  status.retryCount = 0;
  status.retryScheduled = false;
  
  // Clear any existing timer
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  
  // Perform the check
  const available = await checkBackendAvailability();
  
  // If not available, schedule a retry
  if (!available) {
    scheduleRetry();
  }
  
  return available;
}
```

### 9.2 BackendStatus Component Migration

```svelte
<!--
  BackendStatus Component - Migrated to Svelte 5 Runes
  
  This component initializes the backend availability checker and displays
  a status message when the backend is unavailable. It also provides a
  retry button to manually check the backend availability.
-->
<script>
  import { onMount } from 'svelte';
  import { status, initBackendChecker, forceCheckBackendAvailability } from '$lib/state/backend.svelte.js';
  import config from '$lib/config';
  
  // Local state using runes
  let isRetrying = $state(false);
  
  // Initialize the backend checker on mount
  onMount(() => {
    if (config.features.enableBackendCheck) {
      initBackendChecker();
    }
  });
  
  // Handle retry button click
  async function handleRetry() {
    isRetrying = true;
    await forceCheckBackendAvailability();
    isRetrying = false;
  }
</script>

{#if !status.available}
  <div class="backend-status-alert" role="alert">
    <div class="alert-content">
      <div class="alert-icon">⚠️</div>
      <div class="alert-message">
        <strong>Backend Connection Issue</strong>
        <p>{status.error || 'Cannot connect to the backend service'}</p>
        <div class="alert-tips">
          <strong>Troubleshooting Tips:</strong>
          <ul>
            <li>Check if the backend server is running</li>
            <li>Verify your network connection</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
      <button
        class="retry-button"
        onclick={handleRetry}
        disabled={isRetrying || status.retryScheduled}
      >
        {#if isRetrying}
          <span class="spinner"></span> Retrying...
        {:else if status.retryScheduled}
          Retrying soon...
        {:else}
          Retry Now
        {/if}
      </button>
    </div>
    
    {#if status.retryScheduled}
      <div class="retry-info">
        Automatic retry in progress (attempt {status.retryCount}/{config.api.maxRetries})
      </div>
    {/if}
  </div>
{/if}
```

### 9.3 Tributes API Module

```js
// src/lib/api/tributes.svelte.js
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger
const logger = createLogger('TributesAPI');

// State for API operations
export const loading = $state(false);
export const error = $state(null);
export const tributes = $state([]);

// Derived values
export const tributeCount = $derived(tributes.length);
export const hasTributes = $derived(tributeCount > 0);
export const loadingOrError = $derived(loading || error);

/**
 * Fetch tributes from Strapi
 * @param {string} token JWT authentication token
 * @returns {Promise<Array|null>} Tributes or null on error
 */
export async function fetchTributes(token) {
  loading = true;
  error = null;
  
  try {
    logger.info("Fetching tributes from API");
    const response = await fetch(`${getStrapiUrl()}/api/tributes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response to expected format
    const transformedTributes = (result.data || []).map(tribute => ({
      id: tribute.id,
      attributes: {
        name: tribute.name,
        slug: tribute.slug,
        createdAt: tribute.createdAt,
        updatedAt: tribute.updatedAt,
        packageId: tribute.packageId,
        liveStreamDate: tribute.liveStreamDate,
        liveStreamStartTime: tribute.liveStreamStartTime,
        liveStreamDuration: tribute.liveStreamDuration,
        locations: tribute.locations || [],
        priceTotal: tribute.priceTotal
      }
    }));
    
    // Update state
    tributes = transformedTributes;
    logger.success(`Retrieved ${tributes.length} tributes`);
    
    return tributes;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error fetching tributes", { error: errorMessage });
    error = errorMessage;
    return null;
  } finally {
    loading = false;
  }
}

/**
 * Create a new tribute
 * @param {Object} tributeData Tribute data to create
 * @param {string} token JWT authentication token
 * @returns {Promise<Object|null>} Created tribute or null on error
 */
export async function createTribute(tributeData, token) {
  loading = true;
  error = null;
  
  try {
    logger.info("Creating tribute", { name: tributeData.name });
    
    // Generate slug from name
    const baseSlug = tributeData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    
    const response = await fetch(`${getStrapiUrl()}/api/tributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        data: {
          name: tributeData.name,
          slug: baseSlug,
          description: tributeData.description || `Tribute for ${tributeData.name}`,
          status: tributeData.status || 'draft'
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response
    const newTribute = {
      id: result.data.id,
      attributes: {
        name: result.data.attributes.name,
        slug: result.data.attributes.slug,
        ...result.data.attributes
      }
    };
    
    // Update local state
    tributes = [...tributes, newTribute];
    
    logger.success("Tribute created successfully", { id: newTribute.id });
    return newTribute;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error creating tribute", { error: errorMessage });
    error = errorMessage;
    return null;
  } finally {
    loading = false;
  }
}

/**
 * Update an existing tribute
 * @param {string} id Tribute ID
 * @param {Object} updates Object with fields to update
 * @param {string} token JWT authentication token
 * @returns {Promise<Object|null>} Updated tribute or null on error
 */
export async function updateTribute(id, updates, token) {
  loading = true;
  error = null;
  
  try {
    logger.info("Updating tribute", { id, updates });
    
    const response = await fetch(`${getStrapiUrl()}/api/tributes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data: updates })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response
    const updatedTribute = {
      id: result.data.id,
      attributes: {
        name: result.data.attributes.name,
        slug: result.data.attributes.slug,
        ...result.data.attributes
      }
    };
    
    // Update local state - replace the tribute in the array
    tributes = tributes.map(tribute =>
      tribute.id === id ? updatedTribute : tribute
    );
    
    logger.success("Tribute updated successfully", { id });
    return updatedTribute;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error updating tribute", { id, error: errorMessage });
    error = errorMessage;
    return null;
  } finally {
    loading = false;
  }
}

/**
 * Delete a tribute
 * @param {string} id Tribute ID to delete
 * @param {string} token JWT authentication token
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTribute(id, token) {
  loading = true;
  error = null;
  
  try {
    logger.info("Deleting tribute", { id });
    
    const response = await fetch(`${getStrapiUrl()}/api/tributes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    // Update local state - remove the tribute from the array
    tributes = tributes.filter(tribute => tribute.id !== id);
    
    logger.success("Tribute deleted successfully", { id });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error deleting tribute", { id, error: errorMessage });
    error = errorMessage;
    return false;
  } finally {
    loading = false;
  }
}

/**
 * Load tribute details (locations, media, etc.)
 * @param {string} id Tribute ID
 * @param {string} token JWT authentication token
 * @returns {Promise<Object|null>} Tribute details or null on error
 */
export async function loadTributeDetails(id, token) {
  loading = true;
  error = null;
  
  try {
    logger.info("Loading tribute details", { id });
    
    const response = await fetch(`${getStrapiUrl()}/api/tributes/${id}?populate=locations,mediaItems`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response
    const tributeDetails = {
      id: result.data.id,
      attributes: {
        name: result.data.attributes.name,
        slug: result.data.attributes.slug,
        locations: result.data.attributes.locations || [],
        mediaItems: result.data.attributes.mediaItems || [],
        ...result.data.attributes
      }
    };
    
    // Update local state - update the tribute in the array with details
    tributes = tributes.map(tribute =>
      tribute.id === id ? tributeDetails : tribute
    );
    
    logger.success("Tribute details loaded successfully", {
      id,
      locationsCount: tributeDetails.attributes.locations.length,
      mediaCount: tributeDetails.attributes.mediaItems.length
    });
    
    return tributeDetails;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error loading tribute details", { id, error: errorMessage });
    error = errorMessage;
    return null;
  } finally {
    loading = false;
  }
}
```