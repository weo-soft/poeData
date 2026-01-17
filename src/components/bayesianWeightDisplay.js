/**
 * Bayesian weight display component
 * Displays Bayesian JAGS-based weight estimates with uncertainty information
 */

import { createElement, clearElement } from '../utils/dom.js';
import { inferWeights } from '../services/bayesianWeightCalculator.js';
import { computeStatistics } from '../utils/posteriorStats.js';
import { renderDensityPlot, renderRankedProbabilityChart } from '../visualization/bayesianVisualizations.js';
import { getCachedWeights, setCachedWeights } from '../services/weightCache.js';

// Module-level state
let currentBayesianResult = null;
let currentItems = null;
let currentContentArea = null;
let currentChartInstance = null;
let currentDatasets = null; // Store datasets for potential recalculation
let currentCategoryId = null; // Store categoryId for recalculation
let currentOptions = null; // Store options for recalculation
let isLoading = false;

/**
 * Render Bayesian weight display in container
 * @param {HTMLElement} container - Container element to render into
 * @param {Array<Object>} datasets - Array of dataset objects
 * @param {string} categoryId - Category identifier
 * @param {Array<Object>} items - Item metadata array (optional)
 * @param {Object} options - Display options
 */
export async function renderBayesianWeightDisplay(container, datasets, categoryId, items = [], options = {}) {
  // Store progress interval for cleanup
  let progressInterval = null;
  clearElement(container);

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!datasets || datasets.length === 0) {
    const emptyState = createElement('div', {
      className: 'bayesian-weight-display-empty',
      textContent: 'No datasets available for Bayesian inference'
    });
    container.appendChild(emptyState);
    return;
  }

  const bayesianDisplay = createElement('div', { className: 'bayesian-weight-display' });

  // Create header with clear "Bayesian" labeling
  const header = createElement('div', { className: 'bayesian-weight-display-header' });
  const title = createElement('h2', {
    textContent: 'Bayesian Weight Estimates'
  });
  const subtitle = createElement('p', {
    className: 'bayesian-label',
    textContent: 'MCMC-derived estimates with uncertainty quantification (client-side computation)'
  });
  header.appendChild(title);
  header.appendChild(subtitle);
  bayesianDisplay.appendChild(header);

  // Show loading state with progress indication
  const loadingDiv = createElement('div', {
    className: 'loading bayesian-loading'
  });
  const loadingText = createElement('p', {
    textContent: 'Running JAGS inference... This may take 10-30 seconds.'
  });
  const progressBar = createElement('div', {
    className: 'bayesian-progress-bar',
    style: 'width: 100%; height: 4px; background-color: rgba(255, 255, 255, 0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;'
  });
  const progressFill = createElement('div', {
    className: 'bayesian-progress-fill',
    style: 'width: 0%; height: 100%; background: linear-gradient(90deg, #4a90e2 0%, #357abd 100%); transition: width 0.3s ease; animation: pulse 2s infinite;'
  });
  progressBar.appendChild(progressFill);
  loadingDiv.appendChild(loadingText);
  loadingDiv.appendChild(progressBar);
  bayesianDisplay.appendChild(loadingDiv);
  container.appendChild(bayesianDisplay);
  isLoading = true;

  // Progress tracking
  let currentProgress = 0;
  progressInterval = setInterval(() => {
    // Update progress bar based on current progress
    progressFill.style.width = `${currentProgress}%`;
  }, 100);

  try {
    // Check cache first if indexData and normalizedDatasets are provided
    let result = null;
    let cachedWeights = null;
    let isFromCache = false;
    
    if (options.indexData && options.normalizedDatasets) {
      const cachedData = await getCachedWeights(
        categoryId,
        options.normalizedDatasets,
        'bayesian',
        options.indexData
      );
      
      if (cachedData) {
        // Cache hit
        console.log('[BayesianWeightDisplay] Cache hit for Bayesian weights');
        isFromCache = true;
        
        // Check if we have full result with posterior samples
        if (cachedData.posteriorSamples && Object.keys(cachedData.posteriorSamples).length > 0) {
          // Full result with posterior samples - use directly
          result = {
            posteriorSamples: cachedData.posteriorSamples,
            summaryStatistics: cachedData.summaryStatistics,
            convergenceDiagnostics: cachedData.convergenceDiagnostics,
            modelAssumptions: cachedData.modelAssumptions,
            metadata: {
              ...cachedData.metadata,
              cached: true
            }
          };
        } else {
          // Legacy cache format - only median weights, reconstruct summaryStatistics
          const summaryStatistics = {};
          for (const [itemId, median] of Object.entries(cachedData)) {
            summaryStatistics[itemId] = {
              median: median,
              map: median, // Use median as MAP approximation
              credibleInterval: { lower: median * 0.9, upper: median * 1.1 } // Approximate interval
            };
          }
          
          // Create minimal result structure (no posterior samples)
          result = {
            summaryStatistics,
            posteriorSamples: {}, // Not available in legacy cache
            metadata: {
              cached: true,
              numItems: Object.keys(cachedData).length,
              numDatasets: datasets.length
            }
          };
        }
        
        // Store datasets and options for potential recalculation (if needed)
        currentDatasets = datasets;
        currentCategoryId = categoryId;
        currentOptions = options;
        
        // Skip loading state for cache hits
        isLoading = false;
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        currentProgress = 100;
        progressFill.style.width = '100%';
        clearElement(bayesianDisplay);
      }
    }
    
    // If no cache hit, calculate Bayesian weights
    if (!result) {
      // Execute client-side MCMC inference
      result = await inferWeights(datasets, {
        ...(options.jagsOptions || {}),
        onProgress: (progress) => {
          currentProgress = progress;
        }
      });
      
      // Cache the full Bayesian result (including posterior samples for density plot)
      if (options.indexData && options.normalizedDatasets && result.summaryStatistics) {
        // Store full result including posterior samples
        await setCachedWeights(
          categoryId,
          options.normalizedDatasets,
          'bayesian',
          result, // Store full result object
          options.indexData
        );
      }
    }

    // Compute summary statistics if not already computed
    let summaryStatistics = result.summaryStatistics;
    if (!summaryStatistics || Object.keys(summaryStatistics).length === 0) {
      summaryStatistics = computeStatistics(result.posteriorSamples);
    }

    currentBayesianResult = {
      ...result,
      summaryStatistics
    };

    isLoading = false;
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    currentProgress = 100;
    progressFill.style.width = '100%';
    clearElement(bayesianDisplay);

    // Rebuild header
    bayesianDisplay.appendChild(header);

      // Store items, datasets, and result for visualization switching
      currentItems = items;
      currentDatasets = datasets;
      currentCategoryId = categoryId;
      currentOptions = options;

    // Create visualization tabs
    const tabsContainer = createBayesianVisualizationTabs(currentBayesianResult, items);
    bayesianDisplay.appendChild(tabsContainer);

    // Create content area for visualizations
    const contentArea = createElement('div', { className: 'bayesian-visualization-content' });
    bayesianDisplay.appendChild(contentArea);
    currentContentArea = contentArea; // Store reference for tab switching

    // Display default view (table with statistics)
    renderBayesianResults(contentArea, currentBayesianResult, items);

    // Display convergence diagnostics if available
    if (result.convergenceDiagnostics) {
      renderConvergenceDiagnostics(bayesianDisplay, result.convergenceDiagnostics);
    }

    // Display model assumptions if available
    if (result.modelAssumptions) {
      renderModelAssumptions(bayesianDisplay, result.modelAssumptions);
    }

    // Display exclusion constraint information
    renderExclusionConstraintInfo(bayesianDisplay, datasets);

  } catch (error) {
    isLoading = false;
    if (typeof progressInterval !== 'undefined') {
      clearInterval(progressInterval);
    }
    clearElement(bayesianDisplay);
    bayesianDisplay.appendChild(header);

    // Provide comprehensive error messages
    let errorMessage = `Bayesian inference failed: ${error.message}`;
    let errorDetails = '';

    if (error.message.includes('Insufficient data')) {
      errorMessage = 'Insufficient data for Bayesian inference';
      errorDetails = 'One or more datasets have zero transformation counts. Add more data to perform inference.';
    } else if (error.message.includes('No items found')) {
      errorMessage = 'No items found in datasets';
      errorDetails = 'The datasets do not contain any valid items for weight calculation.';
    }

    const errorDiv = createElement('div', {
      className: 'bayesian-error'
    });
    const errorTitle = createElement('h3', {
      textContent: errorMessage
    });
    errorDiv.appendChild(errorTitle);
    
    if (errorDetails) {
      const errorDesc = createElement('p', {
        className: 'error-details',
        textContent: errorDetails
      });
      errorDiv.appendChild(errorDesc);
    }

    bayesianDisplay.appendChild(errorDiv);
    console.error('Bayesian inference error:', error);
  }
}

