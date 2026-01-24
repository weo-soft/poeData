/**
 * Category list view component - Display all available categories with item counts
 */

import { createElement, clearElement } from '../utils/dom.js';

/**
 * Render category list
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderCategoryList(container) {
  clearElement(container);
  
  const listSection = createElement('section', { className: 'category-list' });
  
  const title = createElement('h1', { textContent: 'Item Categories' });
  listSection.appendChild(title);
  
  const description = createElement('p', {
    textContent: 'Select a category from the navigation menu to view items.',
    className: 'description'
  });
  listSection.appendChild(description);
  
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
  
  container.appendChild(listSection);
}

