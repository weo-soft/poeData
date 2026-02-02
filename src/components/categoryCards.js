/**
 * Category Cards component - Renders the grid of category links (shared by home and category view)
 */

import { createElement } from '../utils/dom.js';
import { getAvailableCategories, loadCategoryData } from '../services/dataLoader.js';
import { getIconUrl } from '../utils/iconLoader.js';

/**
 * Render category cards into a container (same cards as on home, reusable on category view)
 * @param {HTMLElement} container - Container element to append the category cards section into
 * @returns {Promise<void>}
 */
export async function renderCategoryCards(container) {
  const categoriesSection = createElement('div', { className: 'home-categories' });
  const categoriesGrid = createElement('div', { className: 'home-categories-grid' });

  try {
    const categories = await getAvailableCategories();

    for (const category of categories) {
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
