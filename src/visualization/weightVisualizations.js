/**
 * Weight visualization rendering functions
 * Provides Chart.js-based visualizations for weight data
 */

import { Chart, registerables } from 'chart.js';
import { createElement, clearElement } from '../utils/dom.js';
import { calculateCDF, calculateHeatmapColor } from '../utils/mathUtils.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Prepare weight entries with metadata
 * @param {Object<string, number>} weights - Weight data object
 * @param {Array<Object>} items - Item metadata array
 * @returns {Array<Object>} Sorted weight entries with metadata
 */
function prepareWeightEntries(weights, items = []) {
  return Object.entries(weights)
    .map(([itemId, weight]) => {
      const item = items.find(i => i.id === itemId);
      return {
        itemId,
        weight: Math.max(0, weight), // Ensure non-negative
        name: item?.name || itemId,
        icon: item?.icon
      };
    })
    .filter(entry => isFinite(entry.weight)) // Filter out NaN and Infinity
    .sort((a, b) => b.weight - a.weight); // Sort descending
}

/**
 * Prepare Chart.js bar chart data
 * @param {Array<Object>} sortedEntries - Sorted weight entries
 * @returns {Object} Chart.js data structure
 */
function prepareBarChartData(sortedEntries) {
  return {
    labels: sortedEntries.map(entry => entry.name),
    datasets: [{
      label: 'Item Weights',
      data: sortedEntries.map(entry => entry.weight),
      backgroundColor: 'rgba(74, 144, 226, 0.6)',
      borderColor: 'rgba(74, 144, 226, 1)',
      borderWidth: 1
    }]
  };
}

/**
 * Render ranked bar chart visualization
 * @param {HTMLElement} container - Container element to render chart into
 * @param {Object<string, number>} weights - Weight data object
 * @param {Array<Object>} items - Item metadata array
 * @param {Object} options - Chart configuration options
 * @returns {Chart|null} Chart.js instance or null if rendering failed
 * @throws {Error} If container is invalid or weights are empty
 */
