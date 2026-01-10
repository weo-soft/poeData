/**
 * Chart.js wrapper for statistics charts
 */

import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Generate category statistics charts
 * @param {HTMLElement} container - Container element to render charts into
 * @param {Array} items - Array of item objects
 * @param {string} categoryId - Category identifier
 */
export function generateCategoryCharts(container, items, _categoryId) {
  // Clear container
  container.innerHTML = '';
  
  if (items.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No items to display charts for.';
    emptyMessage.className = 'empty-message';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Create charts container
  const chartsGrid = document.createElement('div');
  chartsGrid.className = 'charts-grid';
  
  // Drop Level Distribution Chart
  const dropLevelChart = createDropLevelChart(items);
  if (dropLevelChart) {
    chartsGrid.appendChild(dropLevelChart);
  }
  
  // Drop Weight Distribution Chart
  const dropWeightChart = createDropWeightChart(items);
  if (dropWeightChart) {
    chartsGrid.appendChild(dropWeightChart);
  }
  
  container.appendChild(chartsGrid);
}

/**
 * Create drop level distribution chart
 * @param {Array} items - Array of items
 * @returns {HTMLElement|null} Chart container or null
 */
function createDropLevelChart(items) {
  const container = document.createElement('div');
  container.className = 'chart-container';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  // Group items by drop level
  const levelGroups = {};
  items.forEach(item => {
    const level = item.dropLevel || 0;
    levelGroups[level] = (levelGroups[level] || 0) + 1;
  });
  
  const levels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
  const counts = levels.map(level => levelGroups[level]);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: levels.map(l => `Level ${l}`),
      datasets: [{
        label: 'Items by Drop Level',
        data: counts,
        backgroundColor: 'rgba(175, 96, 37, 0.6)',
        borderColor: 'rgba(175, 96, 37, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Drop Level Distribution',
          color: '#d4d4d4'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#d4d4d4' },
          grid: { color: '#3a3a3a' }
        },
        x: {
          ticks: { color: '#d4d4d4' },
          grid: { color: '#3a3a3a' }
        }
      }
    }
  });
  
  return container;
}

/**
 * Create drop weight distribution chart
 * @param {Array} items - Array of items
 * @returns {HTMLElement|null} Chart container or null
 */
function createDropWeightChart(items) {
  const container = document.createElement('div');
  container.className = 'chart-container';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  // Extract drop weights
  const weights = items.map(item => item.dropWeight || 0).filter(w => w > 0);
  
  if (weights.length === 0) {
    return null;
  }
  
  // Create bins for histogram
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const binCount = 20;
  const binSize = (max - min) / binCount;
  
  const bins = new Array(binCount).fill(0);
  weights.forEach(weight => {
    const binIndex = Math.min(Math.floor((weight - min) / binSize), binCount - 1);
    bins[binIndex]++;
  });
  
  const binLabels = Array.from({ length: binCount }, (_, i) => {
    const binMin = min + i * binSize;
    const binMax = min + (i + 1) * binSize;
    return `${Math.round(binMin)}-${Math.round(binMax)}`;
  });
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{
        label: 'Items by Drop Weight',
        data: bins,
        backgroundColor: 'rgba(136, 136, 255, 0.6)',
        borderColor: 'rgba(136, 136, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Drop Weight Distribution',
          color: '#d4d4d4'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#d4d4d4' },
          grid: { color: '#3a3a3a' }
        },
        x: {
          ticks: { 
            color: '#d4d4d4',
            maxRotation: 45,
            minRotation: 45
          },
          grid: { color: '#3a3a3a' }
        }
      }
    }
  });
  
  return container;
}

