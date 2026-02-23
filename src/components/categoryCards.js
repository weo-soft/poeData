/**
 * Category Cards component - Renders the grid of category links (shared by home and category view)
 * Renders immediately from static list; icons and confidence badges load lazily per category.
 */

import { createElement } from '../utils/dom.js';
import { getCategoryList, loadCategoryData } from '../services/dataLoader.js';
import { getDatasetCountForCategory } from '../services/datasetLoader.js';
import { getIconUrl } from '../utils/iconLoader.js';

/** Dataset count threshold below which we show "low confidence" (inclusive) */
const LOW_CONFIDENCE_DATASET_THRESHOLD = 2;

/**
 * Render category cards into a container (same cards as on home, reusable on category view)
 * @param {HTMLElement} container - Container element to append the category cards section into
 * @returns {Promise<void>}
 */
/**
 * Create inline SVG for confidence indicator
 * @param {string} kind - 'none' | 'low'
 * @param {string} title - Tooltip text
 * @returns {HTMLElement} Wrapper span with SVG
 */
function createConfidenceIcon(kind, title) {
  const wrapper = createElement('span', {
    className: `home-category-confidence home-category-confidence--${kind}`,
    title
  });
  wrapper.setAttribute('aria-label', title);
  if (kind === 'none') {
    // Circle with diagonal slash - no data
    wrapper.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
  } else {
    // Warning triangle - low confidence
    wrapper.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  }
  return wrapper;
}

/**
 * Load icon URL for a category (first item or known asset). Called lazily per card.
 */
async function loadCategoryIconSrc(category) {
  if (category.id === 'divination-cards') {
    return '/assets/images/divinationcards/divination-card-inventory-icon.png';
  }
  if (category.id === 'breach') {
    return '/assets/images/breachSplinters/splinter-of-chayula.png';
  }
  if (category.id === 'legion') {
    return '/assets/images/legionSplinters/timeless-eternal-empire-splinter.png';
  }
  try {
    const items = await loadCategoryData(category.id);
    if (items && items.length > 0) {
      return getIconUrl(items[0], category.id);
    }
  } catch (error) {
    console.warn(`Could not load representative item for category ${category.id}:`, error);
  }
  return null;
}

/**
 * Render confidence badge and icon for one card when lazy data is ready.
 */
function applyCardLazyData(card, category, datasetCount, iconSrc) {
  const existingBadge = card.querySelector('.home-category-confidence');
  if (existingBadge) existingBadge.remove();

  const isLowConfidence = category.id === 'contracts' || category.id === 'legion' ||
    (datasetCount > 0 && datasetCount <= LOW_CONFIDENCE_DATASET_THRESHOLD);

  if (category.id === 'legion') {
    card.insertBefore(createConfidenceIcon('low',
      'Low confidence: weight estimates are available for Legion Splinters only; no data for Legion Emblems.'), card.firstChild);
  } else if (datasetCount === 0) {
    card.insertBefore(createConfidenceIcon('none',
      'No data: this category has no datasets, so no calculated weights are available.'), card.firstChild);
  } else if (isLowConfidence) {
    const lowDetail = category.id === 'contracts'
      ? 'Weights are per contract type with limited data per type.'
      : `Based on ${datasetCount} dataset${datasetCount === 1 ? '' : 's'}.`;
    card.insertBefore(createConfidenceIcon('low',
      `Low confidence: weight estimates may be less reliable. ${lowDetail}`), card.firstChild);
  }

  const iconContainer = card.querySelector('.home-category-icon-container');
  if (iconContainer && iconSrc) {
    const iconImg = createElement('img', {
      className: 'home-category-icon',
      src: iconSrc,
      alt: category.name,
      onerror: function () {
        this.style.display = 'none';
      }
    });
    iconContainer.appendChild(iconImg);
  }
}

export function renderCategoryCards(container) {
  const categoriesSection = createElement('div', { className: 'home-categories' });
  const categoriesGrid = createElement('div', { className: 'home-categories-grid' });

  const categories = getCategoryList();

  for (const category of categories) {
    const categoryCard = createElement('div', { className: 'home-category-card' });

    const categoryLink = createElement('a', {
      href: `#/category/${category.id}`,
      className: 'home-category-link'
    });

    const iconContainer = createElement('div', { className: 'home-category-icon-container' });
    const categoryName = createElement('span', {
      className: 'home-category-name',
      textContent: category.name
    });

    categoryLink.appendChild(iconContainer);
    categoryLink.appendChild(categoryName);
    categoryCard.appendChild(categoryLink);
    categoriesGrid.appendChild(categoryCard);

    // Lazy-load icon and dataset count for this category (no await – don't block first paint)
    Promise.all([
      getDatasetCountForCategory(category.id),
      loadCategoryIconSrc(category)
    ]).then(([datasetCount, iconSrc]) => {
      if (categoryCard.isConnected) {
        applyCardLazyData(categoryCard, category, datasetCount, iconSrc);
      }
    }).catch(err => {
      console.warn(`Category card lazy load failed for ${category.id}:`, err);
    });
  }

  categoriesSection.appendChild(categoriesGrid);
  container.appendChild(categoriesSection);
}
