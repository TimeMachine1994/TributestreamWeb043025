/**
 * Cache Module - Svelte 5 Runes Implementation
 * 
 * This module provides a caching system for storing and retrieving data
 * with support for memory, localStorage, and sessionStorage.
 */

import { browser } from '$app/environment';
import { createLogger } from '$lib/logger';

// Create a dedicated logger
const logger = createLogger('Cache');

// Types
export interface CacheOptions {
  ttl?: number;
  storageType?: 'memory' | 'local' | 'session';
  namespace?: string;
}

interface CacheMetadata {
  timestamp: number;
  ttl: number;
  storageType: 'memory' | 'local' | 'session';
  namespace: string;
}

// Cache storage
const memoryCache = $state(new Map<string, any>());
const cacheMetadata = $state(new Map<string, CacheMetadata>());

/**
 * Set a value in the cache
 * @param key Cache key
 * @param value Value to cache
 * @param options Cache options
 * @returns The cached value
 */
export function set<T>(key: string, value: T, options: CacheOptions = {}): T {
  const { 
    ttl = 60000, // Default TTL: 1 minute
    storageType = 'memory',
    namespace = 'app'
  } = options;
  
  const cacheKey = `${namespace}:${key}`;
  
  // Store in memory cache
  memoryCache.set(cacheKey, value);
  
  // Store metadata
  cacheMetadata.set(cacheKey, {
    timestamp: Date.now(),
    ttl,
    storageType,
    namespace
  });
  
  logger.debug('📦 Cache set', { key: cacheKey, storageType, ttl });
  
  // Store in browser storage if requested
  if (browser && storageType !== 'memory') {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      storage.setItem(`cache:${cacheKey}`, JSON.stringify({
        value,
        timestamp: Date.now(),
        ttl
      }));
    } catch (err) {
      logger.error('❌ Cache storage error', { error: err instanceof Error ? err.message : String(err) });
    }
  }
  
  return value;
}

/**
 * Get a value from the cache
 * @param key Cache key
 * @param options Cache options (namespace, storageType)
 * @returns The cached value or null if not found or expired
 */
export function get<T>(key: string, options: Pick<CacheOptions, 'namespace' | 'storageType'> = {}): T | null {
  const { namespace = 'app' } = options;
  const cacheKey = `${namespace}:${key}`;
  
  // Check if item exists and is valid
  const metadata = cacheMetadata.get(cacheKey);
  if (!metadata) {
    // Try to recover from browser storage if in browser
    if (browser) {
      return recoverFromBrowserStorage<T>(cacheKey);
    }
    return null;
  }
  
  // Check if item has expired
  if (Date.now() - metadata.timestamp > metadata.ttl) {
    // Remove expired item
    logger.debug('🕒 Cache expired', { key: cacheKey });
    remove(key, { namespace });
    return null;
  }
  
  logger.debug('📤 Cache hit', { key: cacheKey });
  return memoryCache.get(cacheKey) as T;
}

/**
 * Check if a key exists in the cache and is not expired
 * @param key Cache key
 * @param options Cache options (namespace, storageType)
 * @returns True if the key exists and is not expired
 */
export function has(key: string, options: Pick<CacheOptions, 'namespace' | 'storageType'> = {}): boolean {
  const { namespace = 'app' } = options;
  const cacheKey = `${namespace}:${key}`;
  
  // Check if item exists
  const metadata = cacheMetadata.get(cacheKey);
  if (!metadata) return false;
  
  // Check if item has expired
  if (Date.now() - metadata.timestamp > metadata.ttl) {
    remove(key, { namespace });
    return false;
  }
  
  return true;
}

/**
 * Remove a value from the cache
 * @param key Cache key
 * @param options Cache options (namespace, storageType)
 */
