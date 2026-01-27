/**
 * List view renderer for displaying items in a simple list format
 * Shows item name and icon, with clickable items that navigate to detail view
 */

import { createElement, clearElement } from '../utils/dom.js';
import { loadItemIcon, getIconUrl } from '../utils/iconLoader.js';
import { showTooltip, hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';
import { highlightGridItem } from './stashTabRenderer.js';

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
  
  // Special handling for contracts
  if (categoryId === 'contracts') {
    await renderContractsView(container, items, categoryId);
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
  
  // Add jobs for contracts
  if (categoryId === 'contracts' && tattoo.jobs && Array.isArray(tattoo.jobs) && tattoo.jobs.length > 0) {
    const jobsContainer = createElement('div', {
      className: 'contract-card-jobs'
    });
    tattoo.jobs.forEach(job => {
      // Handle both old format (string) and new format (object with name and id)
      const jobName = typeof job === 'string' ? job : job.name;
      const jobId = typeof job === 'string' ? job.toLowerCase().replace(/\s+/g, '-') : job.id;
      
      const jobItem = createElement('div', {
        className: 'contract-card-job'
      });
      
      // Add job icon
      const jobIcon = createElement('img', {
        className: 'contract-card-job-icon',
        src: `/assets/images/contracts/${jobId}-job.png`,
        alt: jobName,
        onerror: function() {
          // Hide icon if it fails to load
          this.style.display = 'none';
        }
      });
      
      // Add job name
      const jobNameSpan = createElement('span', {
        className: 'contract-card-job-name',
        textContent: jobName
      });
      
      jobItem.appendChild(jobIcon);
      jobItem.appendChild(jobNameSpan);
      jobsContainer.appendChild(jobItem);
    });
    nameContainer.appendChild(jobsContainer);
  }
  
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
 * Render contracts view with grid layout (similar to runegrafts)
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} items - Array of contract items
 * @param {string} categoryId - Category identifier
 */
async function renderContractsView(container, items, categoryId) {
  // Show message if no contracts match filter
  if (items.length === 0) {
    const noResultsMessage = createElement('div', {
      className: 'tattoos-no-results',
      textContent: 'No contracts match your search.',
      style: 'text-align: center; padding: 2rem; color: var(--poe-text-dim);'
    });
    container.appendChild(noResultsMessage);
    return;
  }
  
  // Create grid container for contracts (4 columns for wider cards)
  const gridContainer = createElement('div', {
    className: 'contract-grid-container'
  });
  
  // Render each contract as a card
  const contractPromises = items.map(contract => renderTattooCard(gridContainer, contract, categoryId));
  await Promise.all(contractPromises);
  
  container.appendChild(gridContainer);
}

/**
 * Filter contracts based on search query
 * @param {Array} contracts - Array of contract items
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered array of contracts
 */
export function filterContracts(contracts, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return contracts;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return contracts.filter(contract => {
    // Search in name
    if (contract.name && contract.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in description
    if (contract.description) {
      const cleanDescription = contract.description.replace(/<[^>]*>/g, '').toLowerCase();
      if (cleanDescription.includes(query)) {
        return true;
      }
    }
    
    // Search in helpText
    if (contract.helpText) {
      if (contract.helpText.toLowerCase().includes(query)) {
        return true;
      }
    }
    
    // Search in jobs (handle both string and object format)
    if (contract.jobs && Array.isArray(contract.jobs)) {
      for (const job of contract.jobs) {
        const jobName = typeof job === 'string' ? job : job.name;
        if (jobName && jobName.toLowerCase().includes(query)) {
          return true;
        }
      }
    }
    
    return false;
  });
}

/**
 * Format weight value for display in list view
 * @param {Object} item - Item object with dropWeight and/or dropWeightMle
 * @returns {string} Formatted weight string (e.g., "2.50%" or "N/A")
 */
export function formatWeightForDisplay(item) {
  const weight = item.dropWeight ?? item.dropWeightMle;
  if (weight === undefined) return 'N/A';
  return (weight * 100).toFixed(2) + '%';
}

/**
 * Create list view entry element
 * @param {Object} item - Item object
 * @param {string} categoryId - Category identifier
 * @returns {HTMLElement} List entry element
 */
export function createListViewEntry(item, categoryId) {
  const link = createElement('a', {
    href: `#/category/${categoryId}/item/${item.id}`,
    className: 'category-list-entry-link'
  });
  
  const entry = createElement('div', { className: 'category-list-entry' });
  
  const name = createElement('span', {
    className: 'category-list-entry-name',
    textContent: item.name || item.id || 'Unknown Item'
  });
  
  const weight = createElement('span', {
    className: 'category-list-entry-weight',
    textContent: formatWeightForDisplay(item)
  });
  
  entry.appendChild(name);
  entry.appendChild(weight);
  link.appendChild(entry);
  
  // Add tooltip event handlers (same as grid view)
  link.addEventListener('mouseenter', (e) => {
    showTooltip(item, e.clientX, e.clientY, categoryId);
    // Highlight corresponding item in grid view (fire and forget)
    highlightGridItem(item.id).catch(() => {
      // Ignore errors - highlighting is non-critical
    });
  });
  
  link.addEventListener('mousemove', (e) => {
    updateTooltipPosition(e.clientX, e.clientY);
  });
  
  link.addEventListener('mouseleave', () => {
    hideTooltip();
    // Clear highlight in grid view (fire and forget)
    highlightGridItem(null).catch(() => {
      // Ignore errors - highlighting is non-critical
    });
  });
  
  return link;
}

/**
 * Get weight value for sorting (Bayesian preferred, MLE fallback)
 * @param {Object} item - Item object with dropWeight and/or dropWeightMle
 * @returns {number} Weight value or -1 if not available (for sorting to end)
 */
function getWeightForSorting(item) {
  const weight = item.dropWeight ?? item.dropWeightMle;
  return weight !== undefined ? weight : -1;
}

/**
 * Sort items by weight descending (highest first)
 * @param {Array<Object>} items - Array of items
 * @returns {Array<Object>} Sorted items
 */
function sortByWeightDescending(items) {
  return [...items].sort((a, b) => {
    const weightA = getWeightForSorting(a);
    const weightB = getWeightForSorting(b);
    
    // Both have weights: sort descending
    if (weightA >= 0 && weightB >= 0) {
      return weightB - weightA;
    }
    
    // Only A has weight: A comes first
    if (weightA >= 0 && weightB < 0) {
      return -1;
    }
    
    // Only B has weight: B comes first
    if (weightA < 0 && weightB >= 0) {
      return 1;
    }
    
    // Neither has weight: maintain original order
    return 0;
  });
}

/**
 * Sort items by weight ascending (lowest first)
 * @param {Array<Object>} items - Array of items
 * @returns {Array<Object>} Sorted items
 */
function sortByWeightAscending(items) {
  return [...items].sort((a, b) => {
    const weightA = getWeightForSorting(a);
    const weightB = getWeightForSorting(b);
    
    // Both have weights: sort ascending
    if (weightA >= 0 && weightB >= 0) {
      return weightA - weightB;
    }
    
    // Only A has weight: A comes first
    if (weightA >= 0 && weightB < 0) {
      return -1;
    }
    
    // Only B has weight: B comes first
    if (weightA < 0 && weightB >= 0) {
      return 1;
    }
    
    // Neither has weight: maintain original order
    return 0;
  });
}

/**
 * Sort items by name A-Z
 * @param {Array<Object>} items - Array of items
 * @returns {Array<Object>} Sorted items
 */
function sortByNameAscending(items) {
  return [...items].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase();
    const nameB = (b.name || b.id || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort items by name Z-A
 * @param {Array<Object>} items - Array of items
 * @returns {Array<Object>} Sorted items
 */
function sortByNameDescending(items) {
  return [...items].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase();
    const nameB = (b.name || b.id || '').toLowerCase();
    return nameB.localeCompare(nameA);
  });
}

/**
 * Sort items based on sort option
 * @param {Array<Object>} items - Array of items
 * @param {string} sortOption - Sort option: 'weight-desc' | 'weight-asc' | 'name-asc' | 'name-desc'
 * @returns {Array<Object>} Sorted items
 */
function sortItems(items, sortOption) {
  switch (sortOption) {
    case 'weight-desc':
      return sortByWeightDescending(items);
    case 'weight-asc':
      return sortByWeightAscending(items);
    case 'name-asc':
      return sortByNameAscending(items);
    case 'name-desc':
      return sortByNameDescending(items);
    default:
      return sortByWeightDescending(items); // Default to weight descending
  }
}

/**
 * Create sortable header row for list view
 * @param {string} currentSort - Current sort option
 * @param {Function} onSortChange - Callback when sort changes
 * @returns {HTMLElement} Header row element
 */
function createSortableHeader(currentSort, onSortChange) {
  const headerRow = createElement('div', { className: 'category-list-header' });
  
  // Determine current sort state
  const isNameSort = currentSort.startsWith('name-');
  const isWeightSort = currentSort.startsWith('weight-');
  const isAscending = currentSort.endsWith('-asc');
  const isDescending = currentSort.endsWith('-desc');
  
  // Name header
  const nameHeader = createElement('div', {
    className: `category-list-header-name ${isNameSort ? 'active' : ''}`,
    textContent: 'Name'
  });
  
  // Add sort indicator to name header
  if (isNameSort) {
    const indicator = createElement('span', {
      className: 'sort-indicator',
      textContent: isAscending ? ' ↑' : ' ↓'
    });
    nameHeader.appendChild(indicator);
  }
  
  nameHeader.addEventListener('click', () => {
    // If already sorting by name, toggle direction; otherwise start with descending
    const newSort = isNameSort 
      ? (isAscending ? 'name-desc' : 'name-asc')
      : 'name-desc';
    onSortChange(newSort);
  });
  
  // Weight header
  const weightHeader = createElement('div', {
    className: `category-list-header-weight ${isWeightSort ? 'active' : ''}`,
    textContent: 'Weight'
  });
  
  // Add sort indicator to weight header
  if (isWeightSort) {
    const indicator = createElement('span', {
      className: 'sort-indicator',
      textContent: isAscending ? ' ↑' : ' ↓'
    });
    weightHeader.appendChild(indicator);
  }
  
  weightHeader.addEventListener('click', () => {
    // If already sorting by weight, toggle direction; otherwise start with descending
    const newSort = isWeightSort 
      ? (isAscending ? 'weight-desc' : 'weight-asc')
      : 'weight-desc';
    onSortChange(newSort);
  });
  
  headerRow.appendChild(nameHeader);
  headerRow.appendChild(weightHeader);
  
  return headerRow;
}

/**
 * Render list view with item names and weights for grid categories
 * @param {HTMLElement} container - Container element to render into
 * @param {Array<Object>} items - Array of item objects with name, id, dropWeight, dropWeightMle
 * @param {string} categoryId - Category identifier
 * @param {string} sortOption - Sort option: 'weight-desc' | 'weight-asc' | 'name-asc' | 'name-desc'
 * @param {Function} onSortChange - Optional callback when sort changes
 * @returns {Promise<void>} Resolves when rendering is complete
 */
export async function renderListViewWithWeights(container, items, categoryId, sortOption = 'weight-desc', onSortChange = null) {
  clearElement(container);
  
  if (!items || items.length === 0) {
    renderEmptyState(container, categoryId);
    return;
  }
  
  // Sort items based on sort option
  const sortedItems = sortItems(items, sortOption);
  
  const listView = createElement('div', { className: 'category-list-view' });
  
  // Create sort control if callback is provided
  if (onSortChange) {
    const sortWrapper = createElement('div', { className: 'category-list-sort-wrapper' });
    
    const sortSelect = createElement('select', { className: 'category-list-sort-select' });
    sortSelect.value = sortOption;
    
    const options = [
      { value: 'weight-desc', text: 'Weight (High to Low)' },
      { value: 'weight-asc', text: 'Weight (Low to High)' },
      { value: 'name-asc', text: 'Name (A-Z)' },
      { value: 'name-desc', text: 'Name (Z-A)' }
    ];
    
    for (const option of options) {
      const optionElement = createElement('option', {
        value: option.value,
        textContent: option.text
      });
      sortSelect.appendChild(optionElement);
    }
    
    sortSelect.addEventListener('change', (e) => {
      onSortChange(e.target.value);
    });
    
    sortWrapper.appendChild(sortSelect);
    listView.appendChild(sortWrapper);
    
    // Also add sortable header row for visual consistency
    const headerRow = createSortableHeader(sortOption, onSortChange);
    listView.appendChild(headerRow);
  }
  
  for (const item of sortedItems) {
    const entry = createListViewEntry(item, categoryId);
    listView.appendChild(entry);
  }
  
  container.appendChild(listView);
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
