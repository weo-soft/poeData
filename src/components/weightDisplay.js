/**
 * Weight display component - Display calculated item weights with visualization options
 */

import { createElement, clearElement } from '../utils/dom.js';
import { renderRankedBarChart, renderLogScaleBarChart, renderCDFCurve, renderHeatmap } from '../visualization/weightVisualizations.js';
import { renderBayesianWeightDisplay, getCurrentBayesianResult } from './bayesianWeightDisplay.js';
import { displayError } from '../utils/errors.js';
import { inferWeights } from '../services/bayesianWeightCalculator.js';
import { computeStatistics } from '../utils/posteriorStats.js';
import { router } from '../services/router.js';
import { getMleCalculationUrl, getBayesianCalculationUrl } from '../utils/fileUrls.js';

// Module-level state for chart instance management
let currentChartInstance = null;
let currentWeights = null;
let currentItems = null;
let currentCategoryId = null;
let persistentButtonsContainer = null; // Store persistent buttons container
let persistentContentContainer = null; // Store persistent content container
let currentOptions = null; // Store current options for view switching
let renderDeterministicFn = null; // Store deterministic render function
let renderBayesianFn = null; // Store Bayesian render function
let renderComparisonFn = null; // Store comparison render function

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
  // Check if we need to preserve buttons container (for view switching)
  const isViewSwitch = persistentButtonsContainer && persistentButtonsContainer.parentNode === container;
  
  if (!isViewSwitch) {
    clearElement(container);
    persistentButtonsContainer = null;
    persistentContentContainer = null;
  }

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
  const titleContainer = createElement('div', { 
    className: 'weight-display-title-container',
    style: 'display: flex; justify-content: space-between; align-items: center; width: 100%;'
  });
  const title = createElement('h2', {
    textContent: 'Calculated Item Weights'
  });
  titleContainer.appendChild(title);
  
  // Add download links container
  const downloadLinksContainer = createElement('div', {
    style: 'display: flex; gap: 0.5rem; margin-left: 1rem;'
  });
  
  // MLE calculation link - uses static file URL (served from public or calculated on-demand)
  const mleUrl = getMleCalculationUrl(categoryId);
  const mleLink = createElement('a', {
    className: 'download-weights-link',
    href: mleUrl,
    download: 'mle.json',
    textContent: 'Download MLE',
    title: 'Download MLE calculation JSON file (from precalculated file or calculated on-demand)',
    style: 'padding: 0.5rem 1rem; background-color: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block;'
  });
  downloadLinksContainer.appendChild(mleLink);
  
  // Bayesian calculation link (if datasets are available) - uses static file URL
  if (options.datasets && options.datasets.length > 0) {
    const bayesianUrl = getBayesianCalculationUrl(categoryId);
    const bayesianLink = createElement('a', {
      className: 'download-weights-link',
      href: bayesianUrl,
      download: 'bayesian.json',
      textContent: 'Download Bayesian',
      title: 'Download Bayesian calculation JSON file (from precalculated file or calculated on-demand)',
      style: 'padding: 0.5rem 1rem; background-color: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block;'
    });
    downloadLinksContainer.appendChild(bayesianLink);
  }
  
  titleContainer.appendChild(downloadLinksContainer);
  
  // Add "View Datasets" button if onOpenDatasets callback is provided
  if (options.onOpenDatasets) {
    const datasetsBtn = createElement('button', {
      className: 'view-datasets-btn',
      textContent: 'View Datasets',
      title: 'Open datasets list',
      style: 'padding: 0.5rem 1rem; background-color: #af6025; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; margin-left: 0.5rem;'
    });
    
    datasetsBtn.addEventListener('click', () => {
      options.onOpenDatasets();
    });
    
    titleContainer.appendChild(datasetsBtn);
  }
  
  header.appendChild(titleContainer);

  // Create or reuse persistent buttons container
  let toggleContainer = null;
  let deterministicBtn = null;
  let bayesianBtn = null;
  let comparisonBtn = null;
  
  // Add method toggle buttons if datasets are provided (for Bayesian comparison)
  if (options.datasets && options.datasets.length > 0) {
    if (persistentButtonsContainer && isViewSwitch) {
      // Reuse existing buttons container
      toggleContainer = persistentButtonsContainer;
      deterministicBtn = toggleContainer.querySelector('[data-method="deterministic"]');
      bayesianBtn = toggleContainer.querySelector('[data-method="bayesian"]');
      comparisonBtn = toggleContainer.querySelector('[data-method="comparison"]');
    } else {
      // Create new buttons container
      toggleContainer = createElement('div', { className: 'weight-method-toggle' });
      deterministicBtn = createElement('button', {
        className: 'method-toggle-btn active',
        'data-method': 'deterministic',
        textContent: 'Deterministic (MLE)'
      });
      bayesianBtn = createElement('button', {
        className: 'method-toggle-btn',
        'data-method': 'bayesian',
        textContent: 'Bayesian (MCMC)'
      });
      comparisonBtn = createElement('button', {
        className: 'method-toggle-btn',
        'data-method': 'comparison',
        textContent: 'Comparison'
      });

      toggleContainer.appendChild(deterministicBtn);
      toggleContainer.appendChild(bayesianBtn);
      toggleContainer.appendChild(comparisonBtn);
      
      // Store reference to persistent buttons container
      persistentButtonsContainer = toggleContainer;
    }

    const updateActiveButton = (activeMethod) => {
      [deterministicBtn, bayesianBtn, comparisonBtn].forEach(btn => {
        if (btn && btn.dataset.method === activeMethod) {
          btn.classList.add('active');
        } else if (btn) {
          btn.classList.remove('active');
        }
      });
    };

    // Store current options for view switching
    currentOptions = { ...options, weights, categoryId, items };
    
    // Define content rendering functions (store in module-level state)
    renderDeterministicFn = () => {
      if (!persistentContentContainer) return;
      clearElement(persistentContentContainer);
      
      // Create visualization tabs
      const tabsContainer = createVisualizationTabs(weights, items, categoryId, options.defaultView || 'table');
      const contentWrapper = createElement('div');
      contentWrapper.appendChild(tabsContainer);
      
      // Create content area for visualizations
      const contentArea = createElement('div', { className: 'weight-visualization-content' });
      contentWrapper.appendChild(contentArea);
      
      persistentContentContainer.appendChild(contentWrapper);
      
      // Store current data for tab switching
      currentWeights = weights;
      currentItems = items;
      currentCategoryId = categoryId;
      
      // Render default visualization
      const defaultView = options.defaultView || 'table';
      renderVisualization(contentArea, defaultView, weights, items, categoryId);
    };
    
    renderBayesianFn = async () => {
      if (!persistentContentContainer) return;
      clearElement(persistentContentContainer);
      
      // Add a small title for context when buttons are persistent
      const titleDiv = createElement('div', { 
        className: 'bayesian-view-title',
        style: 'margin-bottom: 1rem;'
      });
      const title = createElement('h3', {
        textContent: 'Bayesian Weight Estimates'
      });
      const subtitle = createElement('p', {
        className: 'bayesian-label',
        style: 'margin-top: 0.5rem; color: #888;',
        textContent: 'MCMC-derived estimates with uncertainty quantification (client-side computation)'
      });
      titleDiv.appendChild(title);
      titleDiv.appendChild(subtitle);
      persistentContentContainer.appendChild(titleDiv);
      
      try {
        await renderBayesianWeightDisplay(persistentContentContainer, options.datasets, categoryId, items, {
          ...options,
          indexData: options.indexData,
          normalizedDatasets: options.normalizedDatasets,
          deterministicWeights: weights,
          skipHeader: true // Skip header since buttons are persistent
        });
      } catch (error) {
        displayError(persistentContentContainer, `Failed to load Bayesian estimates: ${error.message}`);
      }
    };
    
    renderComparisonFn = async () => {
      if (!persistentContentContainer) return;
      clearElement(persistentContentContainer);
      
      // Add a small title for context when buttons are persistent
      const titleDiv = createElement('div', { 
        className: 'comparison-view-title',
        style: 'margin-bottom: 1rem;'
      });
      const title = createElement('h3', {
        textContent: 'Weight Calculation Comparison'
      });
      const subtitle = createElement('p', {
        className: 'comparison-subtitle',
        style: 'margin-top: 0.5rem; color: #888;',
        textContent: 'Comparing Deterministic (MLE) vs Bayesian (MCMC) estimates'
      });
      titleDiv.appendChild(title);
      titleDiv.appendChild(subtitle);
      persistentContentContainer.appendChild(titleDiv);
      
      try {
        await renderComparisonView(persistentContentContainer, weights, options.datasets, categoryId, items, {
          ...options,
          skipHeader: true // Skip header since buttons are persistent
        });
      } catch (error) {
        displayError(persistentContentContainer, `Failed to load comparison view: ${error.message}`);
      }
    };
    
    // Attach event listeners only if buttons are new (not reusing)
    if (!isViewSwitch) {
      deterministicBtn.addEventListener('click', () => {
        updateActiveButton('deterministic');
        if (renderDeterministicFn) renderDeterministicFn();
      });

      bayesianBtn.addEventListener('click', async () => {
        updateActiveButton('bayesian');
        if (renderBayesianFn) await renderBayesianFn();
      });

      comparisonBtn.addEventListener('click', async () => {
        updateActiveButton('comparison');
        if (renderComparisonFn) await renderComparisonFn();
      });
    }

    header.appendChild(toggleContainer);
  }

  // Create content container (persistent or new)
  if (!persistentContentContainer || !isViewSwitch) {
    persistentContentContainer = createElement('div', { className: 'weight-method-content' });
  } else {
    clearElement(persistentContentContainer);
  }

  // Create visualization tabs for deterministic view
  const tabsContainer = createVisualizationTabs(weights, items, categoryId, options.defaultView || 'table');
  const contentWrapper = createElement('div');
  contentWrapper.appendChild(tabsContainer);

  // Create content area for visualizations
  const contentArea = createElement('div', { className: 'weight-visualization-content' });
  contentWrapper.appendChild(contentArea);
  
  persistentContentContainer.appendChild(contentWrapper);

  // Store current data for tab switching
  currentWeights = weights;
  currentItems = items;
  currentCategoryId = categoryId;

  // Render default visualization
  const defaultView = options.defaultView || 'table';
  renderVisualization(contentArea, defaultView, weights, items, categoryId);

  weightDisplay.appendChild(header);
  weightDisplay.appendChild(persistentContentContainer);
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
      renderTableView(container, weights, items, categoryId);
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
      renderTableView(container, weights, items, categoryId);
  }
}

