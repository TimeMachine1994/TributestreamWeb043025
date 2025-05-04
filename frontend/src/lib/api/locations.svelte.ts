/**
 * Locations API Module - Svelte 5 Runes Implementation
 * 
 * This module provides functionality to interact with tribute locations
 * using Svelte 5 runes for state management.
 */

import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger
const logger = createLogger('LocationsAPI');

/**
 * Location interface
 */
export interface Location {
  id: string;
  name: string;
  address: string;
  startTime: string;
  duration: number;
  tributeId?: string;
  [key: string]: any;
}

// State for API operations
export const locationsState = $state<{
  loading: boolean;
  error: string | null;
  locations: Location[];
}>({
  loading: false,
  error: null,
  locations: []
});

// Getter functions for state
export function getLoading(): boolean {
  return locationsState.loading;
}

export function getError(): string | null {
  return locationsState.error;
}

export function getLocations(): Location[] {
  return locationsState.locations;
}

// Derived value getter functions
export function getLocationCount(): number {
  return locationsState.locations.length;
}

export function getHasLocations(): boolean {
  return getLocationCount() > 0;
}

/**
 * Fetch locations for a tribute
 * @param tributeId Tribute ID
 * @param token JWT authentication token
 * @returns Locations or null on error
 */
export async function fetchLocations(tributeId: string, token: string): Promise<Location[] | null> {
  locationsState.loading = true;
  locationsState.error = null;
  
  try {
    logger.info("🔍 Fetching locations for tribute", { tributeId });
    const response = await fetch(`${getStrapiUrl()}/api/tributes/${tributeId}?populate=locations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Extract locations from the response
    const tributeLocations = result.data?.attributes?.locations || [];
    
    // Transform API response to expected format
    const transformedLocations = tributeLocations.map((location: any) => ({
      id: location.id,
      name: location.name,
      address: location.address,
      startTime: location.startTime,
      duration: location.duration,
      tributeId: tributeId
    }));
    
    // Update state
    locationsState.locations = transformedLocations;
    logger.success(`✅ Retrieved ${locationsState.locations.length} locations for tribute ${tributeId}`);
    
    return locationsState.locations;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error fetching locations", { tributeId, error: errorMessage });
    locationsState.error = errorMessage;
    return null;
  } finally {
    locationsState.loading = false;
  }
}

/**
 * Create a new location for a tribute
 * @param tributeId Tribute ID
 * @param locationData Location data
 * @param token JWT authentication token
 * @returns Created location or null on error
 */
export async function createLocation(
  tributeId: string,
  locationData: Omit<Location, 'id'>,
  token: string
): Promise<Location | null> {
  locationsState.loading = true;
  locationsState.error = null;
  
  try {
    logger.info("📝 Creating location for tribute", { tributeId, name: locationData.name });
    
    const response = await fetch(`${getStrapiUrl()}/api/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        data: {
          ...locationData,
          tribute: tributeId
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response
    const newLocation: Location = {
      id: result.data.id,
      name: result.data.attributes.name,
      address: result.data.attributes.address,
      startTime: result.data.attributes.startTime,
      duration: result.data.attributes.duration,
      tributeId: tributeId
    };
    
    // Update local state
    locationsState.locations = [...locationsState.locations, newLocation];
    
    logger.success("✅ Location created successfully", { id: newLocation.id });
    return newLocation;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error creating location", { tributeId, error: errorMessage });
    locationsState.error = errorMessage;
    return null;
  } finally {
    locationsState.loading = false;
  }
}

/**
 * Update an existing location
 * @param locationId Location ID
 * @param updates Object with fields to update
 * @param token JWT authentication token
 * @returns Updated location or null on error
 */
export async function updateLocation(
  locationId: string,
  updates: Partial<Location>,
  token: string
): Promise<Location | null> {
  locationsState.loading = true;
  locationsState.error = null;
  
  try {
    logger.info("🔄 Updating location", { locationId, updates });
    
    const response = await fetch(`${getStrapiUrl()}/api/locations/${locationId}`, {
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
    const updatedLocation: Location = {
      id: result.data.id,
      name: result.data.attributes.name,
      address: result.data.attributes.address,
      startTime: result.data.attributes.startTime,
      duration: result.data.attributes.duration,
      tributeId: result.data.attributes.tribute?.data?.id
    };
    
    // Update local state - replace the location in the array
    locationsState.locations = locationsState.locations.map(location =>
      location.id === locationId ? updatedLocation : location
    );
    
    logger.success("✅ Location updated successfully", { id: locationId });
    return updatedLocation;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error updating location", { locationId, error: errorMessage });
    locationsState.error = errorMessage;
    return null;
  } finally {
    locationsState.loading = false;
  }
}

/**
 * Delete a location
 * @param locationId Location ID to delete
 * @param token JWT authentication token
 * @returns Success status
 */
export async function deleteLocation(locationId: string, token: string): Promise<boolean> {
  locationsState.loading = true;
  locationsState.error = null;
  
  try {
    logger.info("🗑️ Deleting location", { locationId });
    
    const response = await fetch(`${getStrapiUrl()}/api/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    // Update local state - remove the location from the array
    locationsState.locations = locationsState.locations.filter(location => location.id !== locationId);
    
    logger.success("✅ Location deleted successfully", { id: locationId });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error deleting location", { locationId, error: errorMessage });
    locationsState.error = errorMessage;
    return false;
  } finally {
    locationsState.loading = false;
  }
}

/**
 * Clear the locations state
 * Useful when changing tributes or logging out
 */
export function clearLocations(): void {
  locationsState.locations = [];
  locationsState.error = null;
  locationsState.loading = false;
}