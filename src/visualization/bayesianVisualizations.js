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
 * @returns {Chart|null} Chart.js instance or null if rendering failed
 */
export function renderDensityPlot(container, posteriorSamples, items = [], options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!posteriorSamples || Object.keys(posteriorSamples).length === 0) {
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No posterior samples available for density plot'
    });
    container.appendChild(emptyState);
    return null;
  }

  clearElement(container);

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
  
  for (const [itemId, samples] of Object.entries(posteriorSamples)) {
    if (samples.length === 0) continue;

    const item = items.find(i => i.id === itemId);
    const itemName = item?.name || itemId;

    const kdePoints = computeKDE(samples, 100);
    if (kdePoints.length === 0) continue;

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
  }

  if (datasets.length === 0) {
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No valid posterior samples for density plot'
    });
    container.appendChild(emptyState);
    return null;
  }

  // Create wrapper for chart and overlays
  const chartWrapper = createElement('div', { 
    className: 'bayesian-density-plot-wrapper',
    style: 'position: relative; width: 100%; height: 600px; background-color: #e8e8e8; padding: 20px; border-radius: 8px;'
  });

  // Create canvas element
  const canvas = createElement('canvas');
  const chartContainer = createElement('div', { 
    className: 'bayesian-chart-container',
    style: 'position: relative; width: 100%; height: 100%;'
  });
  chartContainer.appendChild(canvas);
  chartWrapper.appendChild(chartContainer);

  // Create summary statistics table overlay (top-right, like in reference image)
  const summaryTable = createElement('div', {
    className: 'bayesian-summary-table-overlay',
    style: 'position: absolute; top: 20px; right: 20px; background: white; border: 2px solid #000; padding: 12px; border-radius: 4px; font-size: 11px; z-index: 10; max-width: 320px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: monospace;'
  });

  // Table header - matching reference image format
  const tableHeader = createElement('div', {
    style: 'font-weight: bold; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #000; font-size: 11px; white-space: nowrap;'
  });
  tableHeader.textContent = 'Parameter | Median | 89% CI';
  summaryTable.appendChild(tableHeader);

  // Sort items by median (descending) for table
  const sortedItemData = [...itemData].sort((a, b) => b.median - a.median);

  // Table rows - matching reference image format
  sortedItemData.forEach(item => {
    const row = createElement('div', {
      style: 'padding: 2px 0; border-bottom: 1px solid #eee; font-size: 10px; white-space: nowrap;'
    });
    const medianStr = item.median.toFixed(5);
    const ciStr = `[${item.ci89.lower.toFixed(5)}, ${item.ci89.upper.toFixed(5)}]`;
    // Format: Parameter | Median | CI
    row.textContent = `${item.itemName} | ${medianStr} | ${ciStr}`;
    summaryTable.appendChild(row);
  });

  chartWrapper.appendChild(summaryTable);

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
      plugins: {
        title: {
          display: false // No title, cleaner look
        },
        legend: {
          display: true,
          position: 'right',
          align: 'start',
          labels: {
            color: '#333',
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
            color: '#333',
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

  const chart = new Chart(canvas, chartOptions);
  
  container.appendChild(chartWrapper);
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
    const bars = chart.getDatasetMeta(0).data;
    bars.forEach((bar, index) => {
      const entry = entries[index];
      const barElement = bar.element;
      // Store interval data for potential hover effects
      barElement._interval = {
        lower: entry.lower,
        upper: entry.upper
      };
    });
  }, 100);

  return chart;
}