/**
 * Map dataset item ID to category item ID
 * For categories like breach-splinters, dataset IDs are short (e.g., "xoph")
 * but category item IDs are full (e.g., "splinter-of-xoph")
 * @param {string} datasetItemId - Item ID from dataset
 * @param {Array<Object>} categoryItems - Category items array
 * @returns {string|null} Category item ID or null if not found
 */
function mapDatasetIdToCategoryId(datasetItemId, categoryItems) {
  // First try exact match
  const exactMatch = categoryItems.find(i => i.id === datasetItemId);
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // Try to find category item whose ID contains the dataset ID
  // This handles cases like "xoph" -> "splinter-of-xoph"
  // Use word boundary matching to avoid false positives (e.g., "xoph" shouldn't match "xoph-something")
  const datasetIdLower = datasetItemId.toLowerCase();
  const partialMatch = categoryItems.find(item => {
    const categoryId = item.id.toLowerCase();
    // Check if category ID contains dataset ID as a whole word or at the end
    // Examples: "splinter-of-xoph" contains "xoph", "splinter-of-esh" contains "esh"
    return categoryId.includes(datasetIdLower) && 
           (categoryId.endsWith(datasetIdLower) || 
            categoryId.includes(`-${datasetIdLower}`) ||
            categoryId.includes(`-of-${datasetIdLower}`));
  });
  
  if (partialMatch) {
    return partialMatch.id;
  }
  
  // Try matching by name (case-insensitive)
  const nameMatch = categoryItems.find(item => {
    const itemName = (item.name || '').toLowerCase();
    return itemName.includes(datasetIdLower);
  });
  
  if (nameMatch) {
    return nameMatch.id;
  }
  
  // If no match found, return the original dataset ID
  return datasetItemId;
}

