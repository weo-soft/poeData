/**
 * Global navigation component - Top navigation bar
 */

import { createElement } from '../utils/dom.js';
import { getAvailableCategories } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';

let categoriesCache = null;

/**
 * Create and render the global navigation bar
 * @returns {Promise<HTMLElement>} Navigation element
 */
export async function createNavigation() {
  const nav = createElement('nav', { className: 'global-nav' });
  const navList = createElement('ul', { className: 'nav-list' });
  
  // Home link
  const homeItem = createElement('li');
  const homeLink = createElement('a', {
    href: '#/',
    textContent: 'Home',
    className: 'nav-link'
  });
  homeItem.appendChild(homeLink);
  
  // Categories dropdown
  const categoriesItem = createElement('li', { className: 'nav-item-dropdown' });
  const categoriesButton = createElement('button', {
    className: 'nav-link dropdown-toggle',
    type: 'button',
    'aria-haspopup': 'true',
    'aria-expanded': 'false'
  });
  const categoriesButtonText = createElement('span', { 
    className: 'dropdown-toggle-text',
    textContent: 'Categories'
  });
  categoriesButton.appendChild(categoriesButtonText);
  
  const dropdownMenu = createElement('ul', { className: 'dropdown-menu' });
  
  try {
    const categories = await getAvailableCategories();
    categoriesCache = categories;
    
    if (categories.length === 0) {
      const emptyItem = createElement('li', { className: 'dropdown-item empty' });
      emptyItem.textContent = 'No categories available';
      dropdownMenu.appendChild(emptyItem);
    } else {
      categories.forEach(category => {
        const menuItem = createElement('li', { className: 'dropdown-item' });
        const categoryLink = createElement('a', {
          href: `#/category/${category.id}`,
          textContent: category.name,
          className: 'dropdown-link',
          'data-category-id': category.id
        });
        // Close dropdown when category link is clicked
        categoryLink.addEventListener('click', () => {
          categoriesButton.setAttribute('aria-expanded', 'false');
          dropdownMenu.classList.remove('show');
        });
        menuItem.appendChild(categoryLink);
        dropdownMenu.appendChild(menuItem);
      });
    }
  } catch (error) {
    const errorItem = createElement('li', { className: 'dropdown-item error' });
    displayError(errorItem, `Failed to load categories: ${error.message}`);
    dropdownMenu.appendChild(errorItem);
  }
  
  // Dropdown toggle functionality
  categoriesButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isExpanded = categoriesButton.getAttribute('aria-expanded') === 'true';
    categoriesButton.setAttribute('aria-expanded', !isExpanded);
    dropdownMenu.classList.toggle('show', !isExpanded);
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!categoriesItem.contains(e.target)) {
      categoriesButton.setAttribute('aria-expanded', 'false');
      dropdownMenu.classList.remove('show');
    }
  });
  
  categoriesItem.appendChild(categoriesButton);
  categoriesItem.appendChild(dropdownMenu);
  
  // Contributions link
  const contributeItem = createElement('li');
  const contributeLink = createElement('a', {
    href: '#/contributions',
    textContent: 'Contribute',
    className: 'nav-link'
  });
  contributeItem.appendChild(contributeLink);
  
  // Submit link
  const submitItem = createElement('li');
  const submitLink = createElement('a', {
    href: '#/submit',
    textContent: 'Submit',
    className: 'nav-link'
  });
  submitItem.appendChild(submitLink);
  
  navList.appendChild(homeItem);
  navList.appendChild(categoriesItem);
  navList.appendChild(contributeItem);
  navList.appendChild(submitItem);
  nav.appendChild(navList);
  
  // Store dropdown menu reference for active link updates
  nav._dropdownMenu = dropdownMenu;
  
  // Update active link based on current route
  updateActiveLink(nav);
  
  return nav;
}

/**
 * Update the active navigation link based on current route
 * @param {HTMLElement} nav - Navigation element
 */
export function updateActiveLink(nav) {
  const currentHash = window.location.hash || '#/';
  const links = nav.querySelectorAll('.nav-link:not(.dropdown-toggle)');
  
  links.forEach(link => {
    link.classList.remove('active');
    const linkHash = link.getAttribute('href');
    
    // Check if current route matches this link
    if (linkHash === '#/' && currentHash === '#/') {
      // Exact match for home
      link.classList.add('active');
    } else if (linkHash === '#/contributions' && currentHash.startsWith('#/contributions')) {
      // Match contributions and contributions/:categoryId
      link.classList.add('active');
    } else if (linkHash === '#/submit' && currentHash.startsWith('#/submit')) {
      // Match submit and submit/:categoryId
      link.classList.add('active');
    }
  });
  
  // Update active category in dropdown
  updateActiveCategoryLink(nav);
}

/**
 * Update the active category link in the dropdown menu
 * @param {HTMLElement} nav - Navigation element
 */
export function updateActiveCategoryLink(nav) {
  const currentHash = window.location.hash || '#/';
  const dropdownMenu = nav._dropdownMenu;
  
  if (!dropdownMenu) return;
  
  const categoryLinks = dropdownMenu.querySelectorAll('.dropdown-link');
  
  categoryLinks.forEach(link => {
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

