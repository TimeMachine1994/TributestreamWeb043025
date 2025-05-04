/**
 * Svelte 5 Runes Utilities
 * 
 * This file provides utility functions and patterns for working with Svelte 5 runes.
 */

import type { Snippet } from 'svelte';

/**
 * Type for a reactive state object
 */
export type ReactiveState<T> = T;

/**
 * Type for a derived value
 */
export type DerivedValue<T> = T;

/**
 * Type for a bindable value
 */
export type BindableValue<T> = T;

/**
 * Creates a reactive state object with loading, error, and data properties
 * Useful for API calls and async operations
 */
export function createAsyncState<T>(initialData: T = null as unknown as T) {
  let data = $state<T>(initialData);
  let loading = $state(false);
  let error = $state<string | null>(null);

  return {
    data,
    loading,
    error,
    
    // Helper to start loading
    startLoading() {
      loading = true;
      error = null;
    },
    
    // Helper to set data and stop loading
    setData(newData: T) {
      data = newData;
      loading = false;
    },
    
    // Helper to set error and stop loading
    setError(errorMessage: string) {
      error = errorMessage;
      loading = false;
    },
    
    // Helper to reset state
    reset() {
      data = initialData;
      loading = false;
      error = null;
    }
  };
}

/**
 * Creates a form state with validation
 */
export function createFormState<T extends Record<string, any>>(
  initialData: T,
  validate?: (data: T) => Record<string, string>
) {
  let data = $state<T>({ ...initialData });
  let errors = $state<Record<string, string>>({});
  let touched = $state<Record<string, boolean>>({});
  
  // Run validation if provided
  $effect(() => {
    if (validate) {
      const validationErrors = validate(data);
      // Only update errors for fields that have been touched
      for (const key in touched) {
        if (touched[key]) {
          errors[key] = validationErrors[key] || '';
        }
      }
    }
  });
  
  // Derived property for form validity
  const isValid = $derived(
    Object.values(errors).every(error => !error) &&
    Object.keys(initialData).every(key => touched[key])
  );
  
  return {
    data,
    errors,
    touched,
    isValid,
    
    // Mark a field as touched
    touch(field: keyof T) {
      touched[field as string] = true;
    },
    
    // Mark all fields as touched (useful for form submission)
    touchAll() {
      for (const key in initialData) {
        touched[key] = true;
      }
    },
    
    // Reset the form
    reset() {
      for (const key in initialData) {
        data[key] = initialData[key];
        errors[key] = '';
        touched[key] = false;
      }
    },
    
    // Update a field value
    updateField(field: keyof T, value: any) {
      data[field] = value;
      touched[field as string] = true;
    }
  };
}

/**
 * Creates a pagination state
 */
export function createPaginationState(initialPage = 1, initialPageSize = 10) {
  let page = $state(initialPage);
  let pageSize = $state(initialPageSize);
  let totalItems = $state(0);
  
  // Derived values
  const totalPages = $derived(Math.ceil(totalItems / pageSize));
  const hasNextPage = $derived(page < totalPages);
  const hasPrevPage = $derived(page > 1);
  const startIndex = $derived((page - 1) * pageSize);
  const endIndex = $derived(Math.min(startIndex + pageSize, totalItems));
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    
    // Navigation methods
    nextPage() {
      if (hasNextPage) {
        page += 1;
      }
    },
    
    prevPage() {
      if (hasPrevPage) {
        page -= 1;
      }
    },
    
    goToPage(newPage: number) {
      if (newPage >= 1 && newPage <= totalPages) {
        page = newPage;
      }
    },
    
    setPageSize(newPageSize: number) {
      pageSize = newPageSize;
      // Adjust current page if needed
      if (page > totalPages) {
        page = totalPages || 1;
      }
    },
    
    setTotalItems(count: number) {
      totalItems = count;
      // Adjust current page if needed
      if (page > totalPages) {
        page = totalPages || 1;
      }
    }
  };
}

/**
 * Helper for working with snippets
 */
export function isSnippetDefined<T extends any[]>(
  snippet: Snippet<T> | undefined
): snippet is Snippet<T> {
  return snippet !== undefined;
}

/**
 * Creates a filter state for collections
 */
export function createFilterState<T>(items: T[], filterFn: (item: T, filters: any) => boolean) {
  let filters = $state<Record<string, any>>({});
  const filteredItems = $derived(items.filter(item => filterFn(item, filters)));
  
  return {
    filters,
    filteredItems,
    
    // Update a filter value
    setFilter(key: string, value: any) {
      filters[key] = value;
    },
    
    // Clear all filters
    clearFilters() {
      for (const key in filters) {
        delete filters[key];
      }
    },
    
    // Clear a specific filter
    clearFilter(key: string) {
      delete filters[key];
    }
  };
}

/**
 * Creates a sortable state for collections
 */
export function createSortableState<T>(
  items: T[],
  initialSortKey: keyof T | null = null,
  initialDirection: 'asc' | 'desc' = 'asc'
) {
  let sortKey = $state<keyof T | null>(initialSortKey);
  let sortDirection = $state<'asc' | 'desc'>(initialDirection);
  
  const sortedItems = $derived(() => {
    if (!sortKey) return [...items];
    
    return [...items].sort((a, b) => {
      // Skip comparison if sortKey is null
      if (sortKey === null) return 0;
      
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  });
  
  return {
    sortKey,
    sortDirection,
    sortedItems,
    
    // Set sort key and direction
    setSort(key: keyof T, direction?: 'asc' | 'desc') {
      if (sortKey === key) {
        // Toggle direction if same key
        sortDirection = direction || (sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        sortKey = key;
        sortDirection = direction || 'asc';
      }
    },
    
    // Clear sorting
    clearSort() {
      sortKey = null;
    }
  };
}

/**
 * Creates a debounced reactive value
 * Useful for search inputs and other frequently changing values
 */
export function createDebouncedState<T>(initialValue: T, delay = 300) {
  let immediate = $state<T>(initialValue);
  let debounced = $state<T>(initialValue);
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  $effect(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      debounced = immediate;
    }, delay);
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  });
  
  return {
    immediate,
    debounced,
    
    // Update the immediate value
    set(value: T) {
      immediate = value;
    },
    
    // Force update the debounced value immediately
    flush() {
      if (timeout) {
        clearTimeout(timeout);
      }
      debounced = immediate;
    }
  };
}