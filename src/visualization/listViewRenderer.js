/**
 * List view renderer for displaying items in a simple list format
 * Shows item name and icon, with clickable items that navigate to detail view
 */

import { createElement, clearElement } from '../utils/dom.js';
import { loadItemIcon, getIconUrl } from '../utils/iconLoader.js';

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
