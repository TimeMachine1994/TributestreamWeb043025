/**
 * Data Loader Module - Svelte 5 Runes Implementation
 *
 * This module provides a data loader pattern for batching and deduplicating
 * API requests, inspired by Facebook's DataLoader but adapted for Svelte 5 runes.
 */

import { createLogger } from '$lib/logger';
import * as apiCache from './apiCache.svelte';
import * as cache from './cache.svelte';

// Create a dedicated logger
const logger = createLogger('DataLoader');

/**
 * Data loader options interface
 */
export interface DataLoaderOptions<K, V> {
  batchLoadFn: (keys: K[]) => Promise<V[]>;
  cacheKeyFn?: (key: K) => string;
  maxBatchSize?: number;
  batchingWindow?: number;
  cache?: boolean;
  cacheTtl?: number;
  cacheStorageType?: 'memory' | 'session' | 'local';
  cacheTags?: string[];
}

/**
 * Data loader class for batching and deduplicating requests
 */
export class DataLoader<K, V> {
  private batchLoadFn: (keys: K[]) => Promise<V[]>;
  private cacheKeyFn: (key: K) => string;
  private maxBatchSize: number;
  private batchingWindow: number;
  private cache: boolean;
  private cacheTtl: number;
  private cacheStorageType: 'memory' | 'session' | 'local';
  private cacheTags: string[];
  
  // Batch state
  private batch: {
    keys: K[];
    callbacks: Array<{
      resolve: (value: V) => void;
      reject: (error: Error) => void;
    }>;
  } | null = null;
  
  // Batch timer
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Create a new data loader
   * @param options Data loader options
   */
  constructor(options: DataLoaderOptions<K, V>) {
    this.batchLoadFn = options.batchLoadFn;
    this.cacheKeyFn = options.cacheKeyFn || (key => String(key));
    this.maxBatchSize = options.maxBatchSize || 100;
    this.batchingWindow = options.batchingWindow || 0;
    this.cache = options.cache !== false;
    this.cacheTtl = options.cacheTtl || 60000; // 1 minute default
    this.cacheStorageType = options.cacheStorageType || 'memory';
    this.cacheTags = options.cacheTags || [];
  }
  
  /**
   * Load a single key
   * @param key Key to load
   * @returns Promise that resolves with the value
   */
  async load(key: K): Promise<V> {
    // Generate cache key
    const cacheKey = `dataloader:${this.cacheKeyFn(key)}`;
    
    // Check cache first if enabled
    if (this.cache) {
      const cachedValue = cache.get<V>(cacheKey, {
        namespace: 'dataloader',
        storageType: this.cacheStorageType
      });
      
      if (cachedValue !== null) {
        logger.debug(`🔵 Cache hit for key: ${cacheKey}`);
        return cachedValue;
      }
    }
    
    // Create promise for this request
    return new Promise<V>((resolve, reject) => {
      // Initialize batch if needed
      if (!this.batch) {
        this.batch = {
          keys: [],
          callbacks: []
        };
        
        // Schedule batch execution
        if (this.batchingWindow > 0) {
          this.batchTimer = setTimeout(() => this.dispatchBatch(), this.batchingWindow);
        } else {
          // Execute immediately on next tick
          Promise.resolve().then(() => this.dispatchBatch());
        }
      }
      
      // Add to current batch
      this.batch.keys.push(key);
      this.batch.callbacks.push({ resolve, reject });
      
      // Dispatch immediately if batch is full
      if (this.batch.keys.length >= this.maxBatchSize) {
        if (this.batchTimer) {
          clearTimeout(this.batchTimer);
          this.batchTimer = null;
        }
        this.dispatchBatch();
      }
    });
  }
  
  /**
   * Load multiple keys
   * @param keys Keys to load
   * @returns Promise that resolves with an array of values
   */
  async loadMany(keys: K[]): Promise<V[]> {
    if (keys.length === 0) return Promise.resolve([]);
    
    return Promise.all(keys.map(key => this.load(key)));
  }
  
  /**
   * Clear the cache for a specific key
   * @param key Key to clear
   */
  clear(key: K): void {
    if (!this.cache) return;
    
    const cacheKey = `dataloader:${this.cacheKeyFn(key)}`;
    cache.remove(cacheKey, {
      namespace: 'dataloader',
      storageType: this.cacheStorageType
    });
    
    logger.debug(`🗑️ Cleared cache for key: ${cacheKey}`);
  }
  
  /**
   * Clear the entire cache
   */
  clearAll(): void {
    if (!this.cache) return;
    
    cache.clear({
      namespace: 'dataloader',
      storageType: this.cacheStorageType
    });
    
    logger.debug('🧹 Cleared all dataloader cache');
  }
  
  /**
   * Prime the cache with a value
   * @param key Key to prime
   * @param value Value to cache
   */
  prime(key: K, value: V): void {
    if (!this.cache) return;
    
    const cacheKey = `dataloader:${this.cacheKeyFn(key)}`;
    cache.set<V>(cacheKey, value, {
      namespace: 'dataloader',
      storageType: this.cacheStorageType,
      ttl: this.cacheTtl
    });
    
    logger.debug(`✅ Primed cache for key: ${cacheKey}`);
  }
  
  /**
   * Dispatch the current batch
   */
  private async dispatchBatch(): Promise<void> {
    if (!this.batch) return;
    
    const { keys, callbacks } = this.batch;
    this.batch = null;
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    logger.debug(`🚀 Dispatching batch of ${keys.length} keys`);
    
    try {
      // Call batch load function
      const values = await this.batchLoadFn(keys);
      
      // Validate response
      if (!Array.isArray(values) || values.length !== keys.length) {
        const error = new Error(
          `DataLoader batch function must return an array of values with the same length as the array of keys. ` +
          `Got ${values.length} values for ${keys.length} keys.`
        );
        callbacks.forEach(({ reject }) => reject(error));
        return;
      }
      
      // Resolve promises and cache values
      keys.forEach((key, i) => {
        const value = values[i];
        
        // Cache the value if enabled
        if (this.cache) {
          const cacheKey = `dataloader:${this.cacheKeyFn(key)}`;
          cache.set<V>(cacheKey, value, {
            namespace: 'dataloader',
            storageType: this.cacheStorageType,
            ttl: this.cacheTtl
          });
        }
        
        // Resolve the promise
        callbacks[i].resolve(value);
      });
    } catch (error) {
      // Reject all promises with the same error
      callbacks.forEach(({ reject }) => reject(error as Error));
    }
  }
}

/**
 * Create a new data loader
 * @param options Data loader options
 * @returns Data loader instance
 */
export function createDataLoader<K, V>(options: DataLoaderOptions<K, V>): DataLoader<K, V> {
  return new DataLoader<K, V>(options);
}

/**
 * Create a data loader for fetching entities by ID
 * @param fetchFn Function to fetch entities by IDs
 * @param options Additional data loader options
 * @returns Data loader instance
 */
export function createEntityLoader<T extends { id: string }>(
  fetchFn: (ids: string[]) => Promise<T[]>,
  options: Partial<DataLoaderOptions<string, T>> = {}
): DataLoader<string, T> {
  return createDataLoader<string, T>({
    batchLoadFn: async (ids) => {
      const entities = await fetchFn(ids);
      
      // Map entities back to the original order of IDs
      const entityMap = new Map(entities.map(entity => [entity.id, entity]));
      return ids.map(id => entityMap.get(id) as T);
    },
    cacheKeyFn: id => id,
    ...options
  });
}