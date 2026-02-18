/**
 * Category Cards component - Renders the grid of category links (shared by home and category view)
 */

import { createElement } from '../utils/dom.js';
import { getAvailableCategories, loadCategoryData } from '../services/dataLoader.js';
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

export async function renderCategoryCards(container) {
  const categoriesSection = createElement('div', { className: 'home-categories' });
  const categoriesGrid = createElement('div', { className: 'home-categories-grid' });

  try {
    const categories = await getAvailableCategories();
    const datasetCounts = await Promise.all(categories.map(c => getDatasetCountForCategory(c.id)));

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const datasetCount = datasetCounts[i];

      let iconSrc = null;
      if (category.id === 'divination-cards') {
        iconSrc = '/assets/images/divinationcards/divination-card-inventory-icon.png';
      } else if (category.id === 'breach') {
        iconSrc = '/assets/images/breachSplinters/splinter-of-chayula.png';
      } else if (category.id === 'legion') {
        iconSrc = '/assets/images/legionSplinters/timeless-eternal-empire-splinter.png';
      } else {
        try {
          const items = await loadCategoryData(category.id);
          if (items && items.length > 0) {
            iconSrc = getIconUrl(items[0], category.id);
          }
        } catch (error) {
          console.warn(`Could not load representative item for category ${category.id}:`, error);
        }
      }

      const categoryCard = createElement('div', { className: 'home-category-card' });

      // Contracts: per input item → low confidence. Legion: joint category, only Splinters have datasets → low confidence
      const isLowConfidence = category.id === 'contracts' || category.id === 'legion' ||
        (datasetCount > 0 && datasetCount <= LOW_CONFIDENCE_DATASET_THRESHOLD);

      if (category.id === 'legion') {
        categoryCard.appendChild(createConfidenceIcon('low',
          'Low confidence: weight estimates are available for Legion Splinters only; no data for Legion Emblems.'));
      } else if (datasetCount === 0) {
        categoryCard.appendChild(createConfidenceIcon('none',
          'No data: this category has no datasets, so no calculated weights are available.'));
      } else if (isLowConfidence) {
        const lowDetail = category.id === 'contracts'
          ? 'Weights are per contract type with limited data per type.'
          : `Based on ${datasetCount} dataset${datasetCount === 1 ? '' : 's'}.`;
        categoryCard.appendChild(createConfidenceIcon('low',
          `Low confidence: weight estimates may be less reliable. ${lowDetail}`));
      }

      const categoryLink = createElement('a', {
        href: `#/category/${category.id}`,
        className: 'home-category-link'
      });

      const iconContainer = createElement('div', { className: 'home-category-icon-container' });
      if (iconSrc) {
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

      const categoryName = createElement('span', {
        className: 'home-category-name',
        textContent: category.name
      });

      categoryLink.appendChild(iconContainer);
      categoryLink.appendChild(categoryName);
      categoryCard.appendChild(categoryLink);
      categoriesGrid.appendChild(categoryCard);
    }
  } catch (error) {
    console.error('Error loading categories for category cards:', error);
  }

  categoriesSection.appendChild(categoriesGrid);
  container.appendChild(categoriesSection);
}
