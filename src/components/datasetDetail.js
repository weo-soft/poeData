/**
 * Dataset detail component - Display comprehensive dataset information
 */

import { createElement, clearElement } from '../utils/dom.js';
import { getDatasetUrl } from '../utils/fileUrls.js';

/**
 * Format category name for display
 * @param {string} categoryId - Category identifier
 * @returns {string} Formatted name
 */
function formatCategoryName(categoryId) {
  return categoryId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Render dataset detail view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} dataset - Full dataset object
 * @param {string} categoryId - Category identifier
 * @param {Function} onBack - Callback when back button is clicked
 * @param {Function} onDownload - Callback when download is requested (deprecated, kept for compatibility)
 * @param {number} [datasetNumber] - Optional dataset number (if not provided, will try to get from dataset.datasetNumber)
 */
export function renderDatasetDetail(container, dataset, categoryId, onBack, onDownload, datasetNumber) {
  clearElement(container);
  
  if (!dataset) {
    const errorMsg = createElement('div', {
      className: 'error',
      textContent: 'Dataset not found'
    });
    container.appendChild(errorMsg);
    return;
  }
  
  const detailSection = createElement('div', { className: 'dataset-detail' });
  
  // Create header with category name and back button (if provided)
  if (onBack) {
    const detailHeader = createElement('div', { className: 'dataset-detail-header' });
    
    // Category name on the left
    const categoryName = createElement('h1', { 
      className: 'dataset-category-name',
      textContent: formatCategoryName(categoryId)
    });
    detailHeader.appendChild(categoryName);
    
    // Back button on the right
    const backButton = createElement('button', {
      className: 'btn btn-secondary',
      textContent: '← Back'
    });
    backButton.addEventListener('click', onBack);
    detailHeader.appendChild(backButton);
    
    detailSection.appendChild(detailHeader);
  }
  
  // Metadata section (with download link inline)
  // Use provided datasetNumber or try to get from dataset object
  const effectiveDatasetNumber = datasetNumber || dataset.datasetNumber;
  const metadataSection = renderMetadataSection(dataset, onDownload, categoryId, effectiveDatasetNumber);
  detailSection.appendChild(metadataSection);
  
  // Sources section
  if (dataset.sources && Array.isArray(dataset.sources) && dataset.sources.length > 0) {
    const sourcesSection = renderSourcesSection(dataset.sources);
    detailSection.appendChild(sourcesSection);
  }
  
  // Input items section
  if (dataset.inputItems && Array.isArray(dataset.inputItems) && dataset.inputItems.length > 0) {
    const inputItemsSection = renderInputItemsSection(dataset.inputItems);
    detailSection.appendChild(inputItemsSection);
  }
  
  // Items section
  if (dataset.items && Array.isArray(dataset.items)) {
    if (dataset.items.length > 0) {
      const itemsSection = renderItemsSection(dataset.items);
      detailSection.appendChild(itemsSection);
    } else {
      // Handle empty items array
      const emptyItemsSection = createElement('section', { className: 'dataset-detail-section' });
      const title = createElement('h2', { 
        className: 'section-title',
        textContent: 'Items'
      });
      const emptyMsg = createElement('p', {
        className: 'empty-message',
        textContent: 'This dataset contains no items.'
      });
      emptyItemsSection.appendChild(title);
      emptyItemsSection.appendChild(emptyMsg);
      detailSection.appendChild(emptyItemsSection);
    }
  }
  
  // Note: Download button is now in the header, so we don't need it at the bottom anymore
  
  container.appendChild(detailSection);
}

/**
 * Render metadata section
 * @param {Object} dataset - Dataset object
 * @param {Function} onDownload - Optional download callback (deprecated, kept for compatibility)
 * @param {string} categoryId - Category identifier
 * @param {number} [datasetNumber] - Optional dataset number for generating download link
 * @returns {HTMLElement} Metadata section element
 */
