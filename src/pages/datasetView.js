/**
 * Dataset detail view page - Display full dataset information
 */

import { createElement, clearElement, setLoadingState } from '../utils/dom.js';
import { loadDataset } from '../services/datasetLoader.js';
import { displayError } from '../utils/errors.js';
import { renderDatasetDetail } from '../components/datasetDetail.js';
import { downloadDataset } from '../utils/download.js';
import { router } from '../services/router.js';

/**
 * Render dataset detail view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} params - Route parameters
 * @param {string} params.categoryId - Category identifier
 * @param {string} params.datasetNumber - Dataset number
 */
export async function renderDatasetView(container, params) {
  clearElement(container);
  
  const categoryId = params.categoryId;
  const datasetNumber = parseInt(params.datasetNumber, 10);
  
  if (!categoryId || !datasetNumber || isNaN(datasetNumber)) {
    displayError(container, 'Invalid dataset parameters');
    return;
  }
  
  const viewSection = createElement('section', { className: 'dataset-view' });
  
  // Loading state
  const loadingDiv = createElement('div', { 
    className: 'loading', 
    textContent: 'Loading dataset...' 
  });
  viewSection.appendChild(loadingDiv);
  setLoadingState(loadingDiv, true);
  
  container.appendChild(viewSection);
  
  try {
    // Load full dataset
    const dataset = await loadDataset(categoryId, datasetNumber);
    
    // Clear loading
    clearElement(viewSection);
    
    // Render dataset detail
    renderDatasetDetail(
      viewSection,
      dataset,
      categoryId,
      () => {
        // Back to dataset list
        router.navigate(`/category/${categoryId}?view=datasets`);
      },
      async (dataset, categoryId) => {
        // Handle download
        try {
          await downloadDataset(categoryId, datasetNumber, dataset);
        } catch (error) {
          displayError(viewSection, `Failed to download dataset: ${error.message}`);
        }
      }
    );
    
  } catch (error) {
    clearElement(viewSection);
    displayError(viewSection, `Failed to load dataset: ${error.message}`);
    
    // Add back link
    const backLink = createElement('a', {
      href: `#/category/${categoryId}?view=datasets`,
      textContent: '← Back to Dataset List',
      className: 'back-link'
    });
    viewSection.appendChild(backLink);
  }
}
