/**
 * List view renderer for displaying items in a simple list format
 * Shows item name and icon, with clickable items that navigate to detail view
 */

import { createElement, clearElement } from '../utils/dom.js';
import { loadItemIcon, getIconUrl } from '../utils/iconLoader.js';
import { showTooltip, hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';

/**
 * Render list view for items
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} items - Array of item objects
 * @param {string} categoryId - Category identifier
 */
export async function renderListView(container, items, categoryId) {
  clearElement(container);
  
  // Handle empty category
  if (!items || items.length === 0) {
    renderEmptyState(container, categoryId);
    return;
  }
  
  // Special handling for tattoos
  if (categoryId === 'tattoos') {
    await renderTattoosView(container, items, categoryId);
    return;
  }
  
  // Special handling for runegrafts
  if (categoryId === 'runegrafts') {
    await renderRunegraftsView(container, items, categoryId);
    return;
  }
  
  // Create list container
  const listContainer = createElement('div', {
    className: 'list-view-container'
  });
  
  // Render each item
  const itemPromises = items.map(item => renderListItem(listContainer, item, categoryId));
  await Promise.all(itemPromises);
  
  container.appendChild(listContainer);
}

/**
 * Render a single list item
 * @param {HTMLElement} container - Container to append item to
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 */
async function renderListItem(container, item, categoryId) {
  // Create list item element
  const listItem = createElement('div', {
    className: 'list-view-item'
  });
  
  // Create link wrapper for clickable item
  const itemLink = createElement('a', {
    href: `#/category/${categoryId}/item/${item.id}`,
    className: 'list-view-item-link'
  });
  
  // Create icon container
  const iconContainer = createElement('div', {
    className: 'list-view-item-icon-container'
  });
  
  // Load and display icon
  try {
    const icon = await loadItemIcon(item, categoryId);
    const iconImg = createElement('img', {
      className: 'list-view-item-icon',
      src: icon.src,
      alt: item.name || item.id,
      onerror: function() {
        // Fallback if image fails to display
        this.src = getIconUrl(item, categoryId);
        this.onerror = null; // Prevent infinite loop
      }
    });
    iconContainer.appendChild(iconImg);
  } catch (error) {
    // Use placeholder if icon loading fails
    const placeholderImg = createElement('img', {
      className: 'list-view-item-icon',
      src: getIconUrl(item, categoryId),
      alt: item.name || item.id
    });
    iconContainer.appendChild(placeholderImg);
  }
  
  // Create name container
  const nameContainer = createElement('div', {
    className: 'list-view-item-name-container'
  });
  
  // Display name or fallback to item ID
  const itemName = createElement('span', {
    className: 'list-view-item-name',
    textContent: item.name || item.id || 'Unknown Item'
  });
  nameContainer.appendChild(itemName);
  
  // Assemble item
  itemLink.appendChild(iconContainer);
  itemLink.appendChild(nameContainer);
  listItem.appendChild(itemLink);
  
  container.appendChild(listItem);
}

/**
 * Get attribute from tattoo's replaces field
 * @param {Object} tattoo - Tattoo item object
 * @returns {string|null} Attribute name (Dexterity, Intelligence, or Strength) or null
 */
function getTattooAttribute(tattoo) {
  if (!tattoo.replaces) {
    return null;
  }
  
  const replaces = tattoo.replaces.toLowerCase();
  
  if (replaces.includes('dexterity')) {
    return 'Dexterity';
  } else if (replaces.includes('intelligence')) {
    return 'Intelligence';
  } else if (replaces.includes('strength')) {
    return 'Strength';
  }
  
  return null;
}

/**
 * Group tattoos by attribute
 * @param {Array} tattoos - Array of tattoo items
 * @returns {Object} Object with attributes as keys and arrays of tattoos as values
 */
function groupTattoosByAttribute(tattoos) {
  const grouped = {
    'Dexterity': [],
    'Intelligence': [],
    'Strength': []
  };
  
  tattoos.forEach(tattoo => {
    const attribute = getTattooAttribute(tattoo);
    if (attribute && grouped[attribute]) {
      grouped[attribute].push(tattoo);
    }
  });
  
  return grouped;
}

/**
 * Filter tattoos based on search query
 * @param {Array} tattoos - Array of tattoo items
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered array of tattoos
 */
export function filterTattoos(tattoos, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return tattoos;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return tattoos.filter(tattoo => {
    // Search in name
    if (tattoo.name && tattoo.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in description
    if (tattoo.description) {
      const cleanDescription = tattoo.description.replace(/<[^>]*>/g, '').toLowerCase();
      if (cleanDescription.includes(query)) {
        return true;
      }
    }
    
    // Search in dropRequired
    if (tattoo.dropRequired) {
      if (tattoo.dropRequired.toLowerCase().includes(query)) {
        return true;
      }
    }
    
    // Search in replaces (attribute)
    if (tattoo.replaces) {
      if (tattoo.replaces.toLowerCase().includes(query)) {
        return true;
      }
    }
    
    // Search in attribute name (Dexterity, Intelligence, Strength)
    const attribute = getTattooAttribute(tattoo);
    if (attribute && attribute.toLowerCase().includes(query)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Filter runegrafts based on search query
 * @param {Array} runegrafts - Array of runegraft items
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered array of runegrafts
 */
export function filterRunegrafts(runegrafts, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return runegrafts;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return runegrafts.filter(runegraft => {
    // Search in name
    if (runegraft.name && runegraft.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in description
    if (runegraft.description) {
      const cleanDescription = runegraft.description.replace(/<[^>]*>/g, '').toLowerCase();
      if (cleanDescription.includes(query)) {
        return true;
      }
    }
    
    // Search in dropRequired
    if (runegraft.dropRequired) {
      if (runegraft.dropRequired.toLowerCase().includes(query)) {
        return true;
      }
    }
    
    // Search in replaces
    if (runegraft.replaces) {
      if (runegraft.replaces.toLowerCase().includes(query)) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Render tattoos view with attribute containers
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} items - Array of tattoo items
 * @param {string} categoryId - Category identifier
 */
async function renderTattoosView(container, items, categoryId) {
  // Show message if no tattoos match filter
  if (items.length === 0) {
    const noResultsMessage = createElement('div', {
      className: 'tattoos-no-results',
      textContent: 'No tattoos match your search.',
      style: 'text-align: center; padding: 2rem; color: var(--poe-text-dim);'
    });
    container.appendChild(noResultsMessage);
    return;
  }
  
  // Group tattoos by attribute
  const groupedTattoos = groupTattoosByAttribute(items);
  
  // Define attribute order: Dexterity, Intelligence, Strength
  const attributeOrder = ['Dexterity', 'Intelligence', 'Strength'];
  
  // Render each attribute container
  for (const attribute of attributeOrder) {
    const tattoos = groupedTattoos[attribute];
    
    if (tattoos.length === 0) {
      continue; // Skip empty attribute groups
    }
    
    // Create attribute container
    const attributeContainer = createElement('div', {
      className: 'tattoo-attribute-container'
    });
    
    // Create attribute heading
    const attributeHeading = createElement('div', {
      className: 'tattoo-attribute-heading'
    });
    const headingText = createElement('h2', {
      textContent: `${attribute.toUpperCase()} TATTOOS`,
      className: 'tattoo-attribute-title'
    });
    attributeHeading.appendChild(headingText);
    attributeContainer.appendChild(attributeHeading);
    
    // Create grid container for tattoos (5 per line)
    const gridContainer = createElement('div', {
      className: 'tattoo-grid-container'
    });
    
    // Render each tattoo as a card
    const tattooPromises = tattoos.map(tattoo => renderTattooCard(gridContainer, tattoo, categoryId));
    await Promise.all(tattooPromises);
    
    attributeContainer.appendChild(gridContainer);
    container.appendChild(attributeContainer);
  }
}

/**
 * Render a single tattoo card
 * @param {HTMLElement} container - Container to append card to
 * @param {Object} tattoo - Tattoo item object
 * @param {string} categoryId - Category identifier
 */
async function renderTattooCard(container, tattoo, categoryId) {
  // Create card element
  const card = createElement('div', {
    className: 'tattoo-card'
  });
  
  // Create link wrapper for clickable card
  const cardLink = createElement('a', {
    href: `#/category/${categoryId}/item/${tattoo.id}`,
    className: 'tattoo-card-link'
  });
  
  // Create icon container
  const iconContainer = createElement('div', {
    className: 'tattoo-card-icon-container'
  });
  
  // Load and display icon
  try {
    const icon = await loadItemIcon(tattoo, categoryId);
    const iconImg = createElement('img', {
      className: 'tattoo-card-icon',
      src: icon.src,
      alt: tattoo.name || tattoo.id,
      onerror: function() {
        // Fallback if image fails to display
        this.src = getIconUrl(tattoo, categoryId);
        this.onerror = null; // Prevent infinite loop
      }
    });
    iconContainer.appendChild(iconImg);
  } catch (error) {
    // Use placeholder if icon loading fails
    const placeholderImg = createElement('img', {
      className: 'tattoo-card-icon',
      src: getIconUrl(tattoo, categoryId),
      alt: tattoo.name || tattoo.id
    });
    iconContainer.appendChild(placeholderImg);
  }
  
  // Create name container
  const nameContainer = createElement('div', {
    className: 'tattoo-card-name-container'
  });
  
  // Display name or fallback to item ID
  const itemName = createElement('span', {
    className: 'tattoo-card-name',
    textContent: tattoo.name || tattoo.id || 'Unknown Tattoo'
  });
  nameContainer.appendChild(itemName);
  
  // Assemble card
  cardLink.appendChild(iconContainer);
  cardLink.appendChild(nameContainer);
  card.appendChild(cardLink);
  
  // Add tooltip event handlers
  card.addEventListener('mouseenter', (e) => {
    showTooltip(tattoo, e.clientX, e.clientY, categoryId);
  });
  
  card.addEventListener('mousemove', (e) => {
    updateTooltipPosition(e.clientX, e.clientY);
  });
  
  card.addEventListener('mouseleave', () => {
    hideTooltip();
  });
  
  container.appendChild(card);
}

/**
 * Render runegrafts view with grid layout (similar to tattoos but without attribute grouping)
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} items - Array of runegraft items
 * @param {string} categoryId - Category identifier
 */
async function renderRunegraftsView(container, items, categoryId) {
  // Show message if no runegrafts match filter
  if (items.length === 0) {
    const noResultsMessage = createElement('div', {
      className: 'tattoos-no-results',
      textContent: 'No runegrafts match your search.',
      style: 'text-align: center; padding: 2rem; color: var(--poe-text-dim);'
    });
    container.appendChild(noResultsMessage);
    return;
  }
  
  // Create grid container for runegrafts (4 per line for wider cards)
  const gridContainer = createElement('div', {
    className: 'runegraft-grid-container'
  });
  
  // Render each runegraft as a card
  const runegraftPromises = items.map(runegraft => renderTattooCard(gridContainer, runegraft, categoryId));
  await Promise.all(runegraftPromises);
  
  container.appendChild(gridContainer);
}

/**
 * Render empty state message
 * @param {HTMLElement} container - Container to render into
 * @param {string} categoryId - Category identifier
 */
function renderEmptyState(container, categoryId) {
  const emptyState = createElement('div', {
    className: 'list-view-empty-state'
  });
  
  const emptyTitle = createElement('h2', {
    textContent: 'No Items Found'
  });
  
  const emptyMessage = createElement('p', {
    textContent: 'This category currently has no items.'
  });
  
  const submitLink = createElement('a', {
    href: `#/submit/${categoryId}`,
    textContent: 'Submit the First Item',
    className: 'primary-link'
  });
  
  emptyState.appendChild(emptyTitle);
  emptyState.appendChild(emptyMessage);
  emptyState.appendChild(submitLink);
  
  container.appendChild(emptyState);
}