function renderMetadataSection(dataset, onDownload, categoryId, datasetNumber) {
  const section = createElement('section', { className: 'dataset-detail-section' });
  
  // Create title container with flex layout
  const titleContainer = createElement('div', { className: 'dataset-metadata-title-container' });
  
  // Build title with inline metadata
  const title = createElement('h2', { className: 'section-title' });
  
  // Collect metadata parts to display inline
  const metadataParts = [];
  
  // Name
  if (dataset.name) {
    metadataParts.push(createElement('span', { 
      className: 'metadata-inline-item',
      textContent: dataset.name
    }));
  }
  
  // Date
  if (dataset.date) {
    metadataParts.push(createElement('span', { 
      className: 'metadata-inline-item',
      textContent: dataset.date
    }));
  }
  
  // Patch Version
  if (dataset.patch) {
    metadataParts.push(createElement('span', { 
      className: 'metadata-inline-item',
      textContent: dataset.patch
    }));
  }
  
  // Item count
  if (dataset.items && Array.isArray(dataset.items)) {
    metadataParts.push(createElement('span', { 
      className: 'metadata-inline-item',
      textContent: `${dataset.items.length} items`
    }));
  }
  
  // Add separators and append metadata parts
  if (metadataParts.length > 0) {
    metadataParts.forEach((part, index) => {
      title.appendChild(part);
      if (index < metadataParts.length - 1) {
        const sep = createElement('span', { 
          className: 'metadata-separator',
          textContent: ' | '
        });
        title.appendChild(sep);
      }
    });
  }
  
  titleContainer.appendChild(title);
  
  // Download link (right side) - Direct link to dataset file
  if (datasetNumber) {
    const datasetUrl = getDatasetUrl(categoryId, datasetNumber);
    const downloadLink = createElement('a', {
      className: 'btn btn-primary dataset-detail-download-link',
      href: datasetUrl,
      download: `dataset${datasetNumber}.json`,
      textContent: 'Download Dataset',
      title: 'Direct link to dataset JSON file'
    });
    titleContainer.appendChild(downloadLink);
  }
  
  section.appendChild(titleContainer);
  
  // Description (kept separate as it wasn't mentioned in the merge request)
  if (dataset.description) {
    const metadataList = createElement('dl', { className: 'dataset-metadata-list' });
    const descDt = createElement('dt', { textContent: 'Description' });
    const descDd = createElement('dd', { textContent: dataset.description });
    metadataList.appendChild(descDt);
    metadataList.appendChild(descDd);
    section.appendChild(metadataList);
  }
  
  return section;
}

/**
 * Render sources section
 * @param {Array} sources - Array of source objects
 * @returns {HTMLElement} Sources section element
 */
function renderSourcesSection(sources) {
  const section = createElement('section', { className: 'dataset-detail-section' });
  const title = createElement('h2', { 
    className: 'section-title',
    textContent: 'Sources'
  });
  section.appendChild(title);
  
  const sourcesList = createElement('ul', { className: 'sources-list' });
  
  sources.forEach((source, index) => {
    // Handle invalid source objects gracefully
    if (!source || typeof source !== 'object') {
      console.warn(`Invalid source at index ${index}`);
      return;
    }
    
    const sourceItem = createElement('li', { className: 'source-item' });
    
    const sourceName = createElement('strong', { 
      textContent: (source.name && typeof source.name === 'string') ? source.name.trim() : 'Unknown Source'
    });
    sourceItem.appendChild(sourceName);
    
    if (source.author && typeof source.author === 'string' && source.author.trim()) {
      const author = createElement('span', {
        className: 'source-author',
        textContent: ` by ${source.author.trim()}`
      });
      sourceItem.appendChild(author);
    }
    
    if (source.url && typeof source.url === 'string' && source.url.trim()) {
      try {
        // Validate URL format
        new URL(source.url.trim());
        const link = createElement('a', {
          href: source.url.trim(),
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'source-link',
          textContent: ' View Source →'
        });
        sourceItem.appendChild(link);
      } catch (error) {
        // Invalid URL, show as text
        const invalidUrl = createElement('span', {
          className: 'source-link-invalid',
          textContent: ` (Invalid URL: ${source.url})`,
          title: 'This URL is invalid and cannot be opened'
        });
        sourceItem.appendChild(invalidUrl);
      }
    }
    
    sourcesList.appendChild(sourceItem);
  });
  
  section.appendChild(sourcesList);
  return section;
}

