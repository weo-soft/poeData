/**
 * Weight display component - Display calculated item weights with visualization options
 */

import { createElement, clearElement } from '../utils/dom.js';
import { renderRankedBarChart, renderLogScaleBarChart, renderCDFCurve, renderHeatmap } from '../visualization/weightVisualizations.js';

// Module-level state for chart instance management
let currentChartInstance = null;
let currentWeights = null;
let currentItems = null;
let currentCategoryId = null;

/**
 * Render weight display in container with visualization switching
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} weights - { [itemId: string]: number } - Map of item IDs to weights
 * @param {string} categoryId - Category identifier
 * @param {Array<Object>} items - Item metadata array (optional, for names and icons)
 * @param {Object} options - Display options
 * @param {string} options.defaultView - Default visualization type ('table' | 'bar' | 'log' | 'cdf' | 'heatmap')
 */
export function renderWeightDisplay(container, weights, categoryId, items = [], options = {}) {
  clearElement(container);

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!weights || typeof weights !== 'object') {
    throw new Error('Weights must be an object');
  }

  // Destroy any existing chart instance
  if (currentChartInstance) {
    currentChartInstance.destroy();
    currentChartInstance = null;
  }

  const weightDisplay = createElement('div', { className: 'weight-display' });

  // Handle empty weights
  if (Object.keys(weights).length === 0) {
    const emptyState = createElement('div', {
      className: 'weight-display-empty',
      textContent: 'No weights calculated'
    });
    weightDisplay.appendChild(emptyState);
    container.appendChild(weightDisplay);
    return;
  }

  // Create header
  const header = createElement('div', { className: 'weight-display-header' });
  const title = createElement('h2', {
    textContent: 'Calculated Item Weights'
  });
  header.appendChild(title);

  // Create visualization tabs
  const tabsContainer = createVisualizationTabs(weights, items, categoryId, options.defaultView || 'table');
  header.appendChild(tabsContainer);
  weightDisplay.appendChild(header);

  // Create content area for visualizations
  const contentArea = createElement('div', { className: 'weight-visualization-content' });
  weightDisplay.appendChild(contentArea);

  // Store current data for tab switching
  currentWeights = weights;
  currentItems = items;
  currentCategoryId = categoryId;

  // Render default visualization
  const defaultView = options.defaultView || 'table';
  renderVisualization(contentArea, defaultView, weights, items, categoryId);

  container.appendChild(weightDisplay);
}

/**
 * Create visualization tabs container
 * @param {Object} weights - Weight data
 * @param {Array<Object>} items - Item metadata
 * @param {string} categoryId - Category identifier
 * @param {string} defaultView - Default visualization type
 * @returns {HTMLElement} Tabs container
 */
function createVisualizationTabs(weights, items, categoryId, defaultView) {
  const tabsContainer = createElement('div', { className: 'visualization-tabs' });
  
  const tabTypes = [
    { id: 'table', label: 'Table' },
    { id: 'bar', label: 'Bar Chart' },
    { id: 'log', label: 'Log Chart' },
    { id: 'cdf', label: 'CDF' },
    { id: 'heatmap', label: 'Heatmap' }
  ];

  tabTypes.forEach(tab => {
    const tabElement = createElement('button', {
      className: `visualization-tab ${tab.id === defaultView ? 'active' : ''}`,
      'data-view': tab.id,
      textContent: tab.label
    });
    
    tabElement.addEventListener('click', () => {
      handleTabClick(tab.id);
    });
    
    tabsContainer.appendChild(tabElement);
  });

  return tabsContainer;
}

/**
 * Handle tab click for visualization switching
 * @param {string} viewType - Visualization type to switch to
 */
