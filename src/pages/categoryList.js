/**
 * Category list view component - Display all available categories with item counts
 */

import { createElement, clearElement } from '../utils/dom.js';
import { getAvailableCategories } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';

/**
 * Render category list
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderCategoryList(container) {
  clearElement(container);
  
  const listSection = createElement('section', { className: 'category-list' });
  
  const title = createElement('h1', { textContent: 'Item Categories' });
  listSection.appendChild(title);
  
  try {
    const categories = await getAvailableCategories();
    
    if (categories.length === 0) {
      const emptyMessage = createElement('p', { 
        textContent: 'No categories available.',
        className: 'empty-message'
      });
      listSection.appendChild(emptyMessage);
    } else {
      const categoriesGrid = createElement('div', { className: 'categories-grid' });
      
      categories.forEach(category => {
        const categoryCard = createElement('div', { className: 'category-card' });
        
        const categoryLink = createElement('a', {
          href: `#/category/${category.id}`,
          className: 'category-link'
        });
        
        const categoryName = createElement('h2', { textContent: category.name });
        const categoryDesc = createElement('p', { 
          textContent: category.description || '',
          className: 'category-description'
        });
        const itemCount = createElement('div', {
          textContent: `${category.itemCount} items`,
          className: 'item-count'
        });
        
        categoryLink.appendChild(categoryName);
        categoryLink.appendChild(categoryDesc);
        categoryLink.appendChild(itemCount);
        categoryCard.appendChild(categoryLink);
        categoriesGrid.appendChild(categoryCard);
      });
      
      listSection.appendChild(categoriesGrid);
    }
    
    // Navigation links
    const navLinks = createElement('div', { className: 'nav-links' });
    const backLink = createElement('a', {
      href: '#/',
      textContent: '← Back to Home',
      className: 'back-link'
    });
    const submitLink = createElement('a', {
      href: '#/submit',
      textContent: 'Submit Item Data →',
      className: 'primary-link'
    });
    navLinks.appendChild(backLink);
    navLinks.appendChild(submitLink);
    listSection.appendChild(navLinks);
    
  } catch (error) {
    displayError(listSection, `Failed to load categories: ${error.message}`);
  }
  
  container.appendChild(listSection);
}

