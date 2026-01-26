/**
 * Category view component - Display items in stash tab-style visualization
 */

import { createElement, clearElement, setLoadingState } from '../utils/dom.js';
import { loadCategoryData, getAvailableCategories } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';
import { renderStashTab } from '../visualization/stashTabRenderer.js';
import { generateCategoryCharts } from '../visualization/chartGenerator.js';
import { renderDivinationCard } from '../visualization/divinationCardRenderer.js';
import { renderListView, filterTattoos, filterRunegrafts, filterContracts, renderListViewWithWeights } from '../visualization/listViewRenderer.js';
import { discoverDatasetsParallel, loadDataset } from '../services/datasetLoader.js';
import { renderDatasetList, sortDatasetsByPatch } from '../components/datasetList.js';
import { renderDatasetDetail } from '../components/datasetDetail.js';
import { renderWeightDisplay } from '../components/weightDisplay.js';
import { estimateItemWeights } from '../services/weightCalculator.js';
import { downloadDataset } from '../utils/download.js';
import { router } from '../services/router.js';
import { getCachedWeights, setCachedWeights } from '../services/weightCache.js';
import { showTooltip, hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';
import { loadContent } from '../services/contributionContentLoader.js';

let currentItems = [];
let currentCategoryId = null;
let filteredDivinationCards = null; // Store filtered cards for divination cards view

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
    
    // Update navbar with category title
    const navigation = document.querySelector('.global-nav');
    if (navigation) {
      const { setCategoryTitle } = await import('../components/navigation.js');
      setCategoryTitle(navigation, formatCategoryName(categoryId));
    }
    
    // Category header (without title, only back button if needed)
    const header = createElement('div', { className: 'category-header' });
    
    // Add back button when in datasets view
    if (viewType === 'datasets') {
      const backButton = createElement('button', {
        className: 'btn btn-secondary',
        textContent: '← Back'
      });
      backButton.addEventListener('click', () => {
        router.navigate(`/category/${categoryId}`);
      });
      header.appendChild(backButton);
    }
    
    // Only append header if it has content
    if (header.children.length > 0) {
      viewSection.appendChild(header);
    }
    
    // Only show tabs when NOT in datasets view
    if (viewType !== 'datasets') {
      // Tabs for Items/Datasets
      const tabsContainer = createElement('div', { className: 'category-tabs' });
      const itemsTab = createElement('button', {
        className: `tab-button ${viewType === 'items' ? 'active' : ''}`,
        textContent: 'Items',
        'data-tab': 'items'
      });
      
      itemsTab.addEventListener('click', () => {
        router.navigate(`/category/${categoryId}?view=items`);
      });
      
      tabsContainer.appendChild(itemsTab);
      
      // For breach category, show two separate dataset tabs
      if (categoryId === 'breach') {
        const subcategory = query.subcategory || 'breach-splinters';
        const splintersTab = createElement('button', {
          className: `tab-button ${viewType === 'datasets' && subcategory === 'breach-splinters' ? 'active' : ''}`,
          textContent: 'Breach Splinters Datasets',
          'data-tab': 'datasets-splinters'
        });
        const stonesTab = createElement('button', {
          className: `tab-button ${viewType === 'datasets' && subcategory === 'breachstones' ? 'active' : ''}`,
          textContent: 'BreachStones Datasets',
          'data-tab': 'datasets-stones'
        });
        
        splintersTab.addEventListener('click', () => {
          router.navigate(`/category/${categoryId}?view=datasets&subcategory=breach-splinters`);
        });
        
        stonesTab.addEventListener('click', () => {
          router.navigate(`/category/${categoryId}?view=datasets&subcategory=breachstones`);
        });
        
        tabsContainer.appendChild(splintersTab);
        tabsContainer.appendChild(stonesTab);
      } else if (categoryId === 'legion') {
        // For legion category, show two separate dataset tabs
        const subcategory = query.subcategory || 'legion-splinters';
        const splintersTab = createElement('button', {
          className: `tab-button ${viewType === 'datasets' && subcategory === 'legion-splinters' ? 'active' : ''}`,
          textContent: 'Legion Splinters Datasets',
          'data-tab': 'datasets-splinters'
        });
        const emblemsTab = createElement('button', {
          className: `tab-button ${viewType === 'datasets' && subcategory === 'legion-emblems' ? 'active' : ''}`,
          textContent: 'Legion Emblems Datasets',
          'data-tab': 'datasets-emblems'
        });
        
        splintersTab.addEventListener('click', () => {
          router.navigate(`/category/${categoryId}?view=datasets&subcategory=legion-splinters`);
        });
        
        emblemsTab.addEventListener('click', () => {
          router.navigate(`/category/${categoryId}?view=datasets&subcategory=legion-emblems`);
        });
        
        tabsContainer.appendChild(splintersTab);
        tabsContainer.appendChild(emblemsTab);
      } else {
        // For other categories, show single Datasets tab
        const datasetsTab = createElement('button', {
          className: `tab-button ${viewType === 'datasets' ? 'active' : ''}`,
          textContent: 'Datasets',
          'data-tab': 'datasets'
        });
        
        datasetsTab.addEventListener('click', () => {
          router.navigate(`/category/${categoryId}?view=datasets`);
        });
        
        tabsContainer.appendChild(datasetsTab);
      }
      
      viewSection.appendChild(tabsContainer);
    }
    
    // Content area
    const contentArea = createElement('div', { className: 'category-content' });
    viewSection.appendChild(contentArea);
    
    // Render based on view type
    if (viewType === 'datasets') {
      // For merged categories, use subcategory from query param
      let subcategory = categoryId;
      if (categoryId === 'breach') {
        subcategory = query.subcategory || 'breach-splinters';
      } else if (categoryId === 'legion') {
        subcategory = query.subcategory || 'legion-splinters';
      }
      await renderDatasetsView(contentArea, subcategory, categoryId);
    } else {
      await renderItemsView(contentArea, categoryId, items);
      
      // Add contribution guide section (only in items view)
      await renderContributionGuide(contentArea, categoryId);
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
    'tattoos',
    'runegrafts',
    'contracts'
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
 * Get category directory name from category ID
 * @param {string} categoryId - Category identifier
 * @returns {string} Directory name
 */
function getCategoryDirectory(categoryId) {
  // Map category IDs to directory names (matching dataLoader.js pattern)
  const categoryDirMap = {
    'scarabs': 'scarabs',
    'divination-cards': 'divinationCards',
    'breach-splinters': 'breachSplinter', // Note: singular "Splinter"
    'breachstones': 'breachstones',
    'catalysts': 'catalysts',
    'delirium-orbs': 'deliriumOrbs',
    'essences': 'essences',
    'fossils': 'fossils',
    'legion-emblems': 'legionEmblems',
    'legion-splinters': 'legionSplinters',
    'oils': 'oils',
    'tattoos': 'tattoos',
    'runegrafts': 'runegrafts',
    'contracts': 'contracts'
  };
  
  if (categoryDirMap[categoryId]) {
    return categoryDirMap[categoryId];
  }
  
  // Fallback: Convert kebab-case to camelCase
  const parts = categoryId.split('-');
  return parts.map((part, index) => {
    if (index === 0) {
      return part;
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');
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
    'tattoos': 'tattoos/tattos.json', // Note: filename is "tattos" not "tattoos"
    'runegrafts': 'runegrafts/runegrafts.json',
    'contracts': 'contracts/contracts.json'
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
 * Filter divination cards based on search query
 * @param {Array} items - Array of divination card items
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered array of items
 */
function filterDivinationCards(items, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return items;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return items.filter(card => {
    // Search in name
    if (card.name && card.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in flavour text
    if (card.flavourText) {
      // Remove HTML tags for searching
      const cleanFlavourText = card.flavourText.replace(/<[^>]*>/g, '').toLowerCase();
      if (cleanFlavourText.includes(query)) {
        return true;
      }
    }
    
    // Search in explicit modifiers text
    if (card.explicitModifiers && Array.isArray(card.explicitModifiers)) {
      const modifierText = card.explicitModifiers
        .map(m => m.text)
        .join(' ')
        .replace(/<[^>]*>/g, '')
        .toLowerCase();
      if (modifierText.includes(query)) {
        return true;
      }
    }
    
    // Search in drop areas
    if (card.dropAreas && Array.isArray(card.dropAreas)) {
      if (card.dropAreas.some(area => area.toLowerCase().includes(query))) {
        return true;
      }
    }
    
    // Search in drop monsters
    if (card.dropMonsters && Array.isArray(card.dropMonsters)) {
      if (card.dropMonsters.some(monster => monster.toLowerCase().includes(query))) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Generic filter function for items based on search query
 * Searches in name, description, id, and other common fields
 * @param {Array} items - Array of items
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered array of items
 */
function filterItems(items, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return items;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return items.filter(item => {
    // Search in name
    if (item.name && item.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in id
    if (item.id && item.id.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in description
    if (item.description) {
      const cleanDescription = item.description.replace(/<[^>]*>/g, '').toLowerCase();
      if (cleanDescription.includes(query)) {
        return true;
      }
    }
    
    // Search in explicit modifiers text
    if (item.explicitModifiers && Array.isArray(item.explicitModifiers)) {
      const modifierText = item.explicitModifiers
        .map(m => m.text || m)
        .join(' ')
        .replace(/<[^>]*>/g, '')
        .toLowerCase();
      if (modifierText.includes(query)) {
        return true;
      }
    }
    
    // Search in drop areas
    if (item.dropAreas && Array.isArray(item.dropAreas)) {
      if (item.dropAreas.some(area => area.toLowerCase().includes(query))) {
        return true;
      }
    }
    
    // Search in drop monsters
    if (item.dropMonsters && Array.isArray(item.dropMonsters)) {
      if (item.dropMonsters.some(monster => monster.toLowerCase().includes(query))) {
        return true;
      }
    }
    
    // Search in dropRequired
    if (item.dropRequired && item.dropRequired.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in type
    if (item.type && item.type.toLowerCase().includes(query)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Render grid of miniature divination cards
 * @param {HTMLElement} container - Container element to render into
 * @param {Array} items - Array of divination card items
 */
async function renderDivinationCardGrid(container, items) {
  // Clear container
  clearElement(container);
  
  // Show message if no cards match filter
  if (items.length === 0) {
    const noResultsMessage = createElement('div', {
      className: 'divination-cards-no-results',
      textContent: 'No cards match your search.',
      style: 'text-align: center; padding: 2rem; color: var(--poe-text-dim);'
    });
    container.appendChild(noResultsMessage);
    return;
  }
  
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
    
    // Add tooltip event handlers
    cardWrapper.addEventListener('mouseenter', (e) => {
      showTooltip(card, e.clientX, e.clientY, 'divination-cards');
    });
    
    cardWrapper.addEventListener('mousemove', (e) => {
      updateTooltipPosition(e.clientX, e.clientY);
    });
    
    cardWrapper.addEventListener('mouseleave', () => {
      hideTooltip();
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
      // Create header bar container (same style as tattoos/runegrafts)
      const headerBar = createElement('div', {
        className: 'tattoos-header-bar'
      });
      
      // JSON link
      const jsonLink = createElement('a', {
        href: `/data/${getCategoryFilename(categoryId)}`,
        textContent: 'View Raw JSON Data',
        className: 'json-link',
        target: '_blank'
      });
      
      // Search input
      const searchInput = createElement('input', {
        type: 'text',
        placeholder: 'Search cards by name, reward, flavour text, or drop location...',
        className: 'tattoos-search-input',
        id: 'divination-cards-search'
      });
      
      const searchLabel = createElement('label', {
        textContent: 'Filter / Search:',
        className: 'tattoos-search-label'
      });
      searchLabel.setAttribute('for', 'divination-cards-search');
      
      const searchWrapper = createElement('div', {
        className: 'tattoos-search-wrapper'
      });
      searchWrapper.appendChild(searchLabel);
      searchWrapper.appendChild(searchInput);
      
      headerBar.appendChild(jsonLink);
      headerBar.appendChild(searchWrapper);
      
      // Replace the JSON link that was added earlier
      const existingJsonLink = container.querySelector('.json-link');
      if (existingJsonLink) {
        existingJsonLink.remove();
      }
      
      // Initialize filtered cards with all items
      filteredDivinationCards = items;
      
      // Render divination card grid
      const cardsGrid = createElement('div', {
        className: 'divination-cards-grid',
        id: 'divination-cards-grid'
      });
      
      // Add header bar before grid
      container.insertBefore(headerBar, chartsContainer);
      container.insertBefore(cardsGrid, chartsContainer);
      
      // Initial render
      await renderDivinationCardGrid(cardsGrid, filteredDivinationCards);
      
      // Add search event listener
      let searchTimeout = null;
      searchInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        
        // Debounce search to avoid too many re-renders
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(async () => {
          filteredDivinationCards = filterDivinationCards(items, query);
          await renderDivinationCardGrid(cardsGrid, filteredDivinationCards);
        }, 150); // 150ms debounce
      });
    } else if (isNewCategory(categoryId)) {
      // Special handling for tattoos, runegrafts, and contracts - create header bar with JSON link and search
      if (categoryId === 'tattoos' || categoryId === 'runegrafts' || categoryId === 'contracts') {
        // Create header bar container
        const headerBar = createElement('div', {
          className: 'tattoos-header-bar'
        });
        
        // JSON link
        const jsonLink = createElement('a', {
          href: `/data/${getCategoryFilename(categoryId)}`,
          textContent: 'View Raw JSON Data',
          className: 'json-link',
          target: '_blank'
        });
        
        // Search input
        const placeholderText = categoryId === 'tattoos' 
          ? 'Search tattoos by name, description, attribute, or drop location...'
          : categoryId === 'runegrafts'
          ? 'Search runegrafts by name, description, or drop location...'
          : 'Search contracts by name or description...';
        const searchId = categoryId === 'tattoos' ? 'tattoos-search' : categoryId === 'runegrafts' ? 'runegrafts-search' : 'contracts-search';
        const searchInput = createElement('input', {
          type: 'text',
          placeholder: placeholderText,
          className: 'tattoos-search-input',
          id: searchId
        });
        
        const searchLabel = createElement('label', {
          textContent: 'Filter / Search:',
          className: 'tattoos-search-label'
        });
        searchLabel.setAttribute('for', searchId);
        
        const searchWrapper = createElement('div', {
          className: 'tattoos-search-wrapper'
        });
        searchWrapper.appendChild(searchLabel);
        searchWrapper.appendChild(searchInput);
        
        headerBar.appendChild(jsonLink);
        headerBar.appendChild(searchWrapper);
        
        // Replace the JSON link that was added earlier
        const existingJsonLink = container.querySelector('.json-link');
        if (existingJsonLink) {
          existingJsonLink.remove();
        }
        container.insertBefore(headerBar, chartsContainer);
        
        // Create list container
        const listContainer = createElement('div', {
          className: 'list-view-container',
          id: 'list-view-container'
        });
        container.insertBefore(listContainer, chartsContainer);
        
        // Store original items for filtering
        const originalItems = items;
        
        // Render function that can be called with filtered items
        const renderList = async (itemsToRender) => {
          clearElement(listContainer);
          await renderListView(listContainer, itemsToRender, categoryId);
        };
        
        // Initial render with all items
        await renderList(originalItems);
        
        // Add search event listener with debouncing
        let searchTimeout = null;
        searchInput.addEventListener('input', async (e) => {
          const query = e.target.value;
          
          // Debounce search to avoid too many re-renders
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }
          
          searchTimeout = setTimeout(async () => {
            let filteredItems;
            if (categoryId === 'tattoos') {
              filteredItems = filterTattoos(originalItems, query);
            } else if (categoryId === 'runegrafts') {
              filteredItems = filterRunegrafts(originalItems, query);
            } else if (categoryId === 'contracts') {
              filteredItems = filterContracts(originalItems, query);
            } else {
              filteredItems = originalItems;
            }
            await renderList(filteredItems);
          }, 150); // 150ms debounce
        });
      } else {
        // Render list view for other new categories
        const listContainer = createElement('div', {
          className: 'list-view-container',
          id: 'list-view-container'
        });
        container.insertBefore(listContainer, chartsContainer);
        await renderListView(listContainer, items, categoryId);
      }
    } else {
      // Render stash tab visualization for other categories with search/filter
      // Create header bar container (same style as tattoos/runegrafts)
      const headerBar = createElement('div', {
        className: 'tattoos-header-bar'
      });
      
      // JSON link
      const jsonLink = createElement('a', {
        href: `/data/${getCategoryFilename(categoryId)}`,
        textContent: 'View Raw JSON Data',
        className: 'json-link',
        target: '_blank'
      });
      
      // Search input
      const searchInput = createElement('input', {
        type: 'text',
        placeholder: `Search ${formatCategoryName(categoryId).toLowerCase()} by name, description, or other properties...`,
        className: 'tattoos-search-input',
        id: `category-search-${categoryId}`
      });
      
      const searchLabel = createElement('label', {
        textContent: 'Filter / Search:',
        className: 'tattoos-search-label'
      });
      searchLabel.setAttribute('for', `category-search-${categoryId}`);
      
      const searchWrapper = createElement('div', {
        className: 'tattoos-search-wrapper'
      });
      searchWrapper.appendChild(searchLabel);
      searchWrapper.appendChild(searchInput);
      
      headerBar.appendChild(jsonLink);
      headerBar.appendChild(searchWrapper);
      
      // Replace the JSON link that was added earlier
      const existingJsonLink = container.querySelector('.json-link');
      if (existingJsonLink) {
        existingJsonLink.remove();
      }
      
      // Create views container for grid + list layout
      const viewsContainer = createElement('div', { className: 'category-views-container' });
      const gridContainer = createElement('div', { className: 'category-grid-container' });
      const listContainer = createElement('div', { className: 'category-list-container' });
      
      // Create stash tab container
      const stashContainer = createElement('div', { 
        className: 'stash-tab-container',
        id: 'stash-tab-canvas-container'
      });
      const canvas = createElement('canvas', {
        id: 'stash-tab-canvas',
        className: 'stash-tab-canvas'
      });
      stashContainer.appendChild(canvas);
      
      // Assemble views container
      gridContainer.appendChild(stashContainer);
      viewsContainer.appendChild(gridContainer);
      viewsContainer.appendChild(listContainer);
      
      // Add header bar before views container
      container.insertBefore(headerBar, chartsContainer);
      container.insertBefore(viewsContainer, chartsContainer);
      
      // Store original items for filtering
      const originalItems = items;
      let filteredItems = items;
      let currentSortOption = 'weight-desc'; // Default sort: weight descending
      
      // Function to re-render list view with current sort
      const renderList = async () => {
        await renderListViewWithWeights(
          listContainer, 
          filteredItems, 
          categoryId, 
          currentSortOption,
          (newSortOption) => {
            currentSortOption = newSortOption;
            renderList();
          }
        );
      };
      
      // Initial render - both views
      await renderStashTab(canvas, filteredItems, categoryId);
      await renderList();
      
      // Add search event listener with debouncing
      let searchTimeout = null;
      searchInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        
        // Debounce search to avoid too many re-renders
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(async () => {
          filteredItems = filterItems(originalItems, query);
          
          // Create set of filtered item IDs for highlighting (only if query is not empty)
          const filteredItemIds = query.trim() === '' ? null : new Set(filteredItems.map(item => item.id));
          
          // Update both views
          await renderStashTab(canvas, originalItems, categoryId, filteredItemIds);
          await renderList();
        }, 150); // 150ms debounce
      });
    }
    generateCategoryCharts(chartsContainer, items, categoryId);
  }
}

/**
 * Render datasets view
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
async function renderDatasetsView(container, subcategoryId, mainCategoryId) {
  clearElement(container);
  
  // Use subcategoryId for data operations, but mainCategoryId for navigation
  const categoryId = subcategoryId;
  const navigationCategoryId = mainCategoryId || subcategoryId;
  
  console.log(`[CategoryView] Rendering datasets view for category: ${categoryId} (navigation: ${navigationCategoryId})`);
  
  // Create detail container (full width for weights display)
  const detailContainer = createElement('div', { className: 'datasets-detail-container datasets-detail-fullwidth' });
  
  // Show loading state initially (will be replaced with weights)
  const initialLoading = createElement('div', {
    className: 'loading',
    textContent: 'Calculating weights...'
  });
  detailContainer.appendChild(initialLoading);
  setLoadingState(initialLoading, true);
  
  container.appendChild(detailContainer);
  
  let selectedDatasetNumber = null;
  let calculatedWeights = null;
  let categoryItems = null;
  let allDatasets = null; // Store datasets for weight calculation
  let fullDatasetsForWeights = null; // Store full datasets for Bayesian calculation
  let datasetsOverlay = null; // Reference to overlay element
  
  /**
   * Load index.json data for a category
   * @param {string} categoryId - Category identifier
   * @returns {Promise<Object|null>} Index data or null if unavailable
   */
  const loadIndexData = async (categoryId) => {
    try {
      const dirName = getCategoryDirectory(categoryId);
      const basePaths = [
        `/data/${dirName}/dataset/`,
        `/data/${dirName}/datasets/`
      ];
      
      for (const basePath of basePaths) {
        try {
          const indexUrl = `${basePath}index.json`;
          const response = await fetch(indexUrl);
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return await response.json();
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`[CategoryView] Failed to load index.json for ${categoryId}:`, error);
      return null;
    }
  };
  
  /**
   * Create and show datasets overlay
   */
  const showDatasetsOverlay = async () => {
    // Remove existing overlay if present
    if (datasetsOverlay) {
      datasetsOverlay.remove();
    }
    
    if (!allDatasets || allDatasets.length === 0) {
      // No datasets available
      return;
    }
    
    // Create overlay backdrop
    const overlay = createElement('div', { className: 'datasets-overlay' });
    const backdrop = createElement('div', { className: 'datasets-overlay-backdrop' });
    const overlayContent = createElement('div', { className: 'datasets-overlay-content' });
    
    // Create header with close button
    const overlayHeader = createElement('div', { className: 'datasets-overlay-header' });
    const overlayTitle = createElement('h2', {
      textContent: 'Datasets',
      className: 'datasets-overlay-title'
    });
    const closeButton = createElement('button', {
      className: 'datasets-overlay-close',
      textContent: '×',
      title: 'Close'
    });
    
    closeButton.addEventListener('click', () => {
      overlay.remove();
      datasetsOverlay = null;
    });
    
    backdrop.addEventListener('click', () => {
      overlay.remove();
      datasetsOverlay = null;
    });
    
    overlayHeader.appendChild(overlayTitle);
    overlayHeader.appendChild(closeButton);
    overlayContent.appendChild(overlayHeader);
    
    // Create wrapper for sidebar and detail
    const overlayBody = createElement('div', { className: 'datasets-overlay-body' });
    
    // Create sidebar for dataset list
    const overlaySidebar = createElement('div', { className: 'datasets-overlay-sidebar' });
    const overlayListContainer = createElement('div', { className: 'datasets-overlay-list-container' });
    overlaySidebar.appendChild(overlayListContainer);
    
    // Create detail container
    const overlayDetailContainer = createElement('div', { className: 'datasets-overlay-detail-container' });
    
    overlayBody.appendChild(overlaySidebar);
    overlayBody.appendChild(overlayDetailContainer);
    overlayContent.appendChild(overlayBody);
    
    overlay.appendChild(backdrop);
    overlay.appendChild(overlayContent);
    document.body.appendChild(overlay);
    datasetsOverlay = overlay;
    
    // Track currently selected dataset in overlay
    let overlaySelectedDatasetNumber = null;
    
    // Handler for dataset selection in overlay
    const handleOverlayDatasetSelect = async (dataset) => {
      const datasetNumber = dataset.datasetNumber;
      
      // If same dataset is clicked, do nothing
      if (overlaySelectedDatasetNumber === datasetNumber) {
        return;
      }
      
      overlaySelectedDatasetNumber = datasetNumber;
      
      // Update active class in list
      overlayListContainer.querySelectorAll('.dataset-list-item').forEach((item) => {
        item.classList.remove('active');
        const itemDatasetNumber = parseInt(item.getAttribute('data-dataset-number'), 10);
        if (itemDatasetNumber === datasetNumber) {
          item.classList.add('active');
        }
      });
      
      // Clear and show loading
      clearElement(overlayDetailContainer);
      const detailLoading = createElement('div', {
        className: 'loading',
        textContent: 'Loading dataset details...'
      });
      overlayDetailContainer.appendChild(detailLoading);
      setLoadingState(detailLoading, true);
      
      try {
        // Load full dataset
        const fullDataset = await loadDataset(categoryId, datasetNumber);
        
        // Clear loading and render detail
        clearElement(overlayDetailContainer);
        
        // Render dataset detail in overlay (no back button needed)
        renderDatasetDetail(
          overlayDetailContainer,
          fullDataset,
          categoryId,
          null, // No back button in overlay
          async (dataset, categoryId) => {
            // Handle download (deprecated, kept for compatibility)
            try {
              await downloadDataset(categoryId, datasetNumber, dataset);
            } catch (error) {
              displayError(overlayDetailContainer, `Failed to download dataset: ${error.message}`);
            }
          },
          datasetNumber // Pass datasetNumber for download link
        );
      } catch (error) {
        clearElement(overlayDetailContainer);
        displayError(overlayDetailContainer, `Failed to load dataset: ${error.message}`);
      }
    };
    
    // Sort datasets by patch version (descending)
    const sortedDatasets = sortDatasetsByPatch(allDatasets);
    
    // Render dataset list in overlay sidebar (with direct download links)
    renderDatasetList(overlayListContainer, sortedDatasets, handleOverlayDatasetSelect, null, categoryId);
    
    // Automatically load and display the first dataset (highest patch version)
    if (sortedDatasets.length > 0) {
      const firstDataset = sortedDatasets[0];
      await handleOverlayDatasetSelect(firstDataset);
    }
  };
  
  // Function to show weights view
  const showWeightsView = async (datasetsForCalculation = null) => {
    try {
      clearElement(detailContainer);
      
      // Initialize variables that may be needed later
      let indexData = null;
      let normalizedDatasets = null;
      
      if (!calculatedWeights) {
        // Use provided datasets or discover if not provided
        const datasets = datasetsForCalculation || allDatasets || await discoverDatasetsParallel(categoryId);
        
        if (!datasets || datasets.length === 0) {
          const emptyState = createElement('div', {
            className: 'dataset-detail-empty',
            textContent: 'No datasets available for weight calculation'
          });
          detailContainer.appendChild(emptyState);
          return;
        }
        
        // Load index.json data for cache validation
        indexData = await loadIndexData(categoryId);
        
        // Normalize datasets to match index.json structure (number, filename)
        // discoverDatasetsParallel returns objects with datasetNumber, but cache expects number
        normalizedDatasets = datasets.map(ds => ({
          number: ds.datasetNumber,
          filename: ds.filename
        }));
        
        // Try to get cached weights first
        if (indexData) {
          const cachedWeights = await getCachedWeights(
            categoryId,
            normalizedDatasets,
            'mle',
            indexData
          );
          
          if (cachedWeights) {
            // Cache hit - use cached weights
            calculatedWeights = cachedWeights;
            // Still need to load category items and full datasets for display
            categoryItems = await loadCategoryData(categoryId);
            fullDatasetsForWeights = await Promise.all(
              datasets.map(ds => loadDataset(categoryId, ds.datasetNumber))
            );
            clearElement(detailContainer);
          }
        }
        
        // If no cached weights, calculate them
        if (!calculatedWeights) {
          // Load all full datasets
          const loadingDiv = createElement('div', {
            className: 'loading',
            textContent: 'Calculating weights...'
          });
          detailContainer.appendChild(loadingDiv);
          setLoadingState(loadingDiv, true);
          
          const fullDatasets = await Promise.all(
            datasets.map(ds => loadDataset(categoryId, ds.datasetNumber))
          );
          
          // Store full datasets for Bayesian calculation
          fullDatasetsForWeights = fullDatasets;
          
          // Calculate weights
          calculatedWeights = estimateItemWeights(fullDatasets);
          
          // Cache the calculated weights
          if (indexData) {
            await setCachedWeights(
              categoryId,
              normalizedDatasets,
              'mle',
              calculatedWeights,
              indexData
            );
          }
          
          // Load category items
          categoryItems = await loadCategoryData(categoryId);
          
          clearElement(detailContainer);
        }
      } else {
        // If calculatedWeights already exists, we still need indexData and normalizedDatasets
        // for Bayesian cache, so load them if not already available
        if (!indexData) {
          indexData = await loadIndexData(categoryId);
        }
        
        // Get normalized datasets from allDatasets if available
        if (!normalizedDatasets && allDatasets) {
          normalizedDatasets = allDatasets.map(ds => ({
            number: ds.datasetNumber,
            filename: ds.filename
          }));
        }
      }
      
      // Display weights with datasets for Bayesian toggle (use stored fullDatasetsForWeights)
      // Use navigationCategoryId for navigation purposes (main category, not subcategory)
      // Pass showDatasetsOverlay function so weightDisplay can add a button to open overlay
      const datasetsForDisplay = fullDatasetsForWeights || [];
      renderWeightDisplay(detailContainer, calculatedWeights, navigationCategoryId, categoryItems, {
        datasets: datasetsForDisplay,
        indexData: indexData, // Pass indexData for Bayesian cache (may be null)
        normalizedDatasets: normalizedDatasets, // Pass normalized datasets for Bayesian cache (may be null)
        onOpenDatasets: showDatasetsOverlay // Pass function to open datasets overlay
      });
    } catch (error) {
      clearElement(detailContainer);
      displayError(detailContainer, `Failed to calculate weights: ${error.message}`);
    }
  };
  
  // Function to handle dataset selection
  const handleDatasetSelect = async (dataset) => {
    const datasetNumber = dataset.datasetNumber;
    
    // Close overlay when dataset is selected
    if (datasetsOverlay) {
      datasetsOverlay.remove();
      datasetsOverlay = null;
    }
    
    selectedDatasetNumber = datasetNumber;
    
    // Clear and show loading
    clearElement(detailContainer);
    const detailLoading = createElement('div', {
      className: 'loading',
      textContent: 'Loading dataset details...'
    });
    detailContainer.appendChild(detailLoading);
    setLoadingState(detailLoading, true);
    
    try {
      // Load full dataset
      const fullDataset = await loadDataset(categoryId, datasetNumber);
      
      // Clear loading and render detail
      clearElement(detailContainer);
      
      // Render dataset detail inline (with back button to return to weights)
      renderDatasetDetail(
        detailContainer,
        fullDataset,
        categoryId,
        () => {
          // Back button handler - return to weights view
          selectedDatasetNumber = null;
          showWeightsView();
        },
        async (dataset, categoryId) => {
          // Handle download (deprecated, kept for compatibility)
          try {
            await downloadDataset(categoryId, datasetNumber, dataset);
          } catch (error) {
            displayError(detailContainer, `Failed to download dataset: ${error.message}`);
          }
        },
        datasetNumber // Pass datasetNumber for download link
      );
    } catch (error) {
      clearElement(detailContainer);
      displayError(detailContainer, `Failed to load dataset: ${error.message}`);
    }
  };
  
  try {
    // Discover datasets with timeout protection
    const discoveryPromise = discoverDatasetsParallel(categoryId);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Dataset discovery timeout')), 30000)
    );
    
    const datasets = await Promise.race([discoveryPromise, timeoutPromise]);
    allDatasets = datasets; // Store for weight calculation
    
    console.log(`[CategoryView] Discovered ${datasets ? datasets.length : 0} datasets for ${categoryId}`);
    
    // Handle empty datasets
    if (!datasets || datasets.length === 0) {
      console.warn(`[CategoryView] No datasets found for category: ${categoryId}`);
      clearElement(detailContainer);
      const emptyState = createElement('div', {
        className: 'dataset-detail-empty',
        textContent: 'No datasets available for weight calculation'
      });
      detailContainer.appendChild(emptyState);
      return;
    }
    
    // Calculate and display weights by default
    await showWeightsView(datasets);
  } catch (error) {
    clearElement(detailContainer);
    
    // Handle specific error types
    if (error.message.includes('timeout')) {
      displayError(detailContainer, 'Loading datasets took too long. Please try again.');
    } else {
      displayError(detailContainer, `Failed to load datasets: ${error.message}`);
    }
    
    // Add retry button
    const retryButton = createElement('button', {
      className: 'btn btn-primary',
      textContent: 'Retry',
      style: 'margin-top: 1rem;'
    });
    retryButton.addEventListener('click', () => {
      renderDatasetsView(container, categoryId, navigationCategoryId);
    });
    detailContainer.appendChild(retryButton);
  }
}

/**
 * Render contribution guide section in category view
 * @param {HTMLElement} container - Container element to render into
 * @param {string} categoryId - Category identifier
 * @returns {Promise<void>} Resolves when rendering is complete
 */
async function renderContributionGuide(container, categoryId) {
  try {
    // Load contribution content for this category
    const content = await loadContent(categoryId);
    
    // Get category name
    const categories = await getAvailableCategories();
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || categoryId;
    
    // Create contribution guide section
    const guideSection = createElement('div', { className: 'category-contribution-guide' });
    
    // Section header
    const guideHeader = createElement('div', { className: 'contribution-guide-header' });
    const guideTitle = createElement('h2', {
      textContent: `How to Contribute ${categoryName} Datasets`,
      className: 'contribution-guide-title'
    });
    guideHeader.appendChild(guideTitle);
    guideSection.appendChild(guideHeader);
    
    // Generic content banner (if using fallback)
    if (content.isGeneric) {
      const banner = createElement('div', { className: 'generic-content-banner' });
      const bannerText = createElement('p', {
        textContent: 'ℹ️ Viewing generic guidelines. Category-specific guidelines coming soon.',
        className: 'banner-text'
      });
      banner.appendChild(bannerText);
      guideSection.appendChild(banner);
    }
    
    // Content
    const contentSection = createElement('div', { className: 'contribution-content' });
    contentSection.innerHTML = content.html;
    guideSection.appendChild(contentSection);
    
    // Add link to submission form
    const submitLinkWrapper = createElement('div', { className: 'contribution-submit-link-wrapper' });
    const submitLink = createElement('a', {
      href: `#/submit/${categoryId}`,
      textContent: `Submit ${categoryName} Dataset →`,
      className: 'primary-link contribution-submit-link'
    });
    submitLinkWrapper.appendChild(submitLink);
    guideSection.appendChild(submitLinkWrapper);
    
    container.appendChild(guideSection);
  } catch (error) {
    // Silently fail - don't break the category view if contribution guide fails to load
    console.warn(`Failed to load contribution guide for ${categoryId}:`, error);
  }
}

/**
 * Get current items (for external access)
 * @returns {Array} Current items
 */
export function getCurrentItems() {
  return currentItems;
}

