/**
 * Homepage component - Display welcome message and category overview
 */

import { createElement, clearElement } from '../utils/dom.js';
import { getAvailableCategories } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';

/**
 * Render homepage
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderHome(container) {
  clearElement(container);
  
  // Create main structure
  const homeSection = createElement('section', { className: 'home' });
  
  const title = createElement('h1', { textContent: 'Path of Exile Item Data Browser' });
  const description = createElement('p', { 
    textContent: 'Browse item categories, view detailed information, and explore Path of Exile item data with in-game style visualizations.',
    className: 'description'
  });
  
  homeSection.appendChild(title);
  homeSection.appendChild(description);
  
  // Load and display categories
  try {
    const categories = await getAvailableCategories();
    
    const categoriesSection = createElement('div', { className: 'categories-preview' });
    const categoriesTitle = createElement('h2', { textContent: 'Available Categories' });
    categoriesSection.appendChild(categoriesTitle);
    
    const categoriesList = createElement('div', { className: 'categories-grid' });
    
    categories.forEach(category => {
      const categoryCard = createElement('div', { className: 'category-card' });
      const categoryLink = createElement('a', { 
        href: `#/category/${category.id}`,
        className: 'category-link'
      });
      
      const categoryName = createElement('h3', { textContent: category.name });
      const categoryDesc = createElement('p', { textContent: category.description || '' });
      const itemCount = createElement('span', { 
        textContent: `${category.itemCount} items`,
        className: 'item-count'
      });
      
      categoryLink.appendChild(categoryName);
      categoryLink.appendChild(categoryDesc);
      categoryLink.appendChild(itemCount);
      categoryCard.appendChild(categoryLink);
      categoriesList.appendChild(categoryCard);
    });
    
    categoriesSection.appendChild(categoriesList);
    
    // Navigation links
    const navLinks = createElement('div', { className: 'nav-links' });
    const viewAllLink = createElement('a', {
      href: '#/categories',
      textContent: 'View All Categories →',
      className: 'primary-link'
    });
    const submitLink = createElement('a', {
      href: '#/submit',
      textContent: 'Submit Item Data →',
      className: 'primary-link'
    });
    navLinks.appendChild(viewAllLink);
    navLinks.appendChild(submitLink);
    
    homeSection.appendChild(categoriesSection);
    homeSection.appendChild(navLinks);
    
  } catch (error) {
    displayError(homeSection, `Failed to load categories: ${error.message}`);
  }
  
  container.appendChild(homeSection);
}

