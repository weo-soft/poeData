/**
 * Item detail view component - Display detailed information about a specific item
 */

import { createElement, clearElement, setLoadingState } from '../utils/dom.js';
import { getItemById } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';
import { renderItemDetails } from '../visualization/itemRenderer.js';
import { hideTooltip } from '../utils/tooltip.js';

/**
 * Render item detail view
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} params - Route parameters
 * @param {string} params.categoryId - Category identifier
 * @param {string} params.itemId - Item identifier
 */
export async function renderItemDetail(container, params) {
  clearElement(container);
  // Hide any visible tooltips when navigating to detail page
  hideTooltip();
  
  const { categoryId, itemId } = params;
  
  const detailSection = createElement('section', { className: 'item-detail' });
  
  // Loading state
  const loadingDiv = createElement('div', { className: 'loading', textContent: 'Loading item details...' });
  detailSection.appendChild(loadingDiv);
  setLoadingState(loadingDiv, true);
  
  container.appendChild(detailSection);
  
  try {
    // Load item data
    const item = await getItemById(categoryId, itemId);
    
    if (!item) {
      // Show 404-style error
      const notFoundDiv = createElement('div', {
        className: 'error',
        innerHTML: `
          <h2>Item Not Found</h2>
          <p>Item "${itemId}" was not found in category "${formatCategoryName(categoryId)}".</p>
          <p>The item may have been removed or the ID may be incorrect.</p>
        `
      });
      detailSection.appendChild(notFoundDiv);
      return;
    }
    
    // Clear loading
    clearElement(detailSection);
    
    // Navigation at the top
    const navLinks = createElement('div', { className: 'nav-links' });
    const backLink = createElement('a', {
      href: `#/category/${categoryId}`,
      textContent: `← Back to ${formatCategoryName(categoryId)}`,
      className: 'back-link'
    });
    navLinks.appendChild(backLink);
    detailSection.appendChild(navLinks);
    
    // Item header
    const header = createElement('div', { className: 'item-header' });
    const title = createElement('h1', { textContent: item.name });
    header.appendChild(title);
    detailSection.appendChild(header);
    
    // JSON link
    const jsonLink = createElement('a', {
      href: `/data/${getCategoryFilename(categoryId)}#item:${itemId}`,
      textContent: 'View Raw JSON Data',
      className: 'json-link',
      target: '_blank'
    });
    detailSection.appendChild(jsonLink);
    
    // Item details
    const detailsContainer = createElement('div', {
      className: 'item-details-container',
      id: 'item-details-container'
    });
    detailSection.appendChild(detailsContainer);
    
    // Render item details
    await renderItemDetails(detailsContainer, item, categoryId);
    
  } catch (error) {
    clearElement(detailSection);
    displayError(detailSection, `Failed to load item: ${error.message}`);
    
    const backLink = createElement('a', {
      href: `#/category/${categoryId}`,
      textContent: `← Back to ${formatCategoryName(categoryId)}`,
      className: 'back-link'
    });
    detailSection.appendChild(backLink);
  }
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
 * @returns {string} Filename
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

