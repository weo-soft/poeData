/**
 * Category view component - Display items in stash tab-style visualization
 */

import { createElement, clearElement, setLoadingState } from '../utils/dom.js';
import { loadCategoryData } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';
import { renderStashTab } from '../visualization/stashTabRenderer.js';
import { generateCategoryCharts } from '../visualization/chartGenerator.js';
import { renderDivinationCard } from '../visualization/divinationCardRenderer.js';
import { renderListView } from '../visualization/listViewRenderer.js';
import { discoverDatasetsParallel } from '../services/datasetLoader.js';
import { renderDatasetList } from '../components/datasetList.js';
import { downloadDataset } from '../utils/download.js';
import { router } from '../services/router.js';

let currentItems = [];
let currentCategoryId = null;

/**
 * Render category view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} params - Route parameters
 * @param {string} params.categoryId - Category identifier
 */
export async function renderCategoryView(container, params) {
  clearElement(container);
  
  const categoryId = params.categoryId;
  currentCategoryId = categoryId;
  
  // Check if we should show datasets view (from query param)
  const query = params.query || {};
  const viewType = query && query.view === 'datasets' ? 'datasets' : 'items';
  
  const viewSection = createElement('section', { className: 'category-view' });
  
  // Loading state
  const loadingDiv = createElement('div', { className: 'loading', textContent: 'Loading category data...' });
  viewSection.appendChild(loadingDiv);
  setLoadingState(loadingDiv, true);
  
  container.appendChild(viewSection);
  
  try {
    // Load category data
    const items = await loadCategoryData(categoryId);
    currentItems = items;
    
    // Clear loading
    clearElement(viewSection);
    
    // Category header
    const header = createElement('div', { className: 'category-header' });
    const title = createElement('h1', { 
      textContent: formatCategoryName(categoryId)
    });
    
    const itemCount = createElement('span', {
      textContent: `${items.length} items`,
      className: 'item-count'
    });
    
    header.appendChild(title);
    header.appendChild(itemCount);
    viewSection.appendChild(header);
    
    // Tabs for Items/Datasets
    const tabsContainer = createElement('div', { className: 'category-tabs' });
    const itemsTab = createElement('button', {
      className: `tab-button ${viewType === 'items' ? 'active' : ''}`,
      textContent: 'Items',
      'data-tab': 'items'
    });
    const datasetsTab = createElement('button', {
      className: `tab-button ${viewType === 'datasets' ? 'active' : ''}`,
      textContent: 'Datasets',
      'data-tab': 'datasets'
    });
    
    itemsTab.addEventListener('click', () => {
      router.navigate(`/category/${categoryId}?view=items`);
    });
    
    datasetsTab.addEventListener('click', () => {
      router.navigate(`/category/${categoryId}?view=datasets`);
    });
    
    tabsContainer.appendChild(itemsTab);
    tabsContainer.appendChild(datasetsTab);
    viewSection.appendChild(tabsContainer);
    
    // Content area
    const contentArea = createElement('div', { className: 'category-content' });
    viewSection.appendChild(contentArea);
    
    // Render based on view type
    if (viewType === 'datasets') {
      await renderDatasetsView(contentArea, categoryId);
    } else {
      await renderItemsView(contentArea, categoryId, items);
    }
    
    // Navigation (outside content area)
    const navLinks = createElement('div', { className: 'nav-links' });
    const backLink = createElement('a', {
      href: '#/categories',
      textContent: '← Back to Categories',
      className: 'back-link'
    });
    const submitLink = createElement('a', {
      href: `#/submit/${categoryId}`,
      textContent: 'Submit New Item →',
      className: 'submit-link'
    });
    navLinks.appendChild(backLink);
    navLinks.appendChild(submitLink);
    viewSection.appendChild(navLinks);
    
  } catch (error) {
    clearElement(viewSection);
    displayError(viewSection, `Failed to load category: ${error.message}`);
    
    const backLink = createElement('a', {
      href: '#/categories',
      textContent: '← Back to Categories',
      className: 'back-link'
    });
    viewSection.appendChild(backLink);
  }
}