/**
 * Render table view (existing implementation)
 * @param {HTMLElement} container - Container element
 * @param {Object} weights - Weight data
 * @param {Array<Object>} items - Item metadata
 * @param {string} categoryId - Category identifier
 */
function renderTableView(container, weights, items, categoryId) {
  // Convert weights to array and sort by weight (highest to lowest)
  const weightEntries = Object.entries(weights)
    .map(([itemId, weight]) => {
      // Map dataset item ID to category item ID
      const categoryItemId = mapDatasetIdToCategoryId(itemId, items);
      
      // Find item metadata using the mapped category item ID
      const item = items.find(i => i.id === categoryItemId);
      return {
        itemId: categoryItemId, // Use category item ID for navigation
        datasetItemId: itemId, // Keep original for reference
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
      className: 'weight-item clickable-row',
      'data-weight': entry.weight,
      'data-rank': index + 1,
      'data-item-id': entry.itemId
    });
    
    // Add click handler to navigate to item detail
    if (categoryId) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        router.navigate(`/category/${categoryId}/item/${entry.itemId}`);
      });
    }

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

/**
 * Render comparison view showing both deterministic and Bayesian results side-by-side
 * @param {HTMLElement} container - Container element
 * @param {Object} deterministicWeights - Deterministic weights { [itemId: string]: number }
 * @param {Array<Object>} datasets - Dataset objects for Bayesian calculation
 * @param {string} categoryId - Category identifier
 * @param {Array<Object>} items - Item metadata
 * @param {Object} options - Display options
 */
