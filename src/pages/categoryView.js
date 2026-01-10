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

let currentItems = [];

/**
 * Render category view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} params - Route parameters
 * @param {string} params.categoryId - Category identifier
 */
export async function renderCategoryView(container, params) {
  clearElement(container);
  
  const categoryId = params.categoryId;
  
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
    
    // JSON link
    const jsonLink = createElement('a', {
      href: `/data/${getCategoryFilename(categoryId)}`,
      textContent: 'View Raw JSON Data',
      className: 'json-link',
      target: '_blank'
    });
    viewSection.appendChild(jsonLink);
    
    // Statistics charts
    const chartsContainer = createElement('div', {
      className: 'charts-container',
      id: 'charts-container'
    });
    viewSection.appendChild(chartsContainer);
    
    // Navigation
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
      viewSection.appendChild(emptyMessage);
    } else {
      // Render visualizations based on category type
      if (categoryId === 'divination-cards') {
        // Render divination card grid
        const cardsGrid = createElement('div', {
          className: 'divination-cards-grid',
          id: 'divination-cards-grid'
        });
        viewSection.insertBefore(cardsGrid, chartsContainer);
        await renderDivinationCardGrid(cardsGrid, items);
      } else if (isNewCategory(categoryId)) {
        // Render list view for new categories
        const listContainer = createElement('div', {
          className: 'list-view-container',
          id: 'list-view-container'
        });
        viewSection.insertBefore(listContainer, chartsContainer);
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
        viewSection.insertBefore(stashContainer, chartsContainer);
        await renderStashTab(canvas, items, categoryId);
      }
      generateCategoryCharts(chartsContainer, items, categoryId);
    }
    
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
  const newCategories = [
    'breach-splinters',
    'breachstones',
    'catalysts',
    'delirium-orbs',
    'essences',
    'fossils',
    'legion-emblems',
    'legion-splinters',
    'oils',
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
    'breach-splinters': 'breachSplinter/breachSplinter.json', // Note: singular "Splinter"
    'breachstones': 'breachstones/breachStones.json',
    'catalysts': 'catalysts/catalysts.json',
    'delirium-orbs': 'deliriumOrbs/deliriumOrbs.json',
    'essences': 'essences/essences.json',
    'fossils': 'fossils/fossils.json',
    'legion-emblems': 'legionEmblems/legionEmblems.json',
    'legion-splinters': 'legionSplinters/legionSplinters.json',
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
 * Get current items (for external access)
 * @returns {Array} Current items
 */
export function getCurrentItems() {
  return currentItems;
}