/**
 * Check if category is one of the new categories that use list view
 * @param {string} categoryId - Category identifier
 * @returns {boolean} True if category uses list view
 */
function isNewCategory(categoryId) {
  // Categories that use grid views: breach, catalysts, delirium-orbs, essences,
  // fossils, legion, oils
  // These are now handled by renderStashTab with grid configurations
  const newCategories = [
    'tattoos'
  ];
  return newCategories.includes(categoryId);
}

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
 * Get category filename
 * @param {string} categoryId - Category identifier
 * @returns {string} Filename or path
 */
function getCategoryFilename(categoryId) {
  // Special handling for scarabs - use new directory structure
  if (categoryId === 'scarabs') {
    return 'scarabs/scarabs.json';
  }
  
  // Special handling for divination-cards - use new directory structure
  if (categoryId === 'divination-cards') {
    return 'divinationCards/divinationCards.json';
  }
  
  // Special handling for new categories with subdirectory structure
  const categoryFileMap = {
    'breach': 'breachstones/breachStones.json', // Merged category - handled in dataLoader
    'catalysts': 'catalysts/catalysts.json',
    'delirium-orbs': 'deliriumOrbs/deliriumOrbs.json',
    'essences': 'essences/essences.json',
    'fossils': 'fossils/fossils.json',
    'legion': 'legionSplinters/legionSplinters.json', // Merged category - handled in dataLoader
    'oils': 'oils/oils.json',
    'tattoos': 'tattoos/tattos.json' // Note: filename is "tattos" not "tattoos"
  };
  
  if (categoryFileMap[categoryId]) {
    return categoryFileMap[categoryId];
  }
  
  // Fallback: Convert category ID to filename (kebab-case to camelCase)
  const parts = categoryId.split('-');
  const baseName = parts.map((part, index) => {
    if (index === 0) {
      // First part: keep as-is (lowercase)
      return part;
    }
    // Subsequent parts: capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');
  
  // Return filename with Details.json suffix
  return `${baseName}Details.json`;
}

/**
 * Render grid of miniature divination cards
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} items - Array of divination card items
 */
async function renderDivinationCardGrid(container, items) {
  // Clear container
  clearElement(container);
  
  // Render each card as a miniature
  const cardWidth = 150; // Miniature size (reduced from 180)
  const promises = items.map(async (card) => {
    const cardWrapper = createElement('div', {
      className: 'divination-card-mini-wrapper'
    });
    
    const cardLink = createElement('a', {
      href: `#/category/divination-cards/item/${card.id}`,
      className: 'divination-card-mini-link'
    });
    
    const cardContainer = createElement('div', {
      className: 'divination-card-mini-container'
    });
    
    // Render the card with miniature size
    await renderDivinationCard(cardContainer, card, {
      width: cardWidth,
      responsive: false
    });
    
    cardLink.appendChild(cardContainer);
    cardWrapper.appendChild(cardLink);
    container.appendChild(cardWrapper);
  });
  
  await Promise.all(promises);
}

/**
 * Render items view
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 * @param {Array} items - Array of items
 */
async function renderItemsView(container, categoryId, items) {
  clearElement(container);
  
  // JSON link
  const jsonLink = createElement('a', {
    href: `/data/${getCategoryFilename(categoryId)}`,
    textContent: 'View Raw JSON Data',
    className: 'json-link',
    target: '_blank'
  });
  container.appendChild(jsonLink);
  
  // Statistics charts
  const chartsContainer = createElement('div', {
    className: 'charts-container',
    id: 'charts-container'
  });
  container.appendChild(chartsContainer);
  
  // Handle empty category
  if (items.length === 0) {
    const emptyMessage = createElement('div', {
      className: 'empty-state',
      innerHTML: `
        <h2>No Items Found</h2>
        <p>This category currently has no items.</p>
        <a href="#/submit/${categoryId}" class="primary-link">Submit the First Item</a>
      `
    });
    container.appendChild(emptyMessage);
  } else {
    // Render visualizations based on category type
    if (categoryId === 'divination-cards') {
      // Render divination card grid
      const cardsGrid = createElement('div', {
        className: 'divination-cards-grid',
        id: 'divination-cards-grid'
      });
      container.insertBefore(cardsGrid, chartsContainer);
      await renderDivinationCardGrid(cardsGrid, items);
    } else if (isNewCategory(categoryId)) {
      // Render list view for new categories
      const listContainer = createElement('div', {
        className: 'list-view-container',
        id: 'list-view-container'
      });
      container.insertBefore(listContainer, chartsContainer);
      await renderListView(listContainer, items, categoryId);
    } else {
      // Render stash tab visualization for other categories
      const stashContainer = createElement('div', { 
        className: 'stash-tab-container',
        id: 'stash-tab-canvas-container'
      });
      const canvas = createElement('canvas', {
        id: 'stash-tab-canvas',
        className: 'stash-tab-canvas'
      });
      stashContainer.appendChild(canvas);
      container.insertBefore(stashContainer, chartsContainer);
      await renderStashTab(canvas, items, categoryId);
    }
    generateCategoryCharts(chartsContainer, items, categoryId);
  }
}

/**
 * Render datasets view
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
async function renderDatasetsView(container, categoryId) {
  clearElement(container);
  
  console.log(`[CategoryView] Rendering datasets view for category: ${categoryId}`);
  
  // Loading state for datasets
  const loadingDiv = createElement('div', { 
    className: 'loading', 
    textContent: 'Loading datasets...' 
  });
  container.appendChild(loadingDiv);
  setLoadingState(loadingDiv, true);
  
  try {
    // Discover datasets with timeout protection
    const discoveryPromise = discoverDatasetsParallel(categoryId);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Dataset discovery timeout')), 30000)
    );
    
    const datasets = await Promise.race([discoveryPromise, timeoutPromise]);
    
    console.log(`[CategoryView] Discovered ${datasets ? datasets.length : 0} datasets for ${categoryId}`);
    
    // Clear loading
    clearElement(container);
    
    // Handle empty datasets
    if (!datasets || datasets.length === 0) {
      console.warn(`[CategoryView] No datasets found for category: ${categoryId}`);
      renderDatasetList(container, [], null, null);
      return;
    }
    
    // Render dataset list
    renderDatasetList(container, datasets, (dataset) => {
      // Navigate to dataset detail view
      router.navigate(`/category/${categoryId}/dataset/${dataset.datasetNumber}`);
    }, async (dataset) => {
      // Handle download with error handling
      try {
        await downloadDataset(categoryId, dataset.datasetNumber);
      } catch (error) {
        // Show user-friendly error message
        const errorMsg = createElement('div', {
          className: 'error-message',
          style: 'margin-top: 1rem; padding: 1rem; background-color: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.3); border-radius: 4px; color: #ff6666;',
          textContent: `Download failed: ${error.message}`
        });
        container.appendChild(errorMsg);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
          if (errorMsg.parentNode) {
            errorMsg.parentNode.removeChild(errorMsg);
          }
        }, 5000);
      }
    });
  } catch (error) {
    clearElement(container);
    
    // Handle specific error types
    if (error.message.includes('timeout')) {
      displayError(container, 'Loading datasets took too long. Please try again.');
    } else {
      displayError(container, `Failed to load datasets: ${error.message}`);
    }
    
    // Add retry button
    const retryButton = createElement('button', {
      className: 'btn btn-primary',
      textContent: 'Retry',
      style: 'margin-top: 1rem;'
    });
    retryButton.addEventListener('click', () => {
      renderDatasetsView(container, categoryId);
    });
    container.appendChild(retryButton);
  }
}

/**
 * Get current items (for external access)
 * @returns {Array} Current items
 */
export function getCurrentItems() {
  return currentItems;
}

