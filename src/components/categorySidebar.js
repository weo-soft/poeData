/**
 * Category sidebar component - Left-aligned menu for categories
 */

import { createElement } from '../utils/dom.js';
import { getAvailableCategories } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';

let categoriesCache = null;

/**
 * Create and render the category sidebar
 * @returns {HTMLElement} Sidebar element
 */
export async function createCategorySidebar() {
  const sidebar = createElement('aside', { className: 'category-sidebar' });
  
  const sidebarHeader = createElement('div', { className: 'sidebar-header' });
  const sidebarTitle = createElement('h2', { 
    textContent: 'Categories',
    className: 'sidebar-title'
  });
  sidebarHeader.appendChild(sidebarTitle);
  sidebar.appendChild(sidebarHeader);
  
  const categoryMenu = createElement('nav', { className: 'category-menu' });
  const categoryList = createElement('ul', { className: 'category-menu-list' });
  
  try {
    const categories = await getAvailableCategories();
    categoriesCache = categories;
    
    if (categories.length === 0) {
      const emptyMessage = createElement('li', {
        textContent: 'No categories available',
        className: 'category-menu-item empty'
      });
      categoryList.appendChild(emptyMessage);
    } else {
      categories.forEach(category => {
        const menuItem = createElement('li', { className: 'category-menu-item' });
        const categoryLink = createElement('a', {
          href: `#/category/${category.id}`,
          textContent: category.name,
          className: 'category-menu-link',
          'data-category-id': category.id
        });
        
        menuItem.appendChild(categoryLink);
        categoryList.appendChild(menuItem);
      });
    }
    
    categoryMenu.appendChild(categoryList);
    sidebar.appendChild(categoryMenu);
    
  } catch (error) {
    const errorItem = createElement('li', {
      className: 'category-menu-item error'
    });
    displayError(errorItem, `Failed to load categories: ${error.message}`);
    categoryList.appendChild(errorItem);
    categoryMenu.appendChild(categoryList);
    sidebar.appendChild(categoryMenu);
  }
  
  // Update active link based on current route
  updateActiveCategoryLink(sidebar);
  
  return sidebar;
}

/**
 * Update the active category link based on current route
 * @param {HTMLElement} sidebar - Sidebar element
 */
export function updateActiveCategoryLink(sidebar) {
  const currentHash = window.location.hash || '#/';
  const links = sidebar.querySelectorAll('.category-menu-link');
  
  links.forEach(link => {
    link.classList.remove('active');
    const linkHash = link.getAttribute('href');
    
    // Check if current route matches this category link
    if (currentHash.startsWith(linkHash)) {
      link.classList.add('active');
    }
  });
}

/**
 * Get cached categories (if available)
 * @returns {Array|null} Cached categories array or null
 */
export function getCachedCategories() {
  return categoriesCache;
}
