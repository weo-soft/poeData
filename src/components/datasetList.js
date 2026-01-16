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
  
  // Handle empty state
  if (!datasets || datasets.length === 0) {
    renderEmptyState(container);
    return;
  }
  
  // Create dataset list container
  const listContainer = createElement('div', { className: 'dataset-list' });
  
  // Render each dataset as a card
  datasets.forEach(dataset => {
    const card = renderDatasetCard(dataset, onDatasetSelect, onDownload);
    listContainer.appendChild(card);
  });
  
  container.appendChild(listContainer);
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
 * Render dataset card
 * @param {Object} dataset - DatasetMetadata object
 * @param {Function} onSelect - Callback when dataset is selected
 * @param {Function} onDownload - Callback when download is requested
 * @returns {HTMLElement} Dataset card element
 */
function renderDatasetCard(dataset, onSelect, onDownload) {
  const card = createElement('div', { className: 'dataset-card' });
  
  // Dataset header
  const header = createElement('div', { className: 'dataset-card-header' });
  const name = createElement('h3', { 
    className: 'dataset-name',
    textContent: dataset.name || `Dataset ${dataset.datasetNumber}`
  });
  header.appendChild(name);
  
  // Metadata section
  const metadata = createElement('div', { className: 'dataset-metadata' });
  
  if (dataset.date) {
    const dateEl = createElement('span', {
      className: 'dataset-date',
      textContent: `Date: ${dataset.date}`
    });
    metadata.appendChild(dateEl);
  }
  
  if (dataset.patch) {
    const patchEl = createElement('span', {
      className: 'dataset-patch',
      textContent: `Patch: ${dataset.patch}`
    });
    metadata.appendChild(patchEl);
  }
  
  if (dataset.itemCount !== undefined) {
    const itemCountEl = createElement('span', {
      className: 'dataset-item-count',
      textContent: `${dataset.itemCount} items`
    });
    metadata.appendChild(itemCountEl);
  }
  
  if (dataset.description) {
    const descEl = createElement('p', {
      className: 'dataset-description',
      textContent: dataset.description
    });
    metadata.appendChild(descEl);
  }
  
  // Indicators
  const indicators = createElement('div', { className: 'dataset-indicators' });
  
  if (dataset.hasSources) {
    const sourceIndicator = createElement('span', {
      className: 'indicator indicator-sources',
      textContent: 'Has sources',
      title: 'This dataset has source information'
    });
    indicators.appendChild(sourceIndicator);
  }
  
  if (dataset.hasInputItems) {
    const inputIndicator = createElement('span', {
      className: 'indicator indicator-inputs',
      textContent: 'Has input items',
      title: 'This dataset has input items'
    });
    indicators.appendChild(inputIndicator);
  }
  
  // Actions
  const actions = createElement('div', { className: 'dataset-actions' });
  
  if (onSelect) {
    const viewButton = createElement('button', {
      className: 'btn btn-primary',
      textContent: 'View Details'
    });
    viewButton.addEventListener('click', (e) => {
      e.preventDefault();
      onSelect(dataset);
    });
    actions.appendChild(viewButton);
  }
  
  if (onDownload) {
    const downloadButton = createElement('button', {
      className: 'btn btn-secondary',
      textContent: 'Download'
    });
    downloadButton.addEventListener('click', async (e) => {
      e.preventDefault();
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
    actions.appendChild(downloadButton);
  }
  
  // Assemble card
  card.appendChild(header);
  card.appendChild(metadata);
  if (indicators.children.length > 0) {
    card.appendChild(indicators);
  }
  card.appendChild(actions);
  
  return card;
}
