/**
 * Tributes API Module - Svelte 5 Runes Implementation
 * 
 * This module provides functionality to interact with the Tributes API
 * using Svelte 5 runes for state management.
 */

import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger
const logger = createLogger('TributesAPI');

/**
 * Tribute interface
 */
export interface Tribute {
  id: string;
  attributes: {
    name: string;
    slug: string;
    createdAt?: string;
    updatedAt?: string;
    packageId?: string;
    liveStreamDate?: string;
    liveStreamStartTime?: string;
    liveStreamDuration?: string;
    locations?: any[];
    priceTotal?: number;
    [key: string]: any;
  };
}

// State for API operations
export const tributesState = $state<{
  loading: boolean;
  error: string | null;
  tributes: Tribute[];
}>({
  loading: false,
  error: null,
  tributes: []
});

// Getter functions for state
export function getLoading(): boolean {
  return tributesState.loading;
}

export function getError(): string | null {
  return tributesState.error;
}

export function getTributes(): Tribute[] {
  return tributesState.tributes;
}

// Derived value getter functions
export function getTributeCount(): number {
  return tributesState.tributes.length;
}

export function getHasTributes(): boolean {
  return getTributeCount() > 0;
}

export function getLoadingOrError(): boolean {
  return tributesState.loading || !!tributesState.error;
}

/**
 * Fetch tributes from Strapi
 * @param token JWT authentication token
 * @returns Tributes or null on error
 */
export async function fetchTributes(token: string): Promise<Tribute[] | null> {
  tributesState.loading = true;
  tributesState.error = null;
  
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
    const transformedTributes = (result.data || []).map((tribute: any) => ({
      id: tribute.id,
      attributes: {
        name: tribute.attributes.name,
        slug: tribute.attributes.slug,
        createdAt: tribute.attributes.createdAt,
        updatedAt: tribute.attributes.updatedAt,
        packageId: tribute.attributes.packageId,
        liveStreamDate: tribute.attributes.liveStreamDate,
        liveStreamStartTime: tribute.attributes.liveStreamStartTime,
        liveStreamDuration: tribute.attributes.liveStreamDuration,
        locations: tribute.attributes.locations || [],
        priceTotal: tribute.attributes.priceTotal
      }
    }));
    
    // Update state
    tributesState.tributes = transformedTributes;
    logger.success(`Retrieved ${tributesState.tributes.length} tributes`);
    
    return tributesState.tributes;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error fetching tributes", { error: errorMessage });
    tributesState.error = errorMessage;
    return null;
  } finally {
    tributesState.loading = false;
  }
}

/**
 * Create a new tribute
 * @param tributeData Tribute data to create
 * @param token JWT authentication token
 * @returns Created tribute or null on error
 */
export async function createTribute(
  tributeData: { name: string; description?: string; status?: string },
  token: string
): Promise<Tribute | null> {
  tributesState.loading = true;
  tributesState.error = null;
  
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
    const newTribute: Tribute = {
      id: result.data.id,
      attributes: {
        name: result.data.attributes.name,
        slug: result.data.attributes.slug,
        ...result.data.attributes
      }
    };
    
    // Update local state
    tributesState.tributes = [...tributesState.tributes, newTribute];
    
    logger.success("Tribute created successfully", { id: newTribute.id });
    return newTribute;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error creating tribute", { error: errorMessage });
    tributesState.error = errorMessage;
    return null;
  } finally {
    tributesState.loading = false;
  }
}

/**
 * Get a single tribute by ID
 * @param id Tribute ID
 * @param token JWT authentication token
 * @returns Tribute or null if not found
 */
export async function getTributeById(id: string, token: string): Promise<Tribute | null> {
  // First check if we already have it in our local state
  const existingTribute = tributesState.tributes.find(tribute => tribute.id === id);
  if (existingTribute) {
    return existingTribute;
  }
  
  // Otherwise fetch it from the API
  tributesState.loading = true;
  tributesState.error = null;
  
  try {
    logger.info("Fetching tribute by ID", { id });
    const response = await fetch(`${getStrapiUrl()}/api/tributes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response
    const tribute: Tribute = {
      id: result.data.id,
      attributes: {
        name: result.data.attributes.name,
        slug: result.data.attributes.slug,
        ...result.data.attributes
      }
    };
    
    // Add to local state if not already there
    if (!tributesState.tributes.some(t => t.id === tribute.id)) {
      tributesState.tributes = [...tributesState.tributes, tribute];
    }
    
    return tribute;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error fetching tribute", { id, error: errorMessage });
    tributesState.error = errorMessage;
    return null;
  } finally {
    tributesState.loading = false;
  }
}

/**
 * Get a tribute by slug
 * @param slug Tribute slug
 * @param token JWT authentication token
 * @returns Tribute or null if not found
 */
export async function getTributeBySlug(slug: string, token: string): Promise<Tribute | null> {
  // First check if we already have it in our local state
  const existingTribute = tributesState.tributes.find(tribute => tribute.attributes.slug === slug);
  if (existingTribute) {
    return existingTribute;
  }
  
  // Otherwise fetch it from the API
  tributesState.loading = true;
  tributesState.error = null;
  
  try {
    logger.info("Fetching tribute by slug", { slug });
    const response = await fetch(`${getStrapiUrl()}/api/tributes?filters[slug][$eq]=${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.data || result.data.length === 0) {
      return null;
    }
    
    // Transform API response
    const tribute: Tribute = {
      id: result.data[0].id,
      attributes: {
        name: result.data[0].attributes.name,
        slug: result.data[0].attributes.slug,
        ...result.data[0].attributes
      }
    };
    
    // Add to local state if not already there
    if (!tributesState.tributes.some(t => t.id === tribute.id)) {
      tributesState.tributes = [...tributesState.tributes, tribute];
    }
    
    return tribute;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error fetching tribute by slug", { slug, error: errorMessage });
    tributesState.error = errorMessage;
    return null;
  } finally {
    tributesState.loading = false;
  }
}

/**
 * Clear the tributes state
 * Useful when logging out or changing users
 */
export function clearTributes(): void {
  tributesState.tributes = [];
  tributesState.error = null;
  tributesState.loading = false;
}