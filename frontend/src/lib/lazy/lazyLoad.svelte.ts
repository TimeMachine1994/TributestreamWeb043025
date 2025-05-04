/**
 * Lazy Loading Module - Svelte 5 Runes Implementation
 * 
 * This module provides utilities for lazy loading components and resources
 * to improve initial load performance.
 */

import { browser } from '$app/environment';
import { createLogger } from '$lib/logger';

// Create a dedicated logger
const logger = createLogger('LazyLoad');

/**
 * Interface for lazy loaded component
 */
export interface LazyComponent<T> {
  component: T | null;
  loading: boolean;
  error: Error | null;
  progress: number;
}

/**
 * Create a lazy loaded component
 * @param loader Function that imports the component
 * @returns Lazy component object
 */
export function createLazyComponent<T>(loader: () => Promise<{ default: T }>): LazyComponent<T> {
  let component = $state<T | null>(null);
  let loading = $state(false);
  let error = $state<Error | null>(null);
  let progress = $state(0);
  
  $effect(() => {
    if (browser) {
      loading = true;
      progress = 0;
      error = null;
      
      logger.debug('🔄 Loading lazy component');
      
      loader()
        .then(module => {
          component = module.default;
          loading = false;
          progress = 100;
          logger.debug('✅ Lazy component loaded successfully');
        })
        .catch(err => {
          error = err instanceof Error ? err : new Error(String(err));
          loading = false;
          logger.error('❌ Error loading lazy component', { error: error.message });
        });
    }
  });
  
  return {
    component,
    loading,
    error,
    progress
  };
}

/**
 * Options for intersection observer
 */
export interface IntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Create an intersection observer
 * @param options Intersection observer options
 * @returns Intersection observer state and methods
 */
export function createIntersectionObserver(options: IntersectionOptions = {}) {
  const { 
    root = null,
    rootMargin = '0px',
    threshold = 0
  } = options;
  
  let isIntersecting = $state(false);
  let hasBeenVisible = $state(false);
  let intersectionRatio = $state(0);
  let observer: IntersectionObserver | null = null;
  
  /**
   * Observe an element
   * @param node Element to observe
   */
  function observe(node: HTMLElement) {
    if (!browser) return;
    
    // Create observer if it doesn't exist
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        
        isIntersecting = entry.isIntersecting;
        intersectionRatio = entry.intersectionRatio;
        
        if (isIntersecting) {
          hasBeenVisible = true;
          logger.debug('👁️ Element is now visible', { 
            ratio: intersectionRatio,
            rootMargin,
            threshold
          });
        }
      }, { root, rootMargin, threshold });
    }
    
    // Start observing the element
    observer.observe(node);
    
    // Return destroy function for Svelte action
    return {
      destroy() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    };
  }
  
  return {
    isIntersecting,
    hasBeenVisible,
    intersectionRatio,
    observe
  };
}

/**
 * Options for lazy image loading
 */
export interface LazyImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Create a lazy loaded image
 * @param options Lazy image options
 * @returns Lazy image state and methods
 */
export function createLazyImage(options: LazyImageOptions) {
  const {
    src,
    placeholder = '',
    threshold = 0.1,
    rootMargin = '200px'
  } = options;
  
  let currentSrc = $state(placeholder);
  let isLoaded = $state(false);
  let isLoading = $state(false);
  let error = $state<Error | null>(null);
  
  // Create intersection observer
  const observer = createIntersectionObserver({
    threshold,
    rootMargin
  });
  
  // Load image when visible
  $effect(() => {
    if (observer.isIntersecting && !isLoaded && !isLoading && browser) {
      isLoading = true;
      
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        currentSrc = src;
        isLoaded = true;
        isLoading = false;
        logger.debug('✅ Lazy image loaded', { src });
      };
      
      img.onerror = (e) => {
        error = new Error(`Failed to load image: ${src}`);
        isLoading = false;
        logger.error('❌ Error loading lazy image', { src, error: error.message });
      };
    }
  });
  
  return {
    currentSrc,
    isLoaded,
    isLoading,
    error,
    observe: observer.observe
  };
}

/**
 * Lazy load action for use with Svelte components
 * @param node Element to apply lazy loading to
 * @param options Lazy loading options
 * @returns Svelte action
 */
export function lazyLoad(node: HTMLElement, options: { threshold?: number; rootMargin?: string } = {}) {
  const {
    threshold = 0.1,
    rootMargin = '200px'
  } = options;
  
  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    
    if (entry.isIntersecting) {
      // Dispatch custom event when element is visible
      node.dispatchEvent(new CustomEvent('lazyload'));
      
      // Stop observing once loaded
      observer.disconnect();
    }
  }, { threshold, rootMargin });
  
  observer.observe(node);
  
  return {
    destroy() {
      observer.disconnect();
    },
    update(newOptions: { threshold?: number; rootMargin?: string }) {
      // No-op for now, would need to recreate observer with new options
    }
  };
}