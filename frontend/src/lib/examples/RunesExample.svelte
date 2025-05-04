<!--
  RunesExample.svelte - Svelte 5 Runes Example Component
  
  This component demonstrates various Svelte 5 runes patterns and best practices.
  It serves as a reference implementation for developers.
-->
<script lang="ts">
  import { createLogger } from '$lib/logger';
  import { createFormState, createPaginationState, createDebouncedState } from '$lib/runes/utils.svelte';
  import * as cache from '$lib/cache/cache.svelte';
  import * as apiCache from '$lib/cache/apiCache.svelte';
  import { createLazyComponent, createIntersectionObserver } from '$lib/lazy/lazyLoad.svelte';
  
  // Create a logger
  const logger = createLogger('RunesExample');
  
  // Component props using $props rune
  interface Props {
    title?: string;
    initialCount?: number;
    items?: string[];
    onCountChange?: (count: number) => void;
  }
  
  let { 
    title = 'Runes Example', 
    initialCount = 0,
    items = [],
    onCountChange = undefined
  } = $props();
  
  // Basic state with $state rune
  let count = $state(initialCount);
  let name = $state('');
  let isActive = $state(false);
  
  // Object and array state
  let user = $state({
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      theme: 'light',
      notifications: true
    }
  });
  
  let todos = $state([
    { id: 1, text: 'Learn Svelte 5 Runes', completed: false },
    { id: 2, text: 'Build an app', completed: false }
  ]);
  
  // Derived values with $derived rune
  let doubled = $derived(count * 2);
  let fullName = $derived(`${user.firstName} ${user.lastName}`);
  let completedTodos = $derived(todos.filter(todo => todo.completed));
  let completedCount = $derived(completedTodos.length);
  let progress = $derived(todos.length > 0 ? (completedCount / todos.length) * 100 : 0);
  
  // Complex derived value using $derived.by
  let stats = $derived.by(() => {
    const total = todos.length;
    const completed = completedTodos.length;
    const remaining = total - completed;
    const percentComplete = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      completed,
      remaining,
      percentComplete
    };
  });
  
  // Effects with $effect rune
  $effect(() => {
    logger.debug('🔄 Count changed', { count, doubled });
    
    // Call the callback if provided
    if (onCountChange) {
      onCountChange(count);
    }
  });
  
  // Effect with cleanup
  $effect(() => {
    logger.debug('🔄 Active state changed', { isActive });
    
    if (isActive) {
      const interval = setInterval(() => {
        count += 1;
      }, 1000);
      
      // Return cleanup function
      return () => {
        clearInterval(interval);
        logger.debug('🧹 Cleaned up interval');
      };
    }
  });
  
  // Form handling with createFormState
  const form = createFormState({
    email: '',
    password: '',
    rememberMe: false
  }, (data: { email: string; password: string; rememberMe: boolean }) => {
    // Validation function
    const errors: Record<string, string> = {};
    
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
  
  // Pagination with createPaginationState
  const pagination = createPaginationState(1, 5);
  
  // Update total items when todos change
  $effect(() => {
    pagination.setTotalItems(todos.length);
  });
  
  // Get current page items
  const currentPageItems = $derived(
    todos.slice(pagination.startIndex, pagination.endIndex)
  );
  
  // Debounced search with createDebouncedState
  const search = createDebouncedState('', 300);
  
  // Filtered todos based on search
  const filteredTodos = $derived(() => {
    if (!search.debounced) return todos;
    
    return todos.filter(todo => 
      todo.text.toLowerCase().includes(search.debounced.toLowerCase())
    );
  });
  
  // Lazy loaded component
  const LazyChart = createLazyComponent(() =>
    import('../examples/Chart.svelte')
  );
  
  // Intersection observer for lazy loading
  const observer = createIntersectionObserver({
    rootMargin: '100px',
    threshold: 0.1
  });
  
  // Cache example data when component is visible
  $effect(() => {
    if (observer.isIntersecting) {
      // Cache some data
      cache.set('example-data', {
        count,
        todos,
        timestamp: new Date()
      }, {
        ttl: 60000, // 1 minute
        storageType: 'session'
      });
      
      logger.debug('📦 Cached example data');
    }
  });
  
  // Event handlers
  function increment() {
    count += 1;
    logger.debug('➕ Incremented count', { count });
  }
  
  function decrement() {
    count -= 1;
    logger.debug('➖ Decremented count', { count });
  }
  
  function toggleActive() {
    isActive = !isActive;
    logger.debug('🔄 Toggled active state', { isActive });
  }
  
  function addTodo() {
    if (!name) return;
    
    const newTodo = {
      id: Date.now(),
      text: name,
      completed: false
    };
    
    todos = [...todos, newTodo];
    name = '';
    
    logger.debug('➕ Added todo', { todo: newTodo });
  }
  
  function toggleTodo(id: number) {
    todos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    
    logger.debug('🔄 Toggled todo', { id });
  }
  
  function removeTodo(id: number) {
    todos = todos.filter(todo => todo.id !== id);
    logger.debug('➖ Removed todo', { id });
  }
  
  function handleSubmit() {
    form.touchAll();
    
    if (form.isValid) {
      logger.debug('✅ Form submitted', { data: form.data });
      // Submit form data
      form.reset();
    } else {
      logger.debug('❌ Form invalid', { errors: form.errors });
    }
  }
  
  function clearCache() {
    cache.clear();
    apiCache.invalidateAll();
    logger.debug('🧹 Cleared all cache');
  }
</script>

<div class="runes-example">
  <h1>{title}</h1>
  
  <!-- Basic state example -->
  <section class="example-section">
    <h2>Basic State</h2>
    <div class="counter">
      <button onclick={decrement} disabled={count <= 0}>-</button>
      <span>{count}</span>
      <button onclick={increment}>+</button>
    </div>
    <div>Doubled: {doubled}</div>
    <div>
      <button onclick={toggleActive}>
        {isActive ? 'Stop' : 'Start'} Auto Increment
      </button>
      {#if isActive}
        <span class="badge">Running</span>
      {/if}
    </div>
  </section>
  
  <!-- Todo list example -->
  <section class="example-section">
    <h2>Todo List</h2>
    
    <div class="search-box">
      <input 
        type="text" 
        placeholder="Search todos..." 
        value={search.immediate}
        oninput={(e) => search.set((e.target as HTMLInputElement).value)}
      />
      {#if search.immediate !== search.debounced}
        <span class="badge">Typing...</span>
      {/if}
    </div>
    
    <div class="add-todo">
      <input 
        type="text" 
        placeholder="Add new todo" 
        bind:value={name}
        onkeypress={(e) => e.key === 'Enter' && addTodo()}
      />
      <button onclick={addTodo} disabled={!name}>Add</button>
    </div>
    
    <div class="progress-bar">
      <div class="progress" style="width: {progress}%"></div>
      <span>{stats.completed}/{stats.total} completed ({stats.percentComplete.toFixed(0)}%)</span>
    </div>
    
    <ul class="todo-list">
      {#if filteredTodos.length === 0}
        <li class="empty">No todos found</li>
      {:else}
        {#each currentPageItems as todo (todo.id)}
          <li class={todo.completed ? 'completed' : ''}>
            <input 
              type="checkbox" 
              checked={todo.completed}
              onclick={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onclick={() => removeTodo(todo.id)}>×</button>
          </li>
        {/each}
      {/if}
    </ul>
    
    {#if pagination.totalPages > 1}
      <div class="pagination">
        <button 
          onclick={() => pagination.prevPage()}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button 
          onclick={() => pagination.nextPage()}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    {/if}
  </section>
  
  <!-- Form example -->
  <section class="example-section">
    <h2>Form Handling</h2>
    
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email"
          type="email"
          value={form.data.email}
          oninput={(e) => form.updateField('email', (e.target as HTMLInputElement).value)}
          onblur={() => form.touch('email')}
          class={form.errors.email && form.touched.email ? 'error' : ''}
        />
        {#if form.errors.email && form.touched.email}
          <div class="error-message">{form.errors.email}</div>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          id="password"
          type="password"
          value={form.data.password}
          oninput={(e) => form.updateField('password', (e.target as HTMLInputElement).value)}
          onblur={() => form.touch('password')}
          class={form.errors.password && form.touched.password ? 'error' : ''}
        />
        {#if form.errors.password && form.touched.password}
          <div class="error-message">{form.errors.password}</div>
        {/if}
      </div>
      
      <div class="form-group checkbox">
        <label>
          <input 
            type="checkbox"
            checked={form.data.rememberMe}
            onclick={(e) => form.updateField('rememberMe', (e.target as HTMLInputElement).checked)}
          />
          Remember me
        </label>
      </div>
      
      <button type="submit" disabled={!form.isValid}>Submit</button>
      <button type="button" onclick={() => form.reset()}>Reset</button>
    </form>
  </section>
  
  <!-- User profile example -->
  <section class="example-section">
    <h2>User Profile</h2>
    
    <div class="user-profile">
      <div class="avatar">{user.firstName[0]}{user.lastName[0]}</div>
      <div class="user-info">
        <h3>{fullName}</h3>
        <div class="preferences">
          <label>
            <input 
              type="checkbox"
              checked={user.preferences.theme === 'dark'}
              onclick={() => {
                user.preferences.theme = user.preferences.theme === 'dark' ? 'light' : 'dark';
              }}
            />
            Dark Theme
          </label>
          <label>
            <input 
              type="checkbox"
              checked={user.preferences.notifications}
              onclick={() => {
                user.preferences.notifications = !user.preferences.notifications;
              }}
            />
            Notifications
          </label>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Lazy loading example -->
  <section class="example-section" use:observer.observe>
    <h2>Lazy Loading</h2>
    
    <div class="lazy-section">
      {#if observer.isIntersecting}
        <div class="info-box">
          <p>This section was lazy loaded when it came into view!</p>
          <p>Intersection state: {observer.isIntersecting ? 'Visible' : 'Hidden'}</p>
          <p>Has been visible: {observer.hasBeenVisible ? 'Yes' : 'No'}</p>
        </div>
        
        {#if LazyChart.loading}
          <div class="loading">Loading chart component... ({LazyChart.progress.toFixed(0)}%)</div>
        {:else if LazyChart.error}
          <div class="error">Failed to load chart: {LazyChart.error.message}</div>
        {:else if LazyChart.component}
          <svelte:component this={LazyChart.component as any} data={stats} />
        {/if}
      {:else}
        <div class="placeholder">Chart will load when scrolled into view</div>
      {/if}
    </div>
  </section>
  
  <!-- Cache example -->
  <section class="example-section">
    <h2>Cache Management</h2>
    
    <div class="cache-controls">
      <button onclick={clearCache}>Clear All Cache</button>
    </div>
    
    <div class="cache-info">
      <p>Cache example data when this component is visible.</p>
      <p>Check browser storage to see the cached data.</p>
    </div>
  </section>
</div>

<style>
  .runes-example {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    color: #ff3e00;
    text-align: center;
    margin-bottom: 30px;
  }
  
  h2 {
    color: #676778;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-top: 30px;
  }
  
  .example-section {
    margin-bottom: 40px;
    padding: 20px;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Counter styles */
  .counter {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .counter button {
    width: 40px;
    height: 40px;
    font-size: 18px;
    border-radius: 50%;
    border: none;
    background-color: #ff3e00;
    color: white;
    cursor: pointer;
  }
  
  .counter button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .counter span {
    font-size: 24px;
    font-weight: bold;
    min-width: 40px;
    text-align: center;
  }
  
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    background-color: #ff3e00;
    color: white;
    font-size: 12px;
    margin-left: 10px;
  }
  
  /* Todo list styles */
  .add-todo {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .add-todo input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .search-box {
    margin-bottom: 15px;
  }
  
  .search-box input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .progress-bar {
    height: 20px;
    background-color: #eee;
    border-radius: 10px;
    margin-bottom: 15px;
    position: relative;
    overflow: hidden;
  }
  
  .progress {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s ease;
  }
  
  .progress-bar span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #333;
  }
  
  .todo-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .todo-list li {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .todo-list li.completed span {
    text-decoration: line-through;
    color: #999;
  }
  
  .todo-list li.empty {
    text-align: center;
    color: #999;
    padding: 20px;
  }
  
  .todo-list input[type="checkbox"] {
    margin-right: 10px;
  }
  
  .todo-list span {
    flex: 1;
  }
  
  .todo-list button {
    background: none;
    border: none;
    color: #ff3e00;
    font-size: 18px;
    cursor: pointer;
  }
  
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
  }
  
  /* Form styles */
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-group input:not([type="checkbox"]) {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .form-group input.error {
    border-color: #ff3e00;
  }
  
  .form-group.checkbox {
    display: flex;
    align-items: center;
  }
  
  .form-group.checkbox label {
    margin-bottom: 0;
    margin-left: 8px;
  }
  
  .error-message {
    color: #ff3e00;
    font-size: 12px;
    margin-top: 5px;
  }
  
  /* User profile styles */
  .user-profile {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #ff3e00;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
  }
  
  .user-info h3 {
    margin: 0 0 10px 0;
  }
  
  .preferences {
    display: flex;
    gap: 20px;
  }
  
  /* Lazy loading styles */
  .lazy-section {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder {
    padding: 40px;
    background-color: #eee;
    border-radius: 8px;
    text-align: center;
    width: 100%;
  }
  
  .loading {
    padding: 20px;
    text-align: center;
    color: #666;
  }
  
  .info-box {
    background-color: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    width: 100%;
  }
  
  /* Cache styles */
  .cache-controls {
    margin-bottom: 15px;
  }
  
  .cache-info {
    background-color: #f0f0f0;
    padding: 15px;
    border-radius: 4px;
    font-size: 14px;
  }
  
  /* Button styles */
  button {
    padding: 8px 16px;
    background-color: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  button:hover:not(:disabled) {
    background-color: #dd3700;
  }
</style>