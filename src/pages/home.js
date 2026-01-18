/**
 * Homepage component - Display welcome message and category overview
 */

import { createElement, clearElement } from '../utils/dom.js';

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
  
  // Navigation links
  const navLinks = createElement('div', { className: 'nav-links' });
  const submitLink = createElement('a', {
    href: '#/submit',
    textContent: 'Submit Item Data →',
    className: 'primary-link'
  });
  navLinks.appendChild(submitLink);
  
  homeSection.appendChild(navLinks);
  
  container.appendChild(homeSection);
}

