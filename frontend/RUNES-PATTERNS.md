# Svelte 5 Runes Patterns and Best Practices

This document outlines the established patterns and best practices for using Svelte 5 runes in the TributeStream application.

## Table of Contents

1. [Introduction](#introduction)
2. [State Management](#state-management)
3. [Cross-Module State](#cross-module-state)
4. [Derived Values](#derived-values)
5. [Effects](#effects)
6. [Form Handling](#form-handling)
7. [API Integration](#api-integration)
8. [Performance Optimization](#performance-optimization)
9. [Caching](#caching)
10. [Lazy Loading](#lazy-loading)
11. [TypeScript Integration](#typescript-integration)
12. [Testing](#testing)

## Introduction

Svelte 5 introduces runes, a new reactive primitive system that replaces the previous reactivity model. Runes are special functions prefixed with `$` that create reactive values.

The main runes are:
- `$state` - Creates reactive state
- `$derived` - Creates derived values that update when dependencies change
- `$effect` - Runs side effects when dependencies change
- `$props` - Defines component props
- `$bindable` - Creates two-way bindable props

## State Management

### Basic State

```svelte
<script>
  // Simple state
  let count = $state(0);
  let name = $state('');
  let isActive = $state(false);
  
  // Object state (deeply reactive)
  let user = $state({
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      theme: 'light',
      notifications: true
    }
  });
  
  // Array state (deeply reactive)
  let todos = $state([
    { id: 1, text: 'Learn Svelte 5 Runes', completed: false },
    { id: 2, text: 'Build an app', completed: false }
  ]);
</script>
```

### State Containers

For shared state across components, we use state containers in `.svelte.js` or `.svelte.ts` files:

```js
// userState.svelte.js
export const userState = $state({
  user: null,
  isAuthenticated: false,
  role: 'guest'
});

// Getter functions
export function getUser() {
  return userState.user;
}

export function isAuthenticated() {
  return userState.isAuthenticated;
}

export function getUserRole() {
  return userState.role;
}

// Action functions
export function login(user) {
  userState.user = user;
  userState.isAuthenticated = true;
  userState.role = user.role || 'user';
}

export function logout() {
  userState.user = null;
  userState.isAuthenticated = false;
  userState.role = 'guest';
}
```

## Cross-Module State

When sharing state across modules, we follow these patterns:

1. **State Container Pattern**: Create a dedicated `.svelte.js` or `.svelte.ts` file for state
2. **Getter Functions**: Export functions to access state properties
3. **Action Functions**: Export functions to modify state
4. **No Direct Exports**: Never export reassignable state variables directly

```js
// AVOID THIS:
export let count = $state(0); // Will cause errors when imported

// DO THIS INSTEAD:
const state = $state({ count: 0 });
export function getCount() { return state.count; }
export function incrementCount() { state.count++; }
```

## Derived Values

### Basic Derived Values

```svelte
<script>
  let count = $state(0);
  
  // Simple derived value
  let doubled = $derived(count * 2);
  
  // Derived from multiple values
  let message = $derived(`The count is ${count} and doubled is ${doubled}`);
</script>
```

### Complex Derived Values

For complex calculations, use `$derived.by`:

```svelte
<script>
  let todos = $state([
    { id: 1, text: 'Learn Svelte 5 Runes', completed: false },
    { id: 2, text: 'Build an app', completed: false }
  ]);
  
  let stats = $derived.by(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const remaining = total - completed;
    const percentComplete = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      completed,
      remaining,
      percentComplete
    };
  });
</script>
```

## Effects

### Basic Effects

```svelte
<script>
  let count = $state(0);
  
  // Run when count changes
  $effect(() => {
    console.log(`Count changed to ${count}`);
  });
</script>
```

### Effects with Cleanup

```svelte
<script>
  let isActive = $state(false);
  
  $effect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Do something periodically
      }, 1000);
      
      // Return cleanup function
      return () => {
        clearInterval(interval);
      };
    }
  });
</script>
```

### Pre-Effects

Use `$effect.pre` for effects that need to run before DOM updates:

```svelte
<script>
  let messages = $state([]);
  let scrollContainer;
  
  $effect.pre(() => {
    if (!scrollContainer) return;
    
    // Reference messages to trigger re-runs
    messages.length;
    
    // Auto-scroll when new messages are added
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });
</script>
```

## Form Handling

We use the `createFormState` utility for form handling:

```svelte
<script>
  import { createFormState } from '$lib/runes/utils.svelte';
  
  const form = createFormState({
    email: '',
    password: '',
    rememberMe: false
  }, (data) => {
    // Validation function
    const errors = {};
    
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    return errors;
  });
  
  function handleSubmit() {
    form.touchAll();
    
    if (form.isValid) {
      // Submit form data
      console.log('Form submitted', form.data);
      form.reset();
    }
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <div>
    <label for="email">Email</label>
    <input
      id="email"
      type="email"
      value={form.data.email}
      oninput={(e) => form.updateField('email', e.target.value)}
      onblur={() => form.touch('email')}
    />
    {#if form.errors.email && form.touched.email}
      <div class="error">{form.errors.email}</div>
    {/if}
  </div>
  
  <button type="submit" disabled={!form.isValid}>Submit</button>
</form>
```

## API Integration

For API integration, we use a pattern that combines state management with API calls:

```js
// api/users.svelte.js
import { getStrapiUrl } from '$lib/config';

// State container
export const usersState = $state({
  loading: false,
  error: null,
  users: []
});

// Getter functions
export function getLoading() {
  return usersState.loading;
}

export function getError() {
  return usersState.error;
}

export function getUsers() {
  return usersState.users;
}

// API functions
export async function fetchUsers(token) {
  usersState.loading = true;
  usersState.error = null;
  
  try {
    const response = await fetch(`${getStrapiUrl()}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    usersState.users = result.data || [];
    
    return usersState.users;
  } catch (err) {
    usersState.error = err.message || String(err);
    return null;
  } finally {
    usersState.loading = false;
  }
}
```

## Performance Optimization

### Memoization

For expensive computations, use `$derived.by` with careful dependency tracking:

```svelte
<script>
  let items = $state([/* many items */]);
  let filter = $state('');
  
  // This will only recompute when items or filter changes
  let filteredItems = $derived.by(() => {
    console.log('Filtering items'); // Should only log when dependencies change
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  });
</script>
```

### Avoiding Unnecessary Effects

Be careful with effect dependencies:

```svelte
<script>
  let count = $state(0);
  let user = $state({ name: 'John' });
  
  // BAD: Will run whenever any property of user changes
  $effect(() => {
    console.log(`Count: ${count}, User: ${user}`);
  });
  
  // GOOD: Only runs when count or user.name changes
  $effect(() => {
    console.log(`Count: ${count}, Name: ${user.name}`);
  });
</script>
```

## Caching

We use a caching system for API responses and expensive computations:

```js
// From cache.svelte.ts
import { browser } from '$app/environment';

// Cache storage
const memoryCache = $state(new Map());
const cacheMetadata = $state(new Map());

// Set cache item with optional TTL and storage type
export function set(key, value, options = {}) {
  const { ttl = 60000, storageType = 'memory' } = options;
  
  // Store in memory cache
  memoryCache.set(key, value);
  
  // Store metadata
  cacheMetadata.set(key, {
    timestamp: Date.now(),
    ttl,
    storageType
  });
  
  // Store in browser storage if requested
  if (browser && storageType !== 'memory') {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      storage.setItem(`cache:${key}`, JSON.stringify({
        value,
        timestamp: Date.now(),
        ttl
      }));
    } catch (err) {
      console.error('Cache storage error:', err);
    }
  }
  
  return value;
}

// Get cache item
export function get(key) {
  // Check if item exists and is valid
  const metadata = cacheMetadata.get(key);
  if (!metadata) return null;
  
  // Check if item has expired
  if (Date.now() - metadata.timestamp > metadata.ttl) {
    // Remove expired item
    memoryCache.delete(key);
    cacheMetadata.delete(key);
    return null;
  }
  
  return memoryCache.get(key);
}
```

## Lazy Loading

For components that are not immediately needed:

```js
// From lazyLoad.svelte.ts
export function createLazyComponent(loader) {
  let component = $state(null);
  let loading = $state(false);
  let error = $state(null);
  let progress = $state(0);
  
  $effect(() => {
    loading = true;
    
    loader()
      .then(module => {
        component = module.default;
        loading = false;
      })
      .catch(err => {
        error = err;
        loading = false;
      });
  });
  
  return {
    component,
    loading,
    error,
    progress
  };
}
```

Usage:

```svelte
<script>
  import { createLazyComponent } from '$lib/lazy/lazyLoad.svelte';
  
  const LazyChart = createLazyComponent(() => 
    import('../components/Chart.svelte')
  );
</script>

{#if LazyChart.loading}
  <div>Loading chart...</div>
{:else if LazyChart.error}
  <div>Error loading chart: {LazyChart.error.message}</div>
{:else if LazyChart.component}
  <svelte:component this={LazyChart.component} {data} />
{/if}
```

## TypeScript Integration

### Type-Safe State

```ts
// Typed state
let count = $state<number>(0);
let user = $state<{ name: string; email: string; }>({
  name: '',
  email: ''
});
```

### Type-Safe Props

```svelte
<script lang="ts">
  interface Props {
    title: string;
    items: string[];
    onSelect?: (item: string) => void;
  }
  
  let { title, items = [], onSelect } = $props<Props>();
</script>
```

### Type-Safe API State

```ts
// api/users.svelte.ts
interface User {
  id: string;
  name: string;
  email: string;
}

export const usersState = $state<{
  loading: boolean;
  error: string | null;
  users: User[];
}>({
  loading: false,
  error: null,
  users: []
});
```

## Testing

### Testing Components

```js
// Component test
import { mount, flushSync } from 'svelte';
import { expect, test } from 'vitest';
import Counter from './Counter.svelte';

test('Counter increments when button is clicked', () => {
  const component = mount(Counter, {
    target: document.body,
    props: { initial: 0 }
  });
  
  expect(document.body.textContent).toContain('Count: 0');
  
  document.querySelector('button').click();
  flushSync();
  
  expect(document.body.textContent).toContain('Count: 1');
});
```

### Testing State Logic

```js
// State logic test
import { flushSync } from 'svelte';
import { expect, test } from 'vitest';
import { counter } from './counter.svelte.js';

test('Counter state', () => {
  expect(counter.count).toBe(0);
  
  counter.increment();
  flushSync();
  expect(counter.count).toBe(1);
  
  counter.decrement();
  flushSync();
  expect(counter.count).toBe(0);
});
```

---

This document will be updated as we establish new patterns and best practices for using Svelte 5 runes in our application.