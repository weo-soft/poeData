/**
 * Homepage component - Display welcome message and category overview
 */

import { createElement, clearElement } from '../utils/dom.js';
import { getAvailableCategories, loadCategoryData } from '../services/dataLoader.js';
import { getIconUrl } from '../utils/iconLoader.js';

/**
 * Render homepage
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderHome(container) {
  clearElement(container);
  
  // Create main structure
  const homeSection = createElement('section', { className: 'home' });
  
  // Create category cards section (above welcome title)
  const categoriesSection = createElement('div', { className: 'home-categories' });
  const categoriesGrid = createElement('div', { className: 'home-categories-grid' });
  
  try {
    // Load all categories
    const categories = await getAvailableCategories();
    
    // Create a card for each category
    for (const category of categories) {
      // Special handling for specific categories - use category-specific icons
      let iconSrc = null;
      if (category.id === 'divination-cards') {
        iconSrc = '/assets/images/divinationcards/divination-card-inventory-icon.png';
      } else if (category.id === 'breach') {
        // Use first breach splinter image
        iconSrc = '/assets/images/breachSplinters/splinter-of-chayula.png';
      } else if (category.id === 'legion') {
        // Use first legion splinter image
        iconSrc = '/assets/images/legionSplinters/timeless-eternal-empire-splinter.png';
      } else {
        // Get first item from category to use as representative icon
        let representativeItem = null;
        try {
          const items = await loadCategoryData(category.id);
          if (items && items.length > 0) {
            representativeItem = items[0];
            iconSrc = getIconUrl(representativeItem, category.id);
          }
        } catch (error) {
          console.warn(`Could not load representative item for category ${category.id}:`, error);
        }
      }
      
      // Create category card
      const categoryCard = createElement('div', { className: 'home-category-card' });
      const categoryLink = createElement('a', {
        href: `#/category/${category.id}`,
        className: 'home-category-link'
      });
      
      // Create icon container
      const iconContainer = createElement('div', { className: 'home-category-icon-container' });
      if (iconSrc) {
        const iconImg = createElement('img', {
          className: 'home-category-icon',
          src: iconSrc,
          alt: category.name,
          onerror: function() {
            // Hide icon if it fails to load
            this.style.display = 'none';
          }
        });
        iconContainer.appendChild(iconImg);
      }
      
      // Create category name
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
    console.error('Error loading categories for home page:', error);
  }
  
  categoriesSection.appendChild(categoriesGrid);
  homeSection.appendChild(categoriesSection);
  
  const welcomeTitle = createElement('h1', { textContent: 'Welcome to PoeData.dev' });
  const welcomeText = createElement('div', { className: 'welcome-text' });
  
  const paragraph1 = createElement('p', {
    textContent: 'PoeData.dev is a community-driven project dedicated to collecting and sharing data on item drop weightings and probabilities in Path of Exile.'
  });
  
  const paragraph2 = createElement('p', {
    textContent: 'The goal is to provide a consistent, transparent, and easy-to-use source of information for players, theorycrafters, and tool developers. By combining community contributions with structured data analysis.'
  });
  
  const paragraph3 = createElement('p', {
    textContent: 'Whether you\'re here to explore the data or help expand it, your participation helps make the project more accurate and valuable for everyone.'
  });
  
  welcomeText.appendChild(paragraph1);
  welcomeText.appendChild(paragraph2);
  welcomeText.appendChild(paragraph3);
  
  homeSection.appendChild(welcomeTitle);
  homeSection.appendChild(welcomeText);
  
  container.appendChild(homeSection);
}