export function renderRankedBarChart(container, weights, items = [], options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!weights || typeof weights !== 'object' || Object.keys(weights).length === 0) {
    throw new Error('Weights must be a non-empty object');
  }

  clearElement(container);

  // Prepare data
  const sortedEntries = prepareWeightEntries(weights, items);
  if (sortedEntries.length === 0) {
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No weights available for visualization'
    });
    container.appendChild(emptyState);
    return null;
  }

  // Handle single item edge case
  if (sortedEntries.length === 1) {
    // Still render chart, but with single bar
  }

  const chartData = prepareBarChartData(sortedEntries);

  // Create canvas element
  const canvas = createElement('canvas');
  const chartContainer = createElement('div', { className: 'weight-chart-container' });
  chartContainer.appendChild(canvas);
  container.appendChild(chartContainer);

  // Chart.js configuration
  const chartOptions = {
    type: 'bar',
    data: chartData,
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          intersect: false,
          callbacks: {
            label: (context) => {
              return `${context.parsed.x.toFixed(4)} (${(context.parsed.x * 100).toFixed(2)}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
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

  // Create chart
  const chart = new Chart(canvas, chartOptions);

  return chart;
}

/**
 * Render log-scale bar chart visualization
 * @param {HTMLElement} container - Container element to render chart into
 * @param {Object<string, number>} weights - Weight data object
 * @param {Array<Object>} items - Item metadata array
 * @param {Object} options - Chart configuration options
 * @returns {Chart|null} Chart.js instance or null if rendering failed
 * @throws {Error} If container is invalid or weights are empty
 */
export function renderLogScaleBarChart(container, weights, items = [], options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!weights || typeof weights !== 'object' || Object.keys(weights).length === 0) {
    throw new Error('Weights must be a non-empty object');
  }

  clearElement(container);

  // Prepare data - filter out zero weights (log scale requires positive values)
  const sortedEntries = prepareWeightEntries(weights, items)
    .filter(entry => entry.weight > 0);

  if (sortedEntries.length === 0) {
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No positive weights available for log-scale visualization'
    });
    container.appendChild(emptyState);
    return null;
  }

  // Handle single item edge case
  if (sortedEntries.length === 1) {
    // Still render chart, but with single bar
  }

  const chartData = prepareBarChartData(sortedEntries);

  // Create canvas element
  const canvas = createElement('canvas');
  const chartContainer = createElement('div', { className: 'weight-chart-container' });
  chartContainer.appendChild(canvas);
  container.appendChild(chartContainer);

  // Chart.js configuration with logarithmic scale
  const chartOptions = {
    type: 'bar',
    data: chartData,
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          intersect: false,
          callbacks: {
            label: (context) => {
              return `${context.parsed.x.toFixed(4)} (${(context.parsed.x * 100).toFixed(2)}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Log Scale',
          color: '#d4d4d4',
          position: 'top',
          font: {
            size: 12
          }
        }
      },
      scales: {
        x: {
          type: 'logarithmic',
          beginAtZero: false,
          ticks: {
            color: '#d4d4d4',
            callback: (value) => {
              return (value * 100).toFixed(2) + '%';
            }
          },
          grid: {
            color: '#3a3a3a'
          },
          title: {
            display: true,
            text: 'Weight (Log Scale)',
            color: '#d4d4d4'
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

  // Create chart
  const chart = new Chart(canvas, chartOptions);

  return chart;
}

/**
 * Render CDF curve visualization
 * @param {HTMLElement} container - Container element to render chart into
 * @param {Object<string, number>} weights - Weight data object
 * @param {Object} options - Chart configuration options
 * @returns {Chart|null} Chart.js instance or null if rendering failed
 * @throws {Error} If container is invalid or weights are empty
 */
export function renderCDFCurve(container, weights, options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!weights || typeof weights !== 'object' || Object.keys(weights).length === 0) {
    throw new Error('Weights must be a non-empty object');
  }

  clearElement(container);

  try {
    const cdfPoints = calculateCDF(weights);

    if (cdfPoints.length === 0) {
      const emptyState = createElement('div', {
        className: 'visualization-placeholder',
        textContent: 'No CDF data available'
      });
      container.appendChild(emptyState);
      return null;
    }

    // Handle single item edge case - CDF will show single point at 100%
    // Handle identical weights edge case - CDF will show jump from 0% to 100%

    // Create canvas element
    const canvas = createElement('canvas');
    const chartContainer = createElement('div', { className: 'weight-chart-container' });
    chartContainer.appendChild(canvas);
    container.appendChild(chartContainer);

    // Prepare chart data
    const chartData = {
      datasets: [{
        label: 'Cumulative Distribution',
        data: cdfPoints.map(point => ({
          x: point.weight,
          y: point.cumulativePercentage
        })),
        borderColor: 'rgba(74, 144, 226, 1)',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    };

    // Chart.js configuration
    const chartOptions = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            intersect: false,
            callbacks: {
              label: (context) => {
                const point = context.raw;
                return `Weight: ${point.x.toFixed(4)} (${(point.x * 100).toFixed(2)}%), Cumulative: ${point.y.toFixed(2)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
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
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Cumulative Percentage (%)',
              color: '#d4d4d4'
            },
            ticks: {
              color: '#d4d4d4',
              callback: (value) => {
                return value + '%';
              }
            },
            grid: {
              color: '#3a3a3a'
            }
          }
        }
      }
    };

    // Create chart
    const chart = new Chart(canvas, chartOptions);
    return chart;
  } catch (error) {
    const errorState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: `Error rendering CDF: ${error.message}`
    });
    container.appendChild(errorState);
    return null;
  }
}

/**
 * Render heatmap visualization
 * @param {HTMLElement} container - Container element to render heatmap into
 * @param {Object<string, number>} weights - Weight data object
 * @param {Array<Object>} items - Item metadata array
 * @param {Object} options - Heatmap configuration options
 * @returns {HTMLElement} Heatmap container element
 * @throws {Error} If container is invalid or weights are empty
 */
export function renderHeatmap(container, weights, items = [], options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!weights || typeof weights !== 'object' || Object.keys(weights).length === 0) {
    throw new Error('Weights must be a non-empty object');
  }

  clearElement(container);

  // Prepare data
  const sortedEntries = prepareWeightEntries(weights, items);
  if (sortedEntries.length === 0) {
    const emptyState = createElement('div', {
      className: 'visualization-placeholder',
      textContent: 'No weights available for heatmap'
    });
    container.appendChild(emptyState);
    return container;
  }

  // Handle single item edge case
  if (sortedEntries.length === 1) {
    // Still render heatmap with single cell
  }

  // Calculate min/max weights for color normalization
  const weightValues = sortedEntries.map(entry => entry.weight);
  const minWeight = Math.min(...weightValues);
  const maxWeight = Math.max(...weightValues);

  // Handle identical weights edge case
  if (minWeight === maxWeight && minWeight > 0) {
    // All items will have the same color intensity (maximum)
  }

  // Get color scheme from options
  const colorScheme = options.colorScheme || {};

  // Create heatmap grid container
  const heatmapGrid = createElement('div', { className: 'weight-heatmap' });

  // Create cells for each item
  sortedEntries.forEach(entry => {
    const cell = createElement('div', { className: 'weight-heatmap-cell' });
    
    // Calculate color based on weight
    const cellColor = calculateHeatmapColor(entry.weight, minWeight, maxWeight, colorScheme);
    cell.style.backgroundColor = cellColor;
    cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';

    // Item icon (if available)
    if (entry.icon) {
      const icon = createElement('img', {
        className: 'weight-heatmap-icon',
        src: entry.icon,
        alt: entry.name,
        style: 'width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;'
      });
      cell.appendChild(icon);
    }

    // Item name and weight
    const cellContent = createElement('div', { className: 'weight-heatmap-content' });
    const itemName = createElement('span', {
      className: 'weight-heatmap-name',
      textContent: entry.name,
      style: 'font-weight: 500; margin-right: 8px;'
    });
    const weightValue = createElement('span', {
      className: 'weight-heatmap-value',
      textContent: `${(entry.weight * 100).toFixed(2)}%`,
      style: 'opacity: 0.9; font-size: 0.9em;'
    });
    cellContent.appendChild(itemName);
    cellContent.appendChild(weightValue);
    cell.appendChild(cellContent);

    heatmapGrid.appendChild(cell);
  });

  container.appendChild(heatmapGrid);
  return container;
}