async function renderComparisonView(container, deterministicWeights, datasets, categoryId, items, options) {
  clearElement(container);

  const comparisonDiv = createElement('div', { className: 'weight-comparison-view' });

  // Only create header if skipHeader is not set (for persistent button mode)
  let header = null;
  if (!options.skipHeader) {
    // Header
    header = createElement('div', { className: 'comparison-header' });
    
    // Add back button to return to deterministic view
    const backButton = createElement('button', {
      className: 'back-to-weights-btn',
      textContent: '← Back to Calculated Item Weights'
    });
    backButton.addEventListener('click', () => {
      // Restore deterministic view with method toggle buttons
      renderWeightDisplay(container, deterministicWeights, categoryId, items, {
        ...options,
        datasets: datasets,
        method: 'deterministic'
      });
    });
    header.appendChild(backButton);
    
    const title = createElement('h2', {
      textContent: 'Weight Calculation Comparison'
    });
    header.appendChild(title);
    const subtitle = createElement('p', {
      className: 'comparison-subtitle',
      textContent: 'Comparing Deterministic (MLE) vs Bayesian (MCMC) estimates'
    });
    header.appendChild(subtitle);
    comparisonDiv.appendChild(header);
  }

  // Show loading state
  const loadingDiv = createElement('div', {
    className: 'loading comparison-loading',
    textContent: 'Loading Bayesian estimates for comparison...'
  });
  comparisonDiv.appendChild(loadingDiv);
  container.appendChild(comparisonDiv);

  try {
    // Get Bayesian results (use cached if available, otherwise compute)
    let bayesianResult = getCurrentBayesianResult();
    
    // If no cached result and we have indexData, try to get from cache
    if (!bayesianResult && options.indexData && options.normalizedDatasets) {
      const { getCachedWeights } = await import('../services/weightCache.js');
      const cachedData = await getCachedWeights(
        categoryId,
        options.normalizedDatasets,
        'bayesian',
        options.indexData
      );
      
      if (cachedData) {
        // Check if we have full result with posterior samples
        if (cachedData.posteriorSamples && Object.keys(cachedData.posteriorSamples).length > 0) {
          // Full result available
          bayesianResult = {
            posteriorSamples: cachedData.posteriorSamples,
            summaryStatistics: cachedData.summaryStatistics,
            convergenceDiagnostics: cachedData.convergenceDiagnostics,
            modelAssumptions: cachedData.modelAssumptions
          };
        } else {
          // Legacy cache format - reconstruct summaryStatistics
          const summaryStatistics = {};
          for (const [itemId, median] of Object.entries(cachedData)) {
            summaryStatistics[itemId] = {
              median: median,
              map: median,
              credibleInterval: { lower: median * 0.9, upper: median * 1.1 }
            };
          }
          bayesianResult = { summaryStatistics };
        }
      }
    }
    
    if (!bayesianResult) {
      // Execute JAGS inference
      const result = await inferWeights(datasets, options.jagsOptions || {});
      
      // Compute summary statistics if not already computed
      let summaryStatistics = result.summaryStatistics;
      if (!summaryStatistics || Object.keys(summaryStatistics).length === 0) {
        summaryStatistics = computeStatistics(result.posteriorSamples);
      }

      bayesianResult = {
        ...result,
        summaryStatistics
      };
      
      // Cache the full Bayesian result (including posterior samples)
      if (options.indexData && options.normalizedDatasets && bayesianResult) {
        const { setCachedWeights } = await import('../services/weightCache.js');
        // Store full result including posterior samples
        await setCachedWeights(
          categoryId,
          options.normalizedDatasets,
          'bayesian',
          bayesianResult, // Store full result object
          options.indexData
        );
      }
    }

    clearElement(comparisonDiv);
    if (!options.skipHeader) {
      comparisonDiv.appendChild(header);
    }

    // Create comparison table
    renderComparisonTable(comparisonDiv, deterministicWeights, bayesianResult, items, categoryId);

  } catch (error) {
    clearElement(comparisonDiv);
    if (!options.skipHeader) {
      comparisonDiv.appendChild(header);
    }
    displayError(comparisonDiv, `Failed to load comparison: ${error.message}`);
  }
}