/**
 * Render input items section
 * @param {Array} inputItems - Array of input item objects
 * @returns {HTMLElement} Input items section element
 */
function renderInputItemsSection(inputItems) {
  const section = createElement('section', { className: 'dataset-detail-section' });
  const title = createElement('h2', { 
    className: 'section-title',
    textContent: 'Input Items'
  });
  section.appendChild(title);
  
  const itemsList = createElement('ul', { className: 'input-items-list' });
  
  inputItems.forEach(inputItem => {
    const item = createElement('li', { 
      className: 'input-item',
      textContent: inputItem.id || 'Unknown'
    });
    itemsList.appendChild(item);
  });
  
  section.appendChild(itemsList);
  return section;
}

/**
 * Render items section with preview
 * @param {Array} items - Array of item objects
 * @returns {HTMLElement} Items section element
 */
function renderItemsSection(items) {
  const section = createElement('section', { className: 'dataset-detail-section' });
  const title = createElement('h2', { 
    className: 'section-title',
    textContent: `Items (${items.length})`
  });
  section.appendChild(title);
  
  // Show first 20 items by default, with "show more" option
  const previewCount = 20;
  const showAll = items.length <= previewCount;
  const displayItems = showAll ? items : items.slice(0, previewCount);
  
  const itemsTable = createElement('table', { className: 'items-table' });
  
  // Table header
  const thead = createElement('thead');
  const headerRow = createElement('tr');
  const idHeader = createElement('th', { textContent: 'Item ID' });
  const countHeader = createElement('th', { textContent: 'Count' });
  headerRow.appendChild(idHeader);
  headerRow.appendChild(countHeader);
  thead.appendChild(headerRow);
  itemsTable.appendChild(thead);
  
  // Table body
  const tbody = createElement('tbody');
  displayItems.forEach(item => {
    const row = createElement('tr');
    const idCell = createElement('td', { 
      className: 'item-id',
      textContent: item.id || 'Unknown'
    });
    const countCell = createElement('td', { 
      className: 'dataset-item-count-cell',
      textContent: item.count !== undefined ? item.count.toString() : 'N/A'
    });
    row.appendChild(idCell);
    row.appendChild(countCell);
    tbody.appendChild(row);
  });
  itemsTable.appendChild(tbody);
  
  section.appendChild(itemsTable);
  
  // Show more button if needed
  if (!showAll) {
    const showMoreContainer = createElement('div', { className: 'show-more-container' });
    let showingAll = false;
    
    const showMoreButton = createElement('button', {
      className: 'btn btn-secondary',
      textContent: `Show All ${items.length} Items`
    });
    
    showMoreButton.addEventListener('click', () => {
      if (!showingAll) {
        // Show all items
        clearElement(tbody);
        items.forEach(item => {
          const row = createElement('tr');
          const idCell = createElement('td', { 
            className: 'item-id',
            textContent: item.id || 'Unknown'
          });
          const countCell = createElement('td', { 
            className: 'dataset-item-count-cell',
            textContent: item.count !== undefined ? item.count.toString() : 'N/A'
          });
          row.appendChild(idCell);
          row.appendChild(countCell);
          tbody.appendChild(row);
        });
        showMoreButton.textContent = 'Show Less';
        showingAll = true;
      } else {
        // Show preview again
        clearElement(tbody);
        displayItems.forEach(item => {
          const row = createElement('tr');
          const idCell = createElement('td', { 
            className: 'item-id',
            textContent: item.id || 'Unknown'
          });
          const countCell = createElement('td', { 
            className: 'dataset-item-count-cell',
            textContent: item.count !== undefined ? item.count.toString() : 'N/A'
          });
          row.appendChild(idCell);
          row.appendChild(countCell);
          tbody.appendChild(row);
        });
        showMoreButton.textContent = `Show All ${items.length} Items`;
        showingAll = false;
      }
    });
    
    showMoreContainer.appendChild(showMoreButton);
    section.appendChild(showMoreContainer);
  }
  
  return section;
}
