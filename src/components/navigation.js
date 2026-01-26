/**
 * Global navigation component - Top navigation bar
 */

import { createElement } from '../utils/dom.js';
import { getAvailableCategories } from '../services/dataLoader.js';
import { displayError } from '../utils/errors.js';
import { isMobileViewport } from '../utils/mobileUtils.js';

let categoriesCache = null;

/**
 * Create and render the global navigation bar
 * @returns {Promise<HTMLElement>} Navigation element
 */
export async function createNavigation() {
  const nav = createElement('nav', { className: 'global-nav' });
  const navContainer = createElement('div', { className: 'nav-container' });
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
  
  // Contact link
  const contactItem = createElement('li');
  const contactLink = createElement('a', {
    href: '#/contact',
    textContent: 'Contact',
    className: 'nav-link'
  });
  contactItem.appendChild(contactLink);
  
  navList.appendChild(homeItem);
  navList.appendChild(categoriesItem);
  navList.appendChild(contributeItem);
  navList.appendChild(submitItem);
  navList.appendChild(contactItem);
  
  // Hamburger menu button for mobile
  const hamburgerButton = createElement('button', {
    className: 'hamburger-menu',
    type: 'button',
    'aria-label': 'Toggle navigation menu',
    'aria-expanded': 'false',
    'aria-controls': 'mobile-menu-overlay'
  });
  
  // Hamburger icon (three lines)
  const hamburgerIcon = createElement('span', { className: 'hamburger-icon' });
  hamburgerIcon.innerHTML = '<span></span><span></span><span></span>';
  hamburgerButton.appendChild(hamburgerIcon);
  
  // Mobile menu overlay
  const mobileMenuOverlay = createElement('div', {
    className: 'mobile-menu-overlay',
    id: 'mobile-menu-overlay',
    'aria-hidden': 'true'
  });
  
  const mobileMenuBackdrop = createElement('div', {
    className: 'mobile-menu-backdrop'
  });
  
  const mobileMenuContent = createElement('div', {
    className: 'mobile-menu-content'
  });
  
  const mobileMenuList = createElement('ul', {
    className: 'mobile-menu-list'
  });
  
  // Copy navigation items to mobile menu
  const mobileHomeItem = createElement('li');
  const mobileHomeLink = createElement('a', {
    href: '#/',
    textContent: 'Home',
    className: 'mobile-nav-link'
  });
  mobileHomeItem.appendChild(mobileHomeLink);
  mobileMenuList.appendChild(mobileHomeItem);
  
  // Categories in mobile menu (accordion style)
  const mobileCategoriesItem = createElement('li', { className: 'mobile-nav-item' });
  const mobileCategoriesButton = createElement('button', {
    className: 'mobile-nav-link mobile-categories-toggle',
    type: 'button',
    textContent: 'Categories',
    'aria-expanded': 'false'
  });
  mobileCategoriesItem.appendChild(mobileCategoriesButton);
  
  const mobileCategoriesMenu = createElement('ul', {
    className: 'mobile-categories-menu'
  });
  
  // Copy category links to mobile menu
  dropdownMenu.querySelectorAll('.dropdown-link').forEach(link => {
    const mobileCategoryItem = createElement('li');
    const mobileCategoryLink = createElement('a', {
      href: link.getAttribute('href'),
      textContent: link.textContent,
      className: 'mobile-nav-link mobile-category-link',
      'data-category-id': link.getAttribute('data-category-id')
    });
    mobileCategoryItem.appendChild(mobileCategoryLink);
    mobileCategoriesMenu.appendChild(mobileCategoryItem);
  });
  
  mobileCategoriesItem.appendChild(mobileCategoriesMenu);
  mobileMenuList.appendChild(mobileCategoriesItem);
  
  // Contributions link
  const mobileContributeItem = createElement('li');
  const mobileContributeLink = createElement('a', {
    href: '#/contributions',
    textContent: 'Contribute',
    className: 'mobile-nav-link'
  });
  mobileContributeItem.appendChild(mobileContributeLink);
  mobileMenuList.appendChild(mobileContributeItem);
  
  // Submit link
  const mobileSubmitItem = createElement('li');
  const mobileSubmitLink = createElement('a', {
    href: '#/submit',
    textContent: 'Submit',
    className: 'mobile-nav-link'
  });
  mobileSubmitItem.appendChild(mobileSubmitLink);
  mobileMenuList.appendChild(mobileSubmitItem);
  
  // Contact link
  const mobileContactItem = createElement('li');
  const mobileContactLink = createElement('a', {
    href: '#/contact',
    textContent: 'Contact',
    className: 'mobile-nav-link'
  });
  mobileContactItem.appendChild(mobileContactLink);
  mobileMenuList.appendChild(mobileContactItem);
  
  mobileMenuContent.appendChild(mobileMenuList);
  mobileMenuOverlay.appendChild(mobileMenuBackdrop);
  mobileMenuOverlay.appendChild(mobileMenuContent);
  
  // Hamburger toggle functionality
  hamburgerButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';
    hamburgerButton.setAttribute('aria-expanded', !isExpanded);
    mobileMenuOverlay.setAttribute('aria-hidden', isExpanded);
    mobileMenuOverlay.classList.toggle('show', !isExpanded);
    document.body.style.overflow = !isExpanded ? 'hidden' : '';
  });
  
  // Close mobile menu when clicking backdrop
  mobileMenuBackdrop.addEventListener('click', () => {
    hamburgerButton.setAttribute('aria-expanded', 'false');
    mobileMenuOverlay.setAttribute('aria-hidden', 'true');
    mobileMenuOverlay.classList.remove('show');
    document.body.style.overflow = '';
  });
  
  // Close mobile menu when clicking a link
  mobileMenuList.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerButton.setAttribute('aria-expanded', 'false');
      mobileMenuOverlay.setAttribute('aria-hidden', 'true');
      mobileMenuOverlay.classList.remove('show');
      document.body.style.overflow = '';
    });
  });
  
  // Mobile categories toggle
  mobileCategoriesButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isExpanded = mobileCategoriesButton.getAttribute('aria-expanded') === 'true';
    mobileCategoriesButton.setAttribute('aria-expanded', !isExpanded);
    mobileCategoriesMenu.classList.toggle('show', !isExpanded);
  });
  
  // Category title (centered, initially hidden)
  const categoryTitle = createElement('h1', { 
    className: 'nav-category-title',
    style: 'display: none;'
  });
  
  // Right side spacer (to balance the layout)
  const navRight = createElement('div', { className: 'nav-right' });
  
  navContainer.appendChild(hamburgerButton);
  navContainer.appendChild(navList);
  navContainer.appendChild(categoryTitle);
  navContainer.appendChild(navRight);
  nav.appendChild(navContainer);
  nav.appendChild(mobileMenuOverlay);
  
  // Store references for updates
  nav._dropdownMenu = dropdownMenu;
  nav._categoryTitle = categoryTitle;
  nav._hamburgerButton = hamburgerButton;
  nav._mobileMenuOverlay = mobileMenuOverlay;
  
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
    } else if (linkHash === '#/contact' && currentHash.startsWith('#/contact')) {
      // Match contact
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

/**
 * Set the category title in the navbar
 * @param {HTMLElement} nav - Navigation element
 * @param {string} categoryName - Category name to display
 */
export function setCategoryTitle(nav, categoryName) {
  const categoryTitle = nav?._categoryTitle;
  if (categoryTitle) {
    categoryTitle.textContent = categoryName;
    categoryTitle.style.display = 'block';
  }
}

/**
 * Clear the category title from the navbar
 * @param {HTMLElement} nav - Navigation element
 */
export function clearCategoryTitle(nav) {
  const categoryTitle = nav?._categoryTitle;
  if (categoryTitle) {
    categoryTitle.textContent = '';
    categoryTitle.style.display = 'none';
  }
}