/**
 * Render comparison table showing both methods side-by-side
 * @param {HTMLElement} container - Container element
 * @param {Object} deterministicWeights - Deterministic weights
 * @param {Object} bayesianResult - Bayesian result with summary statistics
 * @param {Array<Object>} items - Item metadata
 * @param {string} categoryId - Category identifier
 */
function renderComparisonTable(container, deterministicWeights, bayesianResult, items, categoryId) {
  const { summaryStatistics } = bayesianResult;

  if (!summaryStatistics || Object.keys(summaryStatistics).length === 0) {
    const emptyState = createElement('div', {
      className: 'comparison-empty',
      textContent: 'No Bayesian summary statistics available for comparison'
    });
    container.appendChild(emptyState);
    return;
  }

  // Create comparison table
  const comparisonTable = createElement('table', { className: 'weight-comparison-table' });

  // Table header
  const thead = createElement('thead');
  const headerRow = createElement('tr');
  const headers = [
    'Item',
    'Deterministic (MLE)',
    'Bayesian Median',
    'Bayesian MAP',
    '95% Credible Interval',
    'Difference'
  ];

  headers.forEach(headerText => {
    const th = createElement('th', {
      className: 'comparison-header',
      textContent: headerText
    });
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  comparisonTable.appendChild(thead);

  // Table body
  const tbody = createElement('tbody');

  // Get all unique item IDs from both methods
  const allItemIds = new Set([
    ...Object.keys(deterministicWeights),
    ...Object.keys(summaryStatistics)
  ]);

  // Convert to array and sort by deterministic weight (or Bayesian median if deterministic not available)
  const entries = Array.from(allItemIds)
    .map(itemId => {
      // Map dataset item ID to category item ID
      const categoryItemId = mapDatasetIdToCategoryId(itemId, items);
      
      // Find item metadata using the mapped category item ID
      const item = items.find(i => i.id === categoryItemId);
      
      // Use mapped IDs for looking up weights
      const deterministic = deterministicWeights[itemId] || null;
      const bayesian = summaryStatistics[itemId] || null;

      return {
        itemId: categoryItemId, // Use category item ID for navigation
        datasetItemId: itemId, // Keep original for reference
        name: item?.name || itemId,
        icon: item?.icon,
        deterministic,
        bayesian,
        // Calculate difference (Bayesian median - deterministic)
        difference: (bayesian && deterministic !== null) 
          ? bayesian.median - deterministic 
          : null
      };
    })
    .sort((a, b) => {
      // Sort by deterministic weight (descending), or Bayesian median if deterministic not available
      const aWeight = a.deterministic !== null ? a.deterministic : (a.bayesian ? a.bayesian.median : 0);
      const bWeight = b.deterministic !== null ? b.deterministic : (b.bayesian ? b.bayesian.median : 0);
      return bWeight - aWeight;
    });

  entries.forEach(entry => {
    const row = createElement('tr', {
      className: 'comparison-row clickable-row',
      'data-item-id': entry.itemId
    });
    
    // Add click handler to navigate to item detail
    if (categoryId) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        router.navigate(`/category/${categoryId}/item/${entry.itemId}`);
      });
    }

    // Item name
    const nameCell = createElement('td', { className: 'comparison-item-name' });
    const nameContainer = createElement('div', { className: 'comparison-item-name-container' });
    
    if (entry.icon) {
      const icon = createElement('img', {
        className: 'comparison-item-icon',
        src: entry.icon,
        alt: entry.name,
        style: 'width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;'
      });
      nameContainer.appendChild(icon);
    }
    
    const nameSpan = createElement('span', {
      className: 'comparison-item-name-text',
      textContent: entry.name
    });
    nameContainer.appendChild(nameSpan);
    nameCell.appendChild(nameContainer);
    row.appendChild(nameCell);

    // Deterministic weight
    const deterministicCell = createElement('td', { className: 'comparison-deterministic' });
    if (entry.deterministic !== null) {
      deterministicCell.textContent = `${(entry.deterministic * 100).toFixed(2)}%`;
    } else {
      deterministicCell.textContent = '—';
      deterministicCell.style.color = '#888';
    }
    row.appendChild(deterministicCell);

    // Bayesian median
    const medianCell = createElement('td', { className: 'comparison-bayesian-median' });
    if (entry.bayesian) {
      medianCell.textContent = `${(entry.bayesian.median * 100).toFixed(2)}%`;
    } else {
      medianCell.textContent = '—';
      medianCell.style.color = '#888';
    }
    row.appendChild(medianCell);

    // Bayesian MAP
    const mapCell = createElement('td', { className: 'comparison-bayesian-map' });
    if (entry.bayesian) {
      mapCell.textContent = `${(entry.bayesian.map * 100).toFixed(2)}%`;
    } else {
      mapCell.textContent = '—';
      mapCell.style.color = '#888';
    }
    row.appendChild(mapCell);

    // Credible interval
    const intervalCell = createElement('td', { className: 'comparison-bayesian-interval' });
    if (entry.bayesian) {
      const interval = entry.bayesian.credibleInterval;
      intervalCell.textContent = `[${(interval.lower * 100).toFixed(2)}%, ${(interval.upper * 100).toFixed(2)}%]`;
    } else {
      intervalCell.textContent = '—';
      intervalCell.style.color = '#888';
    }
    row.appendChild(intervalCell);

    // Difference (Bayesian median - deterministic)
    const differenceCell = createElement('td', { className: 'comparison-difference' });
    if (entry.difference !== null) {
      const diffPercent = entry.difference * 100;
      const diffText = diffPercent >= 0 
        ? `+${diffPercent.toFixed(2)}%` 
        : `${diffPercent.toFixed(2)}%`;
      differenceCell.textContent = diffText;
      
      // Color code: green for small differences, yellow for medium, red for large
      const absDiff = Math.abs(diffPercent);
      if (absDiff < 1) {
        differenceCell.style.color = '#4caf50'; // Green
      } else if (absDiff < 5) {
        differenceCell.style.color = '#ff9800'; // Orange
      } else {
        differenceCell.style.color = '#f44336'; // Red
      }
    } else {
      differenceCell.textContent = '—';
      differenceCell.style.color = '#888';
    }
    row.appendChild(differenceCell);

    tbody.appendChild(row);
  });

  comparisonTable.appendChild(tbody);
  container.appendChild(comparisonTable);
}