function handleTabClick(viewType) {
  // Update active tab
  const tabs = document.querySelectorAll('.visualization-tab');
  tabs.forEach(tab => {
    if (tab.dataset.view === viewType) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Destroy previous chart instance
  if (currentChartInstance) {
    currentChartInstance.destroy();
    currentChartInstance = null;
  }

  // Render new visualization using stored data
  const contentArea = document.querySelector('.weight-visualization-content');
  if (contentArea && currentWeights) {
    renderVisualization(contentArea, viewType, currentWeights, currentItems, currentCategoryId);
  }
}

/**
 * Render visualization based on type
 * @param {HTMLElement} container - Container element
 * @param {string} viewType - Visualization type
 * @param {Object} weights - Weight data
 * @param {Array<Object>} items - Item metadata
 * @param {string} categoryId - Category identifier
 */
function renderVisualization(container, viewType, weights, items, categoryId) {
  clearElement(container);

  switch (viewType) {
    case 'table':
      renderTableView(container, weights, items);
      break;
    case 'bar': {
      currentChartInstance = renderRankedBarChart(container, weights, items);
      break;
    }
    case 'log': {
      currentChartInstance = renderLogScaleBarChart(container, weights, items);
      break;
    }
    case 'cdf': {
      currentChartInstance = renderCDFCurve(container, weights);
      break;
    }
    case 'heatmap': {
      renderHeatmap(container, weights, items);
      break;
    }
    default:
      renderTableView(container, weights, items);
  }
}

/**
 * Render table view (existing implementation)
 * @param {HTMLElement} container - Container element
 * @param {Object} weights - Weight data
 * @param {Array<Object>} items - Item metadata
 */
function renderTableView(container, weights, items) {
  // Convert weights to array and sort by weight (highest to lowest)
  const weightEntries = Object.entries(weights)
    .map(([itemId, weight]) => {
      // Find item metadata if available
      const item = items.find(i => i.id === itemId);
      return {
        itemId,
        weight,
        name: item?.name || itemId,
        icon: item?.icon
      };
    })
    .sort((a, b) => b.weight - a.weight); // Sort descending

  // Find maximum weight for visual bar scaling
  const maxWeight = weightEntries.length > 0 ? weightEntries[0].weight : 1;

  // Create weight table for better scanning and comparison
  const weightTable = createElement('table', { className: 'weight-table' });

  // Table header
  const thead = createElement('thead');
  const headerRow = createElement('tr');
  const rankHeader = createElement('th', { 
    className: 'weight-rank-header',
    textContent: 'Rank'
  });
  const nameHeader = createElement('th', { 
    className: 'weight-name-header',
    textContent: 'Item'
  });
  const weightHeader = createElement('th', { 
    className: 'weight-value-header',
    textContent: 'Weight'
  });
  const barHeader = createElement('th', { 
    className: 'weight-bar-header',
    textContent: 'Visual'
  });
  headerRow.appendChild(rankHeader);
  headerRow.appendChild(nameHeader);
  headerRow.appendChild(weightHeader);
  headerRow.appendChild(barHeader);
  thead.appendChild(headerRow);
  weightTable.appendChild(thead);

  // Table body
  const tbody = createElement('tbody');
  
  // Render each weight item as a table row
  weightEntries.forEach((entry, index) => {
    const row = createElement('tr', { 
      className: 'weight-item',
      'data-weight': entry.weight,
      'data-rank': index + 1
    });

    // Rank/position cell
    const rankCell = createElement('td', { className: 'weight-rank-cell' });
    const rank = createElement('span', {
      className: 'weight-rank',
      textContent: `${index + 1}`
    });
    rankCell.appendChild(rank);
    row.appendChild(rankCell);

    // Item name cell
    const nameCell = createElement('td', { className: 'weight-name-cell' });
    const nameContainer = createElement('div', { className: 'weight-item-name-container' });
    
    // Item icon (if available)
    if (entry.icon) {
      const icon = createElement('img', {
        className: 'weight-item-icon',
        src: entry.icon,
        alt: entry.name,
        style: 'width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;'
      });
      nameContainer.appendChild(icon);
    }
    
    const itemName = createElement('span', {
      className: 'weight-item-name',
      textContent: entry.name
    });
    nameContainer.appendChild(itemName);
    nameCell.appendChild(nameContainer);
    row.appendChild(nameCell);

    // Weight value cell (as percentage with consistent formatting)
    const valueCell = createElement('td', { className: 'weight-value-cell' });
    const weightValue = createElement('span', {
      className: 'weight-value weight-percentage',
      textContent: `${(entry.weight * 100).toFixed(2)}%`
    });
    valueCell.appendChild(weightValue);
    row.appendChild(valueCell);

    // Visual bar cell
    const barCell = createElement('td', { className: 'weight-bar-cell' });
    const barContainer = createElement('div', { 
      className: 'weight-bar-container',
      style: 'width: 100%; height: 20px; background-color: rgba(0, 0, 0, 0.1); border-radius: 4px; position: relative; overflow: hidden;'
    });
    const barFill = createElement('div', {
      className: 'weight-bar-fill',
      style: `width: ${(entry.weight / maxWeight) * 100}%; height: 100%; background: linear-gradient(90deg, #4a90e2 0%, #357abd 100%); transition: width 0.3s ease;`
    });
    barContainer.appendChild(barFill);
    barCell.appendChild(barContainer);
    row.appendChild(barCell);

    tbody.appendChild(row);
  });

  weightTable.appendChild(tbody);
  container.appendChild(weightTable);
}
