<!--
  Chart.svelte - Simple Chart Component
  
  This is a simple chart component that demonstrates lazy loading.
  It renders a bar chart based on the provided data.
-->
<script lang="ts">
  import { createLogger } from '$lib/logger';
  
  // Create a dedicated logger
  const logger = createLogger('ChartComponent');
  
  // Component props
  interface Props {
    data?: {
      total?: number;
      completed?: number;
      remaining?: number;
      percentComplete?: number;
    };
    title?: string;
    height?: number;
    showLegend?: boolean;
  }
  
  let {
    data = { total: 0, completed: 0, remaining: 0, percentComplete: 0 },
    title = 'Chart',
    height = 200,
    showLegend = true
  } = $props();
  
  // Log component initialization
  logger.debug('📊 Chart component initialized', { data });
  
  // Calculate bar heights
  let maxValue = $derived(Math.max(data.completed || 0, data.remaining || 0, 1));
  let completedHeight = $derived(((data.completed || 0) / maxValue) * height);
  let remainingHeight = $derived(((data.remaining || 0) / maxValue) * height);
  
  // Colors
  const colors = {
    completed: '#4CAF50',
    remaining: '#FFC107'
  };
</script>

<div class="chart-container">
  {#if title}
    <h3 class="chart-title">{title}</h3>
  {/if}
  
  <div class="chart" style="height: {height}px;">
    <div class="chart-bars">
      <div class="bar-group">
        <div 
          class="bar completed-bar" 
          style="height: {completedHeight}px; background-color: {colors.completed};"
          title="Completed: {data.completed}"
        ></div>
        <div class="bar-label">Completed</div>
      </div>
      
      <div class="bar-group">
        <div 
          class="bar remaining-bar" 
          style="height: {remainingHeight}px; background-color: {colors.remaining};"
          title="Remaining: {data.remaining}"
        ></div>
        <div class="bar-label">Remaining</div>
      </div>
    </div>
    
    <div class="chart-axis">
      {#each Array(5) as _, i}
        <div class="axis-line" style="bottom: {(i / 4) * 100}%;">
          <span class="axis-value">{Math.round(maxValue * (i / 4))}</span>
        </div>
      {/each}
    </div>
  </div>
  
  {#if showLegend}
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color" style="background-color: {colors.completed};"></div>
        <div class="legend-label">Completed: {data.completed}</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: {colors.remaining};"></div>
        <div class="legend-label">Remaining: {data.remaining}</div>
      </div>
      <div class="legend-item">
        <div class="legend-label">Total: {data.total}</div>
      </div>
      <div class="legend-item">
        <div class="legend-label">Completion: {data.percentComplete?.toFixed(0)}%</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .chart-container {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .chart-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    text-align: center;
    color: #333;
  }
  
  .chart {
    position: relative;
    width: 100%;
    margin-bottom: 1rem;
  }
  
  .chart-bars {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    height: 100%;
    padding-bottom: 30px;
    position: relative;
    z-index: 2;
  }
  
  .bar-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px;
    margin: 0 1rem;
  }
  
  .bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    transition: height 0.5s ease;
  }
  
  .bar-label {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #666;
  }
  
  .chart-axis {
    position: absolute;
    left: 0;
    bottom: 30px;
    width: 100%;
    height: calc(100% - 30px);
    z-index: 1;
  }
  
  .axis-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .axis-value {
    position: absolute;
    left: 0;
    bottom: 0;
    transform: translateY(50%);
    font-size: 0.7rem;
    color: #999;
  }
  
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    margin-right: 0.5rem;
  }
  
  .legend-label {
    font-size: 0.8rem;
    color: #666;
  }
</style>