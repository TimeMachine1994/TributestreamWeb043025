<!--
  Runes Examples Page
  
  This page showcases various Svelte 5 runes patterns and examples.
-->
<script lang="ts">
  import { browser } from '$app/environment';
  import RunesExample from '$lib/examples/RunesExample.svelte';
  import { createLogger } from '$lib/logger';
  import { createLazyComponent } from '$lib/lazy/lazyLoad.svelte';
  import * as cache from '$lib/cache/cache.svelte';
  import * as apiCache from '$lib/cache/apiCache.svelte';
  
  // Create a dedicated logger
  const logger = createLogger('RunesExamplesPage');
  
  // Log page load
  logger.info('📄 Runes examples page loaded');
  
  // Lazy load the Chart component
  const LazyChart = createLazyComponent(() => 
    import('$lib/examples/Chart.svelte')
  );
  
  // Example data for the chart
  const chartData = $state({
    total: 10,
    completed: 6,
    remaining: 4,
    percentComplete: 60
  });
  
  // Cache some example data
  $effect(() => {
    if (browser) {
      cache.set('example-data', {
        timestamp: new Date(),
        chartData,
        message: 'This data is cached for 5 minutes'
      }, {
        ttl: 5 * 60 * 1000, // 5 minutes
        storageType: 'session'
      });
      
      logger.debug('📦 Cached example data');
    }
  });
  
  // Function to update chart data
  function updateChartData() {
    // Randomly update completed/remaining while keeping total the same
    const newCompleted = Math.min(chartData.total, Math.max(0, 
      chartData.completed + Math.floor(Math.random() * 3) - 1
    ));
    
    chartData.completed = newCompleted;
    chartData.remaining = chartData.total - newCompleted;
    chartData.percentComplete = (newCompleted / chartData.total) * 100;
    
    logger.debug('🔄 Updated chart data', { chartData });
  }
  
  // Function to clear cache
  function clearCache() {
    cache.clear();
    apiCache.invalidateAll();
    logger.debug('🧹 Cleared all cache');
  }
</script>

<div class="container">
  <header>
    <h1>Svelte 5 Runes Examples</h1>
    <p class="subtitle">
      Explore patterns and best practices for using Svelte 5 runes in the TributeStream application.
    </p>
  </header>
  
  <main>
    <section class="example-section">
      <h2>Main Example Component</h2>
      <RunesExample title="Svelte 5 Runes Demo" />
    </section>
    
    <section class="example-section">
      <h2>Lazy Loaded Component</h2>
      <p>This chart component is lazy loaded when the page renders:</p>
      
      <div class="chart-container">
        {#if LazyChart.loading}
          <div class="loading">
            <p>Loading chart component... ({LazyChart.progress.toFixed(0)}%)</p>
            <div class="progress-bar">
              <div class="progress" style="width: {LazyChart.progress}%"></div>
            </div>
          </div>
        {:else if LazyChart.error}
          <div class="error">
            <p>Failed to load chart: {LazyChart.error.message}</p>
          </div>
        {:else if LazyChart.component}
          <svelte:component this={LazyChart.component} data={chartData} title="Task Progress" />
          
          <div class="chart-controls">
            <button onclick={updateChartData}>Update Chart Data</button>
          </div>
        {/if}
      </div>
    </section>
    
    <section class="example-section">
      <h2>Cache Management</h2>
      <p>This example demonstrates the caching system:</p>
      
      <div class="cache-info">
        <p>Data is cached in sessionStorage with a 5-minute TTL.</p>
        <button onclick={clearCache}>Clear All Cache</button>
      </div>
    </section>
    
    <section class="example-section">
      <h2>Documentation</h2>
      <p>For more information about the runes patterns used in this application, check out:</p>
      
      <ul>
        <li><a href="/RUNES-PATTERNS.md" target="_blank">Runes Patterns Documentation</a></li>
        <li><a href="https://svelte.dev/docs/runes" target="_blank">Official Svelte 5 Runes Documentation</a></li>
      </ul>
    </section>
  </main>
  
  <footer>
    <p>
      For more information, check out the <a href="https://github.com/sveltejs/svelte" target="_blank" rel="noopener noreferrer">Svelte documentation</a>.
    </p>
  </footer>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
  }
  
  h1 {
    color: #ff3e00;
    font-size: 2.5rem;
    margin-bottom: 10px;
  }
  
  h2 {
    color: #676778;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #676778;
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
  }
  
  main {
    margin-bottom: 60px;
  }
  
  .example-section {
    margin-bottom: 40px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .chart-container {
    margin-top: 20px;
  }
  
  .loading {
    padding: 20px;
    text-align: center;
    background-color: #f0f0f0;
    border-radius: 8px;
  }
  
  .progress-bar {
    height: 10px;
    background-color: #eee;
    border-radius: 5px;
    margin-top: 10px;
    overflow: hidden;
  }
  
  .progress {
    height: 100%;
    background-color: #ff3e00;
    transition: width 0.3s ease;
  }
  
  .error {
    padding: 20px;
    text-align: center;
    background-color: #fff0f0;
    border: 1px solid #ffcccc;
    border-radius: 8px;
    color: #cc0000;
  }
  
  .chart-controls {
    margin-top: 20px;
    text-align: center;
  }
  
  .cache-info {
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 8px;
  }
  
  button {
    padding: 8px 16px;
    background-color: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
  }
  
  button:hover {
    background-color: #dd3700;
  }
  
  footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    color: #666;
    font-size: 0.9rem;
  }
  
  footer a {
    color: #ff3e00;
    text-decoration: none;
  }
  
  footer a:hover {
    text-decoration: underline;
  }
  
  ul {
    margin-left: 20px;
  }
  
  li {
    margin-bottom: 10px;
  }
  
  a {
    color: #ff3e00;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
</style>