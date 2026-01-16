/**
 * Dataset list component - Display list of datasets for a category
 */

import { createElement, clearElement } from '../utils/dom.js';

/**
 * Render dataset list
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} datasets - Array of DatasetMetadata objects
 * @param {Function} onDatasetSelect - Callback when dataset is selected
 * @param {Function} onDownload - Callback when download is requested
 */
export function renderDatasetList(container, datasets, onDatasetSelect, onDownload) {
  clearElement(container);
  
  console.log(`[DatasetList] Rendering ${datasets ? datasets.length : 0} datasets`);
  
  // Handle empty state
  if (!datasets || datasets.length === 0) {
    console.warn('[DatasetList] No datasets to render, showing empty state');
    renderEmptyState(container);
    return;
  }
  
  // Create dataset list container
  const listContainer = createElement('div', { className: 'dataset-list-container' });
  
  // Render each dataset as a list item
  datasets.forEach((dataset, index) => {
    console.log(`[DatasetList] Rendering dataset ${index + 1}:`, dataset.name || `Dataset ${dataset.datasetNumber}`);
    const listItem = renderDatasetListItem(dataset, onDatasetSelect, onDownload);
    listContainer.appendChild(listItem);
  });
  
  container.appendChild(listContainer);
  console.log(`[DatasetList] Successfully rendered ${datasets.length} dataset list items`);
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
 * @param {Function} onDownload - Callback when download is requested
 * @returns {HTMLElement} Dataset list item element
 */
function renderDatasetListItem(dataset, onSelect, onDownload) {
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
  
  // Download button (separate from click action)
  if (onDownload) {
    const downloadButton = createElement('button', {
      className: 'btn btn-secondary btn-small',
      textContent: 'Download'
    });
    downloadButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const originalText = downloadButton.textContent;
      downloadButton.disabled = true;
      downloadButton.textContent = 'Downloading...';
      
      try {
        await onDownload(dataset);
        downloadButton.textContent = 'Downloaded!';
        setTimeout(() => {
          downloadButton.textContent = originalText;
          downloadButton.disabled = false;
        }, 2000);
      } catch (error) {
        downloadButton.textContent = 'Error';
        setTimeout(() => {
          downloadButton.textContent = originalText;
          downloadButton.disabled = false;
        }, 2000);
        console.error('Download failed:', error);
      }
    });
    content.appendChild(downloadButton);
  }
  
  listItem.appendChild(content);
  
  return listItem;
}