export function remove(key: string, options: Pick<CacheOptions, 'namespace' | 'storageType'> = {}): void {
  const { namespace = 'app' } = options;
  const cacheKey = `${namespace}:${key}`;
  
  // Get metadata to check storage type
  const metadata = cacheMetadata.get(cacheKey);
  
  // Remove from memory cache
  memoryCache.delete(cacheKey);
  cacheMetadata.delete(cacheKey);
  
  // Remove from browser storage if needed
  if (browser && metadata && metadata.storageType !== 'memory') {
    try {
      const storage = metadata.storageType === 'local' ? localStorage : sessionStorage;
      storage.removeItem(`cache:${cacheKey}`);
    } catch (err) {
      logger.error('❌ Cache removal error', { error: err instanceof Error ? err.message : String(err) });
    }
  }
  
  logger.debug('🗑️ Cache removed', { key: cacheKey });
}

/**
 * Clear all cache entries
 * @param options Cache options (namespace, storageType)
 */
export function clear(options: Pick<CacheOptions, 'namespace' | 'storageType'> = {}): void {
  const { namespace } = options;
  
  if (namespace) {
    // Clear only entries with the specified namespace
    const keysToRemove: string[] = [];
    
    cacheMetadata.forEach((metadata, key) => {
      if (metadata.namespace === namespace) {
        keysToRemove.push(key.substring(namespace.length + 1)); // Remove namespace prefix
      }
    });
    
    keysToRemove.forEach(key => remove(key, { namespace }));
    
    logger.debug('🧹 Cache cleared for namespace', { namespace });
  } else {
    // Clear all entries
    memoryCache.clear();
    cacheMetadata.clear();
    
    // Clear browser storage if in browser
    if (browser) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        logger.error('❌ Cache clear error', { error: err instanceof Error ? err.message : String(err) });
      }
    }
    
    logger.debug('🧹 All cache cleared');
  }
}

/**
 * Get cache statistics
 * @param options Cache options (namespace)
 * @returns Cache statistics
 */
export function getStats(options: Pick<CacheOptions, 'namespace'> = {}) {
  const { namespace = 'app' } = options;
  
  let count = 0;
  let expired = 0;
  let memorySize = 0;
  
  cacheMetadata.forEach((metadata, key) => {
    if (!namespace || key.startsWith(`${namespace}:`)) {
      count++;
      
      if (Date.now() - metadata.timestamp > metadata.ttl) {
        expired++;
      }
      
      try {
        const value = memoryCache.get(key);
        memorySize += JSON.stringify(value).length;
      } catch (e) {
        // Ignore serialization errors
      }
    }
  });
  
  return {
    count,
    expired,
    memorySize,
    timestamp: Date.now()
  };
}

/**
 * Try to recover a value from browser storage
 * @param cacheKey Full cache key including namespace
 * @returns The recovered value or null
 */
function recoverFromBrowserStorage<T>(cacheKey: string): T | null {
  if (!browser) return null;
  
  try {
    // Try localStorage first
    let item = localStorage.getItem(`cache:${cacheKey}`);
    if (!item) {
      // Try sessionStorage
      item = sessionStorage.getItem(`cache:${cacheKey}`);
    }
    
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    
    // Check if expired
    if (Date.now() - parsed.timestamp > parsed.ttl) {
      // Remove expired item
      localStorage.removeItem(`cache:${cacheKey}`);
      sessionStorage.removeItem(`cache:${cacheKey}`);
      return null;
    }
    
    // Restore to memory cache
    memoryCache.set(cacheKey, parsed.value);
    cacheMetadata.set(cacheKey, {
      timestamp: parsed.timestamp,
      ttl: parsed.ttl,
      storageType: localStorage.getItem(`cache:${cacheKey}`) ? 'local' : 'session',
      namespace: cacheKey.split(':')[0]
    });
    
    logger.debug('🔄 Cache recovered from browser storage', { key: cacheKey });
    
    return parsed.value as T;
  } catch (err) {
    logger.error('❌ Cache recovery error', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}