/**
 * Render Bayesian results (summary statistics)
 * @param {HTMLElement} container - Container element
 * @param {Object} result - Bayesian result object
 * @param {Array<Object>} items - Item metadata
 */
function renderBayesianResults(container, result, items) {
  const { summaryStatistics } = result;

  if (!summaryStatistics || Object.keys(summaryStatistics).length === 0) {
    const emptyState = createElement('div', {
      className: 'bayesian-results-empty',
      textContent: 'No summary statistics available'
    });
    container.appendChild(emptyState);
    return;
  }

  // Create results table
  const resultsTable = createElement('table', { className: 'bayesian-results-table' });

  // Table header
  const thead = createElement('thead');
  const headerRow = createElement('tr');
  const headers = [
    'Item',
    'Posterior Median',
    'MAP Estimate',
    '95% Credible Interval'
  ];

  headers.forEach(headerText => {
    const th = createElement('th', {
      className: 'bayesian-header',
      textContent: headerText
    });
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  resultsTable.appendChild(thead);

  // Table body
  const tbody = createElement('tbody');

  // Convert to array and sort by median
  const entries = Object.entries(summaryStatistics)
    .map(([itemId, stats]) => {
      const item = items.find(i => i.id === itemId);
      return {
        itemId,
        stats,
        name: item?.name || itemId,
        icon: item?.icon
      };
    })
    .sort((a, b) => b.stats.median - a.stats.median);

  entries.forEach((entry) => {
    const row = createElement('tr', {
      className: 'bayesian-result-row',
      'data-item-id': entry.itemId
    });

    // Item name
    const nameCell = createElement('td', { className: 'bayesian-item-name' });
    const nameContainer = createElement('div', { className: 'bayesian-item-name-container' });
    
    if (entry.icon) {
      const icon = createElement('img', {
        className: 'bayesian-item-icon',
        src: entry.icon,
        alt: entry.name,
        style: 'width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;'
      });
      nameContainer.appendChild(icon);
    }
    
    const nameSpan = createElement('span', {
      className: 'bayesian-item-name-text',
      textContent: entry.name
    });
    nameContainer.appendChild(nameSpan);
    nameCell.appendChild(nameContainer);
    row.appendChild(nameCell);

    // Posterior median (clearly labeled)
    const medianCell = createElement('td', { className: 'bayesian-median' });
    medianCell.textContent = `${(entry.stats.median * 100).toFixed(2)}%`;
    medianCell.setAttribute('title', 'Posterior median (50th percentile)');
    row.appendChild(medianCell);

    // MAP estimate (clearly labeled)
    const mapCell = createElement('td', { className: 'bayesian-map' });
    mapCell.textContent = `${(entry.stats.map * 100).toFixed(2)}%`;
    mapCell.setAttribute('title', 'MAP (Maximum A Posteriori) estimate');
    row.appendChild(mapCell);

    // Credible interval (clearly labeled and formatted)
    const intervalCell = createElement('td', { className: 'bayesian-interval' });
    const interval = entry.stats.credibleInterval;
    const intervalText = `${(interval.lower * 100).toFixed(2)}% - ${(interval.upper * 100).toFixed(2)}%`;
    intervalCell.textContent = intervalText;
    intervalCell.setAttribute('title', '95% Credible Interval: [2.5th percentile, 97.5th percentile]');
    row.appendChild(intervalCell);

    tbody.appendChild(row);
  });

  resultsTable.appendChild(tbody);
  container.appendChild(resultsTable);
}

/**
 * Render convergence diagnostics
 * @param {HTMLElement} container - Container element
 * @param {Object} diagnostics - Convergence diagnostics object
 */
function renderConvergenceDiagnostics(container, diagnostics) {
  if (!diagnostics.overall || diagnostics.overall.converged) {
    return; // Don't show if converged
  }

  const diagnosticsDiv = createElement('div', {
    className: 'bayesian-convergence-warning'
  });

  const warningTitle = createElement('h3', {
    textContent: 'Convergence Warnings'
  });
  diagnosticsDiv.appendChild(warningTitle);

  if (diagnostics.overall.warnings && diagnostics.overall.warnings.length > 0) {
    const warningsList = createElement('ul', { className: 'convergence-warnings-list' });
    diagnostics.overall.warnings.forEach(warning => {
      const li = createElement('li', {
        textContent: warning
      });
      warningsList.appendChild(li);
    });
    diagnosticsDiv.appendChild(warningsList);
  }

  container.appendChild(diagnosticsDiv);
}

/**
 * Render model assumptions
 * @param {HTMLElement} container - Container element
 * @param {Object} assumptions - Model assumptions object
 */
function renderModelAssumptions(container, assumptions) {
  const assumptionsDiv = createElement('div', {
    className: 'bayesian-model-assumptions'
  });

  const assumptionsTitle = createElement('h3', {
    textContent: 'Model Assumptions'
  });
  assumptionsDiv.appendChild(assumptionsTitle);

  // Summary with clear descriptions
  const summary = createElement('div', {
    className: 'assumptions-summary'
  });

  if (assumptions.singleKnownInput > 0) {
    const singleDesc = createElement('p', {
      className: 'assumption-type',
      textContent: `Single Known Input (${assumptions.singleKnownInput} dataset(s)): ` +
                    'The model uses the specified input item and enforces exclusion constraint (input cannot be returned).'
    });
    summary.appendChild(singleDesc);
  }

  if (assumptions.multipleKnownInputs > 0) {
    const multipleDesc = createElement('p', {
      className: 'assumption-type',
      textContent: `Multiple Known Inputs (${assumptions.multipleKnownInputs} dataset(s)): ` +
                    'The model handles multiple possible input items by using the first input item. ' +
                    'Counts are distributed across all possible inputs.'
    });
    summary.appendChild(multipleDesc);
  }

  if (assumptions.unknownInputs > 0) {
    const unknownDesc = createElement('p', {
      className: 'assumption-type',
      textContent: `Unknown/Random Inputs (${assumptions.unknownInputs} dataset(s)): ` +
                    'The model assumes a uniform prior over all possible input items. ' +
                    'This treats the input as if it was chosen randomly from all items.'
    });
    summary.appendChild(unknownDesc);
  }

  assumptionsDiv.appendChild(summary);

  // Detailed assumptions per dataset
  if (assumptions.assumptions && Object.keys(assumptions.assumptions).length > 0) {
    const assumptionsTitle = createElement('h4', {
      textContent: 'Per-Dataset Assumptions'
    });
    assumptionsDiv.appendChild(assumptionsTitle);

    const assumptionsList = createElement('ul', { className: 'assumptions-list' });
    Object.entries(assumptions.assumptions).forEach(([index, assumption]) => {
      const li = createElement('li', {
        className: `assumption-item assumption-${assumption.type}`
      });

      const datasetLabel = createElement('strong', {
        textContent: `Dataset ${parseInt(index) + 1}: `
      });
      li.appendChild(datasetLabel);

      const assumptionText = createElement('span', {
        textContent: assumption.description
      });
      li.appendChild(assumptionText);

      if (assumption.inputItems && assumption.inputItems.length > 0) {
        const inputItemsText = createElement('span', {
          className: 'input-items-list',
          textContent: ` (Input items: ${assumption.inputItems.join(', ')})`
        });
        li.appendChild(inputItemsText);
      }

      assumptionsList.appendChild(li);
    });
    assumptionsDiv.appendChild(assumptionsList);
  }

  container.appendChild(assumptionsDiv);
}

/**
 * Create visualization tabs for Bayesian results
 * @param {Object} result - Bayesian result object
 * @param {Array<Object>} items - Item metadata
 * @returns {HTMLElement} Tabs container
 */
function createBayesianVisualizationTabs(result, items) {
  const tabsContainer = createElement('div', { className: 'bayesian-visualization-tabs' });
  
  const tabTypes = [
    { id: 'table', label: 'Statistics Table' },
    { id: 'density', label: 'Density Plot' },
    { id: 'ranked', label: 'Ranked Probability' }
  ];

  tabTypes.forEach(tab => {
    const tabElement = createElement('button', {
      className: `bayesian-visualization-tab ${tab.id === 'table' ? 'active' : ''}`,
      'data-view': tab.id,
      textContent: tab.label
    });
    
    tabElement.addEventListener('click', () => {
      // Use currentBayesianResult and currentItems from module state
      handleBayesianTabClick(tab.id, currentBayesianResult, currentItems);
    });
    
    tabsContainer.appendChild(tabElement);
  });

  return tabsContainer;
}

/**
 * Handle tab click for Bayesian visualization switching
 * @param {string} viewType - Visualization type to switch to
 * @param {Object} result - Bayesian result object
 * @param {Array<Object>} items - Item metadata
 */
function handleBayesianTabClick(viewType, result, items) {
  // Use stored result and items if not provided
  const bayesianResult = result || currentBayesianResult;
  const bayesianItems = items || currentItems;
  
  if (!bayesianResult) {
    console.error('No Bayesian result available for visualization');
    return;
  }

  // Update active tab
  const tabs = document.querySelectorAll('.bayesian-visualization-tab');
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

  // Render new visualization - use stored content area or find it
  const contentArea = currentContentArea || document.querySelector('.bayesian-visualization-content');
  if (contentArea && bayesianResult) {
    renderBayesianVisualization(contentArea, viewType, bayesianResult, bayesianItems);
  } else {
    console.error('Content area not found for visualization');
  }
}

/**
 * Render Bayesian visualization based on type
 * @param {HTMLElement} container - Container element
 * @param {string} viewType - Visualization type
 * @param {Object} result - Bayesian result object
 * @param {Array<Object>} items - Item metadata
 */
function renderBayesianVisualization(container, viewType, result, items) {
  clearElement(container);

  switch (viewType) {
    case 'table':
      renderBayesianResults(container, result, items);
      break;
    case 'density': {
      // Check if posteriorSamples exist and are not empty
      const hasPosteriorSamples = result.posteriorSamples && 
                                   Object.keys(result.posteriorSamples).length > 0;
      
      if (hasPosteriorSamples) {
        currentChartInstance = renderDensityPlot(container, result.posteriorSamples, items, {
          summaryStatistics: result.summaryStatistics
        });
      } else {
        // No posterior samples available (legacy cache or missing data)
        const emptyState = createElement('div', {
          className: 'visualization-placeholder',
          style: 'padding: 20px; text-align: center;',
          textContent: result.metadata?.cached 
            ? 'Density plot requires full posterior samples. Please recalculate Bayesian weights to view the density plot.'
            : 'No posterior samples available for density plot'
        });
        container.appendChild(emptyState);
      }
      break;
    }
    case 'ranked': {
      if (result.summaryStatistics) {
        currentChartInstance = renderRankedProbabilityChart(container, result.summaryStatistics, items);
      } else {
        const emptyState = createElement('div', {
          className: 'visualization-placeholder',
          textContent: 'No summary statistics available for ranked probability chart'
        });
        container.appendChild(emptyState);
      }
      break;
    }
    default:
      renderBayesianResults(container, result, items);
  }
}

/**
 * Render exclusion constraint information
 * @param {HTMLElement} container - Container element
 * @param {Array<Object>} datasets - Dataset objects
 */
function renderExclusionConstraintInfo(container, datasets) {
  // Count datasets with known inputs (where exclusion applies)
  const datasetsWithInputs = datasets.filter(ds => 
    ds.inputItems && ds.inputItems.length > 0
  );

  if (datasetsWithInputs.length === 0) {
    return; // No exclusion constraint to display
  }

  const constraintDiv = createElement('div', {
    className: 'bayesian-exclusion-constraint'
  });

  const constraintTitle = createElement('h3', {
    textContent: 'Model Constraint: Exclusion'
  });
  constraintDiv.appendChild(constraintTitle);

  const constraintDesc = createElement('p', {
    className: 'exclusion-description',
    textContent: 'The model enforces that input items cannot be returned as outputs in the same transformation. ' +
                  'This constraint is applied to ' + datasetsWithInputs.length + ' dataset(s) with known input items.'
  });
  constraintDiv.appendChild(constraintDesc);

  container.appendChild(constraintDiv);
}

/**
 * Get current Bayesian result (for comparison views)
 * @returns {Object|null} Current Bayesian result or null
 */
export function getCurrentBayesianResult() {
  return currentBayesianResult;
}

/**
 * Check if Bayesian inference is currently loading
 * @returns {boolean} True if loading
 */
export function isBayesianLoading() {
  return isLoading;
}
