/**
 * API Cache Module - Svelte 5 Runes Implementation
 * 
 * This module provides caching mechanisms specifically for API responses
 * using Svelte 5 runes for state management.
 */

import { browser } from '$app/environment';
import { createLogger } from '$lib/logger';
import * as cache from './cache.svelte';

// Create a dedicated logger
const logger = createLogger('APICache');

// API cache namespace
const API_CACHE_NAMESPACE = 'api-cache';

// Default TTL for API cache (10 minutes)
const DEFAULT_API_TTL = 10 * 60 * 1000;

/**
 * API cache options interface
 */
export interface ApiCacheOptions {
  ttl?: number;                // Time to live in milliseconds
  storageType?: 'memory' | 'session' | 'local';  // Storage type
  bypassCache?: boolean;       // Whether to bypass cache for this request
  revalidate?: boolean;        // Whether to revalidate cache in background
  tags?: string[];             // Cache tags for invalidation
}

/**
 * Cache key generation options
 */
interface KeyOptions {
  url: string;
  method?: string;
  params?: Record<string, any>;
  body?: any;
}

/**
 * Generate a cache key from request options
 * @param options Key generation options
 * @returns Cache key
 */
export function generateCacheKey(options: KeyOptions): string {
  const { url, method = 'GET', params, body } = options;
  
  // Start with the URL and method
  let key = `${method}:${url}`;
  
  // Add query parameters if present
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    key += `?${sortedParams}`;
  }
  
  // Add body hash if present (for POST/PUT requests)
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      // Use a simple hash of the JSON string
      const bodyStr = JSON.stringify(body);
      let hash = 0;
      for (let i = 0; i < bodyStr.length; i++) {
        const char = bodyStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      key += `:${hash}`;
    } catch (e) {
      // If body can't be stringified, use its toString
      key += `:${body.toString()}`;
    }
  }
  
  return key;
}

/**
 * Fetch with cache
 * @param url URL to fetch
 * @param options Fetch options
 * @param cacheOptions Cache options
 * @returns Response data
 */
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: ApiCacheOptions = {}
): Promise<T> {
  const {
    ttl = DEFAULT_API_TTL,
    storageType = 'memory',
    bypassCache = false,
    revalidate = false,
    tags = []
  } = cacheOptions;
  
  // Generate cache key
  const cacheKey = generateCacheKey({
    url,
    method: options.method || 'GET',
    body: options.body
  });
  
  // Only cache GET requests by default
  const isCacheable = (options.method || 'GET') === 'GET';
  
  // Check cache if request is cacheable and not bypassing cache
  if (isCacheable && !bypassCache) {
    const cachedData = cache.get<T>(cacheKey, {
      namespace: API_CACHE_NAMESPACE,
      storageType
    });
    
    if (cachedData) {
      logger.debug(`🔵 Cache hit for ${url}`);
      
      // If revalidate is true, fetch in background to update cache
      if (revalidate) {
        logger.debug(`🔄 Revalidating cache for ${url}`);
        setTimeout(() => {
          fetchAndCache<T>(url, options, { ttl, storageType, tags });
        }, 0);
      }
      
      return cachedData;
    }
  }
  
  // Cache miss or bypass, fetch from network
  return fetchAndCache<T>(url, options, { ttl, storageType, tags });
}

/**
 * Fetch and cache response
 * @param url URL to fetch
 * @param options Fetch options
 * @param cacheOptions Cache options
 * @returns Response data
 */
async function fetchAndCache<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: ApiCacheOptions = {}
): Promise<T> {
  const { ttl, storageType, tags = [] } = cacheOptions;
  
  logger.debug(`🔴 Fetching from network: ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Only cache successful GET requests
    if ((options.method || 'GET') === 'GET') {
      const cacheKey = generateCacheKey({
        url,
        method: options.method || 'GET',
        body: options.body
      });
      
      // Store in cache
      cache.set<T>(cacheKey, data, {
        ttl,
        storageType,
        namespace: API_CACHE_NAMESPACE
      });
      
      // Store cache key in tag indexes for later invalidation
      if (tags.length > 0) {
        storeCacheTags(cacheKey, tags);
      }
      
      logger.debug(`✅ Cached response for ${url}`, { tags });
    }
    
    return data;
  } catch (error) {
    logger.error(`❌ Fetch error for ${url}`, { error });
    throw error;
  }
}

// Tag-based cache invalidation
const tagIndexes = $state<Record<string, string[]>>({});

/**
 * Store cache tags for a cache key
 * @param cacheKey Cache key
 * @param tags Tags to store
 */
function storeCacheTags(cacheKey: string, tags: string[]): void {
  for (const tag of tags) {
    if (!tagIndexes[tag]) {
      tagIndexes[tag] = [];
    }
    
    if (!tagIndexes[tag].includes(cacheKey)) {
      tagIndexes[tag] = [...tagIndexes[tag], cacheKey];
    }
  }
}

/**
 * Invalidate cache by tags
 * @param tags Tags to invalidate
 */
export function invalidateByTags(tags: string[]): void {
  for (const tag of tags) {
    const keys = tagIndexes[tag] || [];
    
    for (const key of keys) {
      cache.remove(key, { namespace: API_CACHE_NAMESPACE });
      logger.debug(`🗑️ Invalidated cache for tag ${tag}: ${key}`);
    }
    
    // Clear tag index
    tagIndexes[tag] = [];
  }
}

/**
 * Invalidate all API cache
 */
export function invalidateAll(): void {
  cache.clear({ namespace: API_CACHE_NAMESPACE });
  
  // Reset tag indexes
  for (const tag in tagIndexes) {
    tagIndexes[tag] = [];
  }
  
  logger.debug('🧹 Invalidated all API cache');
}

/**
 * Prefetch and cache a URL
 * @param url URL to prefetch
 * @param options Fetch options
 * @param cacheOptions Cache options
 */
export async function prefetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: ApiCacheOptions = {}
): Promise<void> {
  try {
    await fetchWithCache<T>(url, options, {
      ...cacheOptions,
      bypassCache: true
    });
    logger.debug(`🔍 Prefetched ${url}`);
  } catch (error) {
    logger.error(`❌ Prefetch error for ${url}`, { error });
  }
}

/**
 * Get API cache statistics
 * @returns Cache statistics
 */
export function getApiCacheStats(): {
  count: number;
  expired: number;
  memorySize: number;
  tags: Record<string, number>;
  timestamp: number;
} {
  const stats = cache.getStats({ namespace: API_CACHE_NAMESPACE });
  
  // Add tag statistics
  const tagStats: Record<string, number> = {};
  for (const tag in tagIndexes) {
    tagStats[tag] = tagIndexes[tag].length;
  }
  
  return {
    count: stats.count,
    expired: stats.expired,
    memorySize: stats.memorySize,
    timestamp: stats.timestamp,
    tags: tagStats
  };
}