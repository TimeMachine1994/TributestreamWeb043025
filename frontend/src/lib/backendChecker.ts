/**
 * TributeStream Backend Availability Checker
 * 
 * This module provides functionality to check if the Strapi backend is available
 * and periodically retry connections. It exposes a Svelte store to track the
 * backend status.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import config, { getStrapiUrl } from './config';
import { createLogger } from './logger';

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

/**
 * Create a Svelte store for the backend status
 */
export const backendStatus = writable<BackendStatus>({
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
    // Using GET instead of HEAD as it's more reliable for Strapi endpoints
    const response = await fetch(`${strapiUrl}/api/tributes`, {
      method: 'GET',
      signal: controller.signal
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // Any response (even 403 Forbidden) means the server is running
    // We just need to know if Strapi is responding, not if we have access
    const available = response.status !== 404;
    
    // Update the status store
    backendStatus.update(status => ({
      ...status,
      available,
      lastChecked: new Date(),
      error: available ? null : `Backend responded with status ${response.status}`,
      retryCount: available ? 0 : status.retryCount
    }));

    if (available) {
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

    // Update the status store with more specific error messages
    backendStatus.update(status => ({
      ...status,
      available: false,
      lastChecked: new Date(),
      error: isTimeout
        ? 'Connection to backend timed out'
        : isConnectionRefused
          ? 'Backend server is not running or unreachable'
          : `Connection error: ${errorMessage}`,
      retryCount: status.retryCount
    }));

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

  // Get the current status
  let currentStatus: BackendStatus | undefined;
  const unsubscribe = backendStatus.subscribe(status => {
    currentStatus = status;
  });
  unsubscribe();
  
  // If we don't have status or we've reached the maximum number of retries, stop retrying
  if (!currentStatus || currentStatus.retryCount >= config.api.maxRetries) {
    logger.warning(`Maximum retry attempts (${config.api.maxRetries}) reached, stopping retries`);
    
    backendStatus.update(status => ({
      ...status,
      retryScheduled: false
    }));
    
    return;
  }

  // Schedule the next retry
  const retryInterval = config.api.retryInterval;
  const nextRetryCount = (currentStatus?.retryCount || 0) + 1;
  logger.info(`Scheduling retry in ${retryInterval}ms (attempt ${nextRetryCount}/${config.api.maxRetries})`);
  
  backendStatus.update(status => ({
    ...status,
    retryScheduled: true,
    retryCount: status.retryCount + 1
  }));

  // Set the retry timer
  retryTimer = setTimeout(async () => {
    logger.info(`Executing scheduled retry attempt ${nextRetryCount}/${config.api.maxRetries}`);
    
    // Check availability
    const available = await checkBackendAvailability();
    
    // If still not available, schedule another retry
    if (!available) {
      scheduleRetry();
    } else {
      // Reset retry count on success
      backendStatus.update(status => ({
        ...status,
        retryScheduled: false,
        retryCount: 0
      }));
      
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
  window.addEventListener('beforeunload', () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  });
}

/**
 * Force a check of backend availability
 * This can be called manually, e.g., from a "Retry" button in the UI
 */
export async function forceCheckBackendAvailability(): Promise<boolean> {
  logger.info('Forcing backend availability check');
  
  // Reset retry count
  backendStatus.update(status => ({
    ...status,
    retryCount: 0,
    retryScheduled: false
  }));
  
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