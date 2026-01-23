/**
 * Bayesian-specific visualizations
 * Density plots and ranked probability charts for posterior distributions
 */

import { Chart, registerables } from 'chart.js';
import { createElement, clearElement } from '../utils/dom.js';
import { computeStatistics, computeCredibleInterval, computeMedian } from '../utils/posteriorStats.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Compute kernel density estimation (KDE) for posterior samples
 * Uses Gaussian kernel with Silverman's rule of thumb for bandwidth
 * @param {number[]} samples - Array of posterior samples
 * @param {number} numPoints - Number of points in density estimate (default: 100)
 * @param {number} bandwidth - Bandwidth for KDE (optional, auto-computed if not provided)
 * @returns {Array<{x: number, y: number}>} Density points
 */
export function computeKDE(samples, numPoints = 100, bandwidth = null) {
  if (!samples || samples.length === 0) {
    return [];
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  // Silverman's rule of thumb for bandwidth
  if (bandwidth === null) {
    const n = samples.length;
    const stdDev = Math.sqrt(samples.reduce((sum, x) => {
      const mean = samples.reduce((a, b) => a + b, 0) / n;
      return sum + Math.pow(x - mean, 2);
    }, 0) / n);
    const iqr = sorted[Math.floor(n * 0.75)] - sorted[Math.floor(n * 0.25)];
    const h = 0.9 * Math.min(stdDev, iqr / 1.34) * Math.pow(n, -0.2);
    bandwidth = h || range / 10; // Fallback if calculation fails
  }

  // Create evaluation points
  const padding = range * 0.1;
  const xMin = min - padding;
  const xMax = max + padding;
  const step = (xMax - xMin) / numPoints;
  const xPoints = Array.from({ length: numPoints }, (_, i) => xMin + i * step);

  // Compute density at each point using Gaussian kernel
  const densityPoints = xPoints.map(x => {
    let density = 0;
    for (const sample of samples) {
      const diff = (x - sample) / bandwidth;
      density += Math.exp(-0.5 * diff * diff);
    }
    density /= (samples.length * bandwidth * Math.sqrt(2 * Math.PI));
    return { x, y: density };
  });

  return densityPoints;
}

/**
 * Render density plot showing posterior distribution for item weights
 * Enhanced version with summary statistics table overlay (similar to reference image)
 * @param {HTMLElement} container - Container element to render chart into
 * @param {Object<string, number[]>} posteriorSamples - Posterior samples per item
 * @param {Array<Object>} items - Item metadata array
 * @param {Object} options - Chart configuration options
 * @param {Object} options.summaryStatistics - Optional summary statistics (if not provided, will compute)
 * @param {Function} options.onProgress - Optional progress callback (progress: number 0-100)
 * @returns {Promise<Chart|null>} Chart.js instance or null if rendering failed
 */
export async function renderDensityPlot(container, posteriorSamples, items = [], options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!posteriorSamples || Object.keys(posteriorSamples).length === 0) {
    // Clear any loading indicator
    const loadingIndicator = container.querySelector('.bayesian-density-loading');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    clearElement(container);
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No posterior samples available for density plot'
    });
    container.appendChild(emptyState);
    return null;
  }

  // Compute summary statistics if not provided
  let summaryStats = options.summaryStatistics;
  if (!summaryStats) {
    summaryStats = computeStatistics(posteriorSamples);
  }

  // Prepare data: compute KDE for each item
  const datasets = [];
  // Enhanced color palette matching reference image style
  const colors = [
    'rgba(250, 128, 114, 0.8)',  // Salmon pink
    'rgba(255, 215, 0, 0.8)',     // Gold
    'rgba(128, 128, 0, 0.8)',     // Olive green
    'rgba(50, 205, 50, 0.8)',    // Lime green
    'rgba(0, 206, 209, 0.8)',    // Teal
    'rgba(173, 216, 230, 0.8)',  // Light blue
    'rgba(221, 160, 221, 0.8)',  // Light purple
    'rgba(138, 43, 226, 0.8)',   // Dark blue/lavender
    'rgba(255, 0, 255, 0.8)',    // Magenta
    'rgba(192, 192, 192, 0.8)'   // Light grey
  ];

  const itemData = [];
  let colorIndex = 0;
  
  // Get all item entries for progress tracking
  const itemEntries = Object.entries(posteriorSamples).filter(([_, samples]) => samples.length > 0);
  const totalItems = itemEntries.length;
  let processedItems = 0;
  
  // Process items with progress updates
  for (const [itemId, samples] of itemEntries) {
    const item = items.find(i => i.id === itemId);
    const itemName = item?.name || itemId;

    // Compute KDE - this is the expensive operation
    const kdePoints = computeKDE(samples, 100);
    if (kdePoints.length === 0) {
      processedItems++;
      if (options.onProgress) {
        options.onProgress(Math.min(95, Math.round((processedItems / totalItems) * 90)));
      }
      // Yield to browser to update UI
      await new Promise(resolve => setTimeout(resolve, 0));
      continue;
    }

    const color = colors[colorIndex % colors.length];
    // Ensure data is in correct format for Chart.js with x,y coordinates
    // Sort by x to ensure proper line rendering
    const chartData = kdePoints
      .map(point => ({
        x: point.x,
        y: point.y
      }))
      .sort((a, b) => a.x - b.x); // Sort by x value for proper line chart rendering
    
    datasets.push({
      label: itemName,
      data: chartData,
      borderColor: color,
      backgroundColor: color.replace('0.8', '0.3'),
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4
    });

    // Store item data for summary table
    const stats = summaryStats[itemId];
    if (stats) {
      // Compute 89% CI (as shown in reference image)
      const ci89 = computeCredibleInterval(samples, 0.89);
      itemData.push({
        itemId,
        itemName,
        median: stats.median,
        ci89,
        color
      });
    }

    colorIndex++;
    processedItems++;
    
    // Update progress (90% for KDE computation, 10% for chart rendering)
    if (options.onProgress) {
      options.onProgress(Math.min(90, Math.round((processedItems / totalItems) * 90)));
    }
    
    // Yield to browser periodically to keep UI responsive
    if (processedItems % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (datasets.length === 0) {
    // Clear any loading indicator
    clearElement(container);
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No valid posterior samples for density plot'
    });
    container.appendChild(emptyState);
    return null;
  }

  // Clear loading indicator before rendering chart
  const loadingIndicator = container.querySelector('.bayesian-density-loading');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
  
  // Update progress to 95% (chart setup)
  if (options.onProgress) {
    options.onProgress(95);
  }
  
  // Yield to browser before chart rendering
  await new Promise(resolve => setTimeout(resolve, 0));

  // Create wrapper for chart
  const chartWrapper = createElement('div', { 
    className: 'bayesian-density-plot-wrapper',
    style: 'position: relative; width: 100%; height: 600px; background-color: #e8e8e8; padding: 20px; border-radius: 8px;'
  });

  // Create chart container
  const canvas = createElement('canvas');
  const chartContainer = createElement('div', { 
    className: 'bayesian-chart-container',
    style: 'position: relative; width: 100%; height: 100%;'
  });
  chartContainer.appendChild(canvas);
  chartWrapper.appendChild(chartContainer);

  // Create collapsible summary statistics table component
  const collapsibleContainer = createElement('div', {
    className: 'bayesian-summary-table-collapsible',
    style: 'position: absolute; top: 20px; right: 20px; z-index: 10;'
  });

  // Toggle button
  const toggleButton = createElement('button', {
    className: 'bayesian-summary-table-toggle',
    style: 'background: white; border: 2px solid #000; border-radius: 4px 4px 0 0; padding: 8px 16px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: monospace; color: #000;'
  });
  toggleButton.textContent = 'Show Parameter Details ▼';
  collapsibleContainer.appendChild(toggleButton);

  // Summary table (collapsed by default)
  const summaryTable = createElement('div', {
    className: 'bayesian-summary-table-overlay',
    style: 'display: none; background: white; border: 2px solid #000; border-top: none; border-radius: 0 0 4px 4px; font-size: 11px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: monospace; max-width: 400px; max-height: 400px; flex-direction: column;'
  });

  // Table header - matching reference image format (sticky header)
  const tableHeader = createElement('div', {
    style: 'font-weight: bold; padding: 12px 12px 6px 12px; border-bottom: 1px solid #000; font-size: 11px; white-space: nowrap; flex-shrink: 0; background: white; color: #000;'
  });
  tableHeader.textContent = 'Parameter | Median | 89% CI';
  summaryTable.appendChild(tableHeader);

  // Scrollable table body
  const tableBody = createElement('div', {
    style: 'overflow-y: auto; overflow-x: hidden; flex: 1; min-height: 0; padding: 0 12px 12px 12px; color: #000;'
  });

  // Sort items by median (descending) for table
  const sortedItemData = [...itemData].sort((a, b) => b.median - a.median);

  // Table rows - matching reference image format
  sortedItemData.forEach(item => {
    const row = createElement('div', {
      style: 'padding: 2px 0; border-bottom: 1px solid #eee; font-size: 10px; white-space: nowrap; color: #000;'
    });
    const medianStr = item.median.toFixed(5);
    const ciStr = `[${item.ci89.lower.toFixed(5)}, ${item.ci89.upper.toFixed(5)}]`;
    // Format: Parameter | Median | CI
    row.textContent = `${item.itemName} | ${medianStr} | ${ciStr}`;
    tableBody.appendChild(row);
  });

  summaryTable.appendChild(tableBody);
  collapsibleContainer.appendChild(summaryTable);
  chartWrapper.appendChild(collapsibleContainer);

  // Toggle functionality
  let isExpanded = false;
  toggleButton.addEventListener('click', () => {
    isExpanded = !isExpanded;
    if (isExpanded) {
      summaryTable.style.display = 'flex';
      toggleButton.textContent = 'Hide Parameter Details ▲';
      toggleButton.style.borderRadius = '4px 4px 0 0';
    } else {
      summaryTable.style.display = 'none';
      toggleButton.textContent = 'Show Parameter Details ▼';
      toggleButton.style.borderRadius = '4px';
    }
  });

  // Determine overall x-axis range from all datasets
  let globalXMin = Infinity;
  let globalXMax = -Infinity;
  datasets.forEach(dataset => {
    if (dataset.data && dataset.data.length > 0) {
      dataset.data.forEach(point => {
        if (typeof point.x === 'number' && !isNaN(point.x)) {
          if (point.x < globalXMin) globalXMin = point.x;
          if (point.x > globalXMax) globalXMax = point.x;
        }
      });
    }
  });
  
  // If no valid range found, compute from all posterior samples directly
  if (!isFinite(globalXMin) || !isFinite(globalXMax) || globalXMin === globalXMax) {
    const allSamples = [];
    Object.values(posteriorSamples).forEach(samples => {
      if (Array.isArray(samples)) {
        allSamples.push(...samples.filter(s => typeof s === 'number' && !isNaN(s) && s > 0));
      }
    });
    if (allSamples.length > 0) {
      const sorted = [...allSamples].sort((a, b) => a - b);
      globalXMin = Math.max(0, sorted[0]);
      globalXMax = sorted[sorted.length - 1];
    } else {
      globalXMin = 0;
      globalXMax = 0.3; // Default range for probabilities
    }
  }
  
  // Add padding to x-axis range
  const xRange = globalXMax - globalXMin;
  const xPadding = xRange > 0 ? xRange * 0.05 : 0.01; // 5% padding or 0.01 if range is 0
  const xMin = Math.max(0, globalXMin - xPadding);
  const xMax = globalXMax + xPadding;

  // Chart.js configuration - matching reference image style
  const chartOptions = {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 180, // Space for legend on right
          top: 10,
          bottom: 10,
          left: 10
        }
      },
      animation: {
        onComplete: () => {
          // Legend should be rendered by now
          setTimeout(() => makeLegendScrollable(), 50);
        }
      },
      plugins: {
        title: {
          display: false // No title, cleaner look
        },
        legend: {
          display: true,
          position: 'right',
          align: 'start',
          labels: {
            color: '#000',
            font: { size: 12 },
            usePointStyle: true,
            padding: 8,
            generateLabels: (chart) => {
              return datasets.map((dataset, index) => {
                const item = itemData.find(d => d.itemName === dataset.label);
                return {
                  text: dataset.label,
                  fillStyle: dataset.borderColor,
                  strokeStyle: dataset.borderColor,
                  lineWidth: 2,
                  hidden: false,
                  index: index
                };
              });
            }
          },
          title: {
            display: true,
            text: 'Parameter',
            color: '#000',
            font: { size: 12, weight: 'bold' }
          }
        },
        tooltip: {
          intersect: false,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: Density = ${context.parsed.y.toFixed(4)}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Probability of item',
            color: '#333',
            font: { size: 13, weight: 'bold' }
          },
          ticks: {
            color: '#333',
            font: { size: 11 },
            callback: (value) => {
              return value.toFixed(2);
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.9)',
            lineWidth: 1
          },
          beginAtZero: false, // Don't force zero, use data range
          min: xMin,
          max: xMax
        },
        y: {
          title: {
            display: true,
            text: 'Probability density',
            color: '#333',
            font: { size: 13, weight: 'bold' }
          },
          ticks: {
            color: '#333',
            font: { size: 11 }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.9)',
            lineWidth: 1
          },
          beginAtZero: true
        }
      }
    }
  };

  // Make legend scrollable after chart is rendered
  // Chart.js v3+ renders the legend as HTML when position is 'right'
  const makeLegendScrollable = () => {
    try {
      // Chart.js creates the legend as a direct child of the chart container's parent
      // The parent is usually chartWrapper, and legend is a sibling to chartContainer
      const chartParent = chartContainer.parentElement;
      if (!chartParent) return;
      
      // Get all direct children of the parent
      const siblings = Array.from(chartParent.children);
      
      for (const sibling of siblings) {
        // Skip known elements
        if (sibling === chartContainer || 
            sibling === collapsibleContainer || 
            sibling.classList.contains('bayesian-legend-scrollable')) {
          continue;
        }
        
        const style = window.getComputedStyle(sibling);
        
        // Legend is absolutely positioned
        if (style.position === 'absolute') {
          const rect = sibling.getBoundingClientRect();
          const wrapperRect = chartWrapper.getBoundingClientRect();
          
          // Check if it's on the right side (legend position)
          // Also check if it contains text that looks like a legend (has "Parameter" or list items)
          const isOnRight = rect.left > wrapperRect.left + wrapperRect.width * 0.5;
          const hasLegendContent = sibling.textContent.includes('Parameter') || 
                                   sibling.querySelector('ul') !== null ||
                                   sibling.querySelectorAll('li').length > 0;
          
          if (isOnRight && (hasLegendContent || sibling.textContent.trim().length > 10)) {
            sibling.classList.add('bayesian-legend-scrollable');
            console.log('[BayesianVisualizations] Found and styled legend container');
            return;
          }
        }
      }
      
      // Fallback: search all divs in wrapper
      const allDivs = chartWrapper.querySelectorAll('div');
      for (const div of allDivs) {
        if (div === chartContainer || div === collapsibleContainer) continue;
        if (div.classList.contains('bayesian-legend-scrollable')) continue;
        
        const style = window.getComputedStyle(div);
        if (style.position === 'absolute') {
          const rect = div.getBoundingClientRect();
          const wrapperRect = chartWrapper.getBoundingClientRect();
          
          if (rect.left > wrapperRect.left + wrapperRect.width * 0.5) {
            // Check if it looks like a legend
            const hasList = div.querySelector('ul') !== null;
            const hasLegendText = div.textContent.includes('Parameter');
            const hasMultipleItems = div.querySelectorAll('li, span').length > 5;
            
            if (hasList || hasLegendText || hasMultipleItems) {
              div.classList.add('bayesian-legend-scrollable');
              console.log('[BayesianVisualizations] Found legend via fallback search');
              return;
            }
          }
        }
      }
    } catch (error) {
      console.warn('[BayesianVisualizations] Failed to make legend scrollable:', error);
    }
  };
  
  const chart = new Chart(canvas, chartOptions);
  
  // Set up MutationObserver to catch legend when it's added
  let legendFound = false;
  const observer = new MutationObserver((mutations) => {
    if (legendFound) return;
    
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue; // Only element nodes
        
        // Check if this is the legend
        const style = window.getComputedStyle(node);
        if (style.position === 'absolute' && 
            node !== chartContainer && 
            node !== collapsibleContainer &&
            !node.classList.contains('bayesian-legend-scrollable')) {
          
          const rect = node.getBoundingClientRect();
          const wrapperRect = chartWrapper.getBoundingClientRect();
          
          if (rect.left > wrapperRect.left + wrapperRect.width * 0.5) {
            const hasList = node.querySelector('ul') !== null;
            const hasLegendText = node.textContent.includes('Parameter');
            const hasMultipleItems = node.querySelectorAll('li, span').length > 5;
            
            if (hasList || hasLegendText || hasMultipleItems) {
              node.classList.add('bayesian-legend-scrollable');
              legendFound = true;
              observer.disconnect();
              console.log('[BayesianVisualizations] Legend found via MutationObserver');
              return;
            }
          }
        }
        
        // Also check children of added nodes
        if (node.querySelectorAll) {
          const potentialLegends = node.querySelectorAll('div[style*="position: absolute"]');
          for (const potentialLegend of potentialLegends) {
            if (potentialLegend !== chartContainer && 
                potentialLegend !== collapsibleContainer &&
                !potentialLegend.classList.contains('bayesian-legend-scrollable')) {
              const rect = potentialLegend.getBoundingClientRect();
              const wrapperRect = chartWrapper.getBoundingClientRect();
              if (rect.left > wrapperRect.left + wrapperRect.width * 0.5) {
                potentialLegend.classList.add('bayesian-legend-scrollable');
                legendFound = true;
                observer.disconnect();
                console.log('[BayesianVisualizations] Legend found in added node');
                return;
              }
            }
          }
        }
      }
    }
    
    // Also try direct search
    makeLegendScrollable();
  });
  
  observer.observe(chartWrapper, { 
    childList: true, 
    subtree: true,
    attributes: false
  });
  
  // Try multiple times with increasing delays
  setTimeout(makeLegendScrollable, 0);
  setTimeout(makeLegendScrollable, 100);
  setTimeout(makeLegendScrollable, 300);
  setTimeout(makeLegendScrollable, 500);
  setTimeout(makeLegendScrollable, 1000);
  
  // Disconnect observer after 3 seconds to avoid memory leaks
  setTimeout(() => {
    if (!legendFound) {
      observer.disconnect();
      console.warn('[BayesianVisualizations] Legend not found after 3 seconds');
    }
  }, 3000);
  
  // Also try on chart resize and update
  if (chart.options) {
    const originalOnResize = chart.options.onResize;
    chart.options.onResize = () => {
      if (originalOnResize) originalOnResize();
      makeLegendScrollable();
    };
  }
  
  container.appendChild(chartWrapper);
  
  // Update progress to 100% (complete)
  if (options.onProgress) {
    options.onProgress(100);
  }
  
  return chart;
}

/**
 * Render ranked probability chart with credible intervals
 * @param {HTMLElement} container - Container element to render chart into
 * @param {Object<string, Object>} summaryStatistics - Summary statistics per item
 * @param {Array<Object>} items - Item metadata array
 * @param {Object} options - Chart configuration options
 * @returns {Chart|null} Chart.js instance or null if rendering failed
 */
export function renderRankedProbabilityChart(container, summaryStatistics, items = [], options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!summaryStatistics || Object.keys(summaryStatistics).length === 0) {
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No summary statistics available for ranked probability chart'
    });
    container.appendChild(emptyState);
    return null;
  }

  clearElement(container);

  // Prepare data: sort by median and prepare error bars
  const entries = Object.entries(summaryStatistics)
    .map(([itemId, stats]) => {
      const item = items.find(i => i.id === itemId);
      return {
        itemId,
        name: item?.name || itemId,
        median: stats.median,
        map: stats.map,
        lower: stats.credibleInterval.lower,
        upper: stats.credibleInterval.upper
      };
    })
    .sort((a, b) => b.median - a.median); // Sort by median descending

  const labels = entries.map(e => e.name);
  const medians = entries.map(e => e.median);
  const lowerBounds = entries.map(e => e.lower);
  const upperBounds = entries.map(e => e.upper);

  // Create canvas element
  const canvas = createElement('canvas');
  const chartContainer = createElement('div', { className: 'bayesian-chart-container' });
  chartContainer.appendChild(canvas);
  container.appendChild(chartContainer);

  // Chart.js configuration with error bars
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Posterior Median (MCMC)',
        data: medians,
        backgroundColor: 'rgba(74, 144, 226, 0.6)',
        borderColor: 'rgba(74, 144, 226, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    type: 'bar',
    data: chartData,
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Ranked Probability with 95% Credible Intervals (MCMC)',
          color: '#d4d4d4',
          font: { size: 14 }
        },
        legend: {
          display: false
        },
        tooltip: {
          intersect: false,
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              const entry = entries[index];
              return [
                `Median: ${(entry.median * 100).toFixed(2)}%`,
                `95% CI: [${(entry.lower * 100).toFixed(2)}%, ${(entry.upper * 100).toFixed(2)}%]`,
                `MAP: ${(entry.map * 100).toFixed(2)}%`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Weight',
            color: '#d4d4d4'
          },
          ticks: {
            color: '#d4d4d4',
            callback: (value) => {
              return (value * 100).toFixed(2) + '%';
            }
          },
          grid: {
            color: '#3a3a3a'
          }
        },
        y: {
          ticks: {
            color: '#d4d4d4'
          },
          grid: {
            color: '#3a3a3a'
          }
        }
      }
    }
  };

  // Add error bars using annotation plugin or custom rendering
  // For now, we'll use tooltips to show intervals
  // Full error bar rendering would require Chart.js annotation plugin

  const chart = new Chart(canvas, chartOptions);

  // Add visual indicators for credible intervals (as annotations on bars)
  // This is a simplified approach - full implementation would use annotation plugin
  setTimeout(() => {
    try {
      const datasetMeta = chart.getDatasetMeta(0);
      if (!datasetMeta || !datasetMeta.data) {
        return; // Chart not ready yet
      }
      
      const bars = datasetMeta.data;
      bars.forEach((bar, index) => {
        if (!bar || !bar.element || index >= entries.length) {
          return; // Skip invalid bars or entries
        }
        
        const entry = entries[index];
        if (!entry) {
          return; // Skip missing entries
        }
        
        const barElement = bar.element;
        // Store interval data for potential hover effects
        barElement._interval = {
          lower: entry.lower,
          upper: entry.upper
        };
      });
    } catch (error) {
      // Silently fail - interval annotations are optional
      console.warn('[BayesianVisualizations] Failed to add interval annotations:', error);
    }
  }, 100);

  return chart;
}
