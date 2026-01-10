/**
 * Global navigation component - Top navigation bar
 */

import { createElement } from '../utils/dom.js';

/**
 * Create and render the global navigation bar
 * @returns {HTMLElement} Navigation element
 */
export function createNavigation() {
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
  
  // Categories link
  const categoriesItem = createElement('li');
  const categoriesLink = createElement('a', {
    href: '#/categories',
    textContent: 'Categories',
    className: 'nav-link'
  });
  categoriesItem.appendChild(categoriesLink);
  
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
  navList.appendChild(submitItem);
  nav.appendChild(navList);
  
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
  const links = nav.querySelectorAll('.nav-link');
  
  links.forEach(link => {
    link.classList.remove('active');
    const linkHash = link.getAttribute('href');
    
    // Check if current route matches this link
    if (linkHash === '#/' && currentHash === '#/') {
      // Exact match for home
      link.classList.add('active');
    } else if (linkHash === '#/categories' && currentHash === '#/categories') {
      // Exact match for categories
      link.classList.add('active');
    } else if (linkHash === '#/submit' && currentHash.startsWith('#/submit')) {
      // Match submit and submit/:categoryId
      link.classList.add('active');
    }
  });
}

