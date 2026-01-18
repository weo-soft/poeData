/**
 * Dataset list component - Display list of datasets for a category
 */

import { createElement, clearElement } from '../utils/dom.js';
import { getDatasetUrl } from '../utils/fileUrls.js';

/**
 * Render dataset list
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} datasets - Array of DatasetMetadata objects
 * @param {Function} onDatasetSelect - Callback when dataset is selected
 * @param {Function} onDownload - Callback when download is requested (deprecated, kept for compatibility)
 * @param {string} categoryId - Category identifier (required for generating download links)
 */
export function renderDatasetList(container, datasets, onDatasetSelect, onDownload, categoryId) {
  clearElement(container);
  
  console.log(`[DatasetList] Rendering ${datasets ? datasets.length : 0} datasets`);
  
  // Handle empty state
  if (!datasets || datasets.length === 0) {
    console.warn('[DatasetList] No datasets to render, showing empty state');
    renderEmptyState(container);
    return;
  }
  
  // Sort datasets by patch version (descending)
  const sortedDatasets = sortDatasetsByPatch(datasets);
  
  // Create dataset list container
  const listContainer = createElement('div', { className: 'dataset-list-container' });
  
  // Render each dataset as a list item
  sortedDatasets.forEach((dataset, index) => {
    console.log(`[DatasetList] Rendering dataset ${index + 1}:`, dataset.name || `Dataset ${dataset.datasetNumber}`);
    const listItem = renderDatasetListItem(dataset, onDatasetSelect, onDownload, categoryId);
    listContainer.appendChild(listItem);
  });
  
  container.appendChild(listContainer);
  console.log(`[DatasetList] Successfully rendered ${sortedDatasets.length} dataset list items`);
}

/**
 * Sort datasets by patch version (descending)
 * @param {Array} datasets - Array of DatasetMetadata objects
 * @returns {Array} Sorted array of datasets
 */
export function sortDatasetsByPatch(datasets) {
  if (!datasets || datasets.length === 0) {
    return [];
  }
  
  return [...datasets].sort((a, b) => {
    const patchA = a.patch || '';
    const patchB = b.patch || '';
    
    // If both have patches, compare them
    if (patchA && patchB) {
      return comparePatchVersions(patchB, patchA); // Descending order
    }
    
    // If only one has a patch, prioritize it
    if (patchA && !patchB) return -1;
    if (!patchA && patchB) return 1;
    
    // If neither has a patch, sort by dataset number (descending)
    return (b.datasetNumber || 0) - (a.datasetNumber || 0);
  });
}

/**
 * Compare two patch version strings (e.g., "3.24", "3.23")
 * Returns: negative if a < b, positive if a > b, 0 if equal
 * @param {string} a - First patch version
 * @param {string} b - Second patch version
 * @returns {number} Comparison result
 */
function comparePatchVersions(a, b) {
  // Parse patch versions (e.g., "3.24" -> [3, 24])
  const parsePatch = (patch) => {
    return patch.split('.').map(part => {
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });
  };
  
  const partsA = parsePatch(a);
  const partsB = parsePatch(b);
  
  // Compare each part
  const maxLength = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    
    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }
  
  return 0;
}

/**
 * Render empty state message
 * @param {HTMLElement} container - Container element
 */
function renderEmptyState(container) {
  const emptyState = createElement('div', {
    className: 'empty-state dataset-empty-state',
    innerHTML: `
      <h2>No Datasets Available</h2>
      <p>This category currently has no datasets available.</p>
    `
  });
  
  container.appendChild(emptyState);
}

/**
 * Render dataset list item
 * @param {Object} dataset - DatasetMetadata object
 * @param {Function} onSelect - Callback when dataset is selected
 * @param {Function} onDownload - Callback when download is requested (deprecated, kept for compatibility)
 * @param {string} categoryId - Category identifier (required for generating download links)
 * @returns {HTMLElement} Dataset list item element
 */
function renderDatasetListItem(dataset, onSelect, onDownload, categoryId) {
  const listItem = createElement('div', { 
    className: 'dataset-list-item',
    'data-dataset-number': dataset.datasetNumber
  });
  
  // Main content area (clickable)
  const content = createElement('div', { className: 'dataset-list-item-content' });
  
  // Dataset name
  const name = createElement('span', { 
    className: 'dataset-list-item-name',
    textContent: dataset.name || `Dataset ${dataset.datasetNumber}`
  });
  content.appendChild(name);
  
  // Patch version
  if (dataset.patch) {
    const patchEl = createElement('span', {
      className: 'dataset-patch',
      textContent: dataset.patch
    });
    content.appendChild(patchEl);
  }
  
  // Make content clickable
  if (onSelect) {
    content.style.cursor = 'pointer';
    content.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(dataset);
    });
  }
  
  // Download link (separate from click action) - Direct link to dataset file
  if (dataset && dataset.datasetNumber && categoryId) {
    const datasetUrl = getDatasetUrl(categoryId, dataset.datasetNumber);
    const downloadLink = createElement('a', {
      className: 'btn btn-secondary btn-small',
      href: datasetUrl,
      download: `dataset${dataset.datasetNumber}.json`,
      textContent: 'Download',
      title: 'Direct link to dataset JSON file'
    });
    
    // Prevent link click from triggering parent click
    downloadLink.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    content.appendChild(downloadLink);
  }
  
  listItem.appendChild(content);
  
  return listItem;
}
