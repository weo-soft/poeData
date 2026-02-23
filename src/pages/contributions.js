/**
 * Contribution guide page component
 * Displays contribution guidelines for datasets
 * 
 * This module provides the main page component for the contribution guide feature.
 * It supports two modes:
 * - Overview mode: Displays general contribution information
 * - Category-specific mode: Displays category-specific contribution guidelines
 * 
 * @module pages/contributions
 */

import { createElement, clearElement } from '../utils/dom.js';
import { displayError } from '../utils/errors.js';
import { loadContent } from '../services/contributionContentLoader.js';
import { getCategoryName } from '../services/dataLoader.js';

/**
 * Render contribution guide page
 * 
 * Renders either the overview page (when categoryId is null) or a category-specific
 * guide page. Handles loading states, error states with retry functionality, and
 * displays contribution guidelines with proper navigation.
 * 
 * @param {HTMLElement} container - Container element to render into
 * @param {string|null} [categoryId=null] - Category identifier, or null for overview
 * @returns {Promise<void>} Resolves when rendering is complete
 * @throws {Error} If content cannot be loaded
 * @example
 * // Render overview
 * await renderContributions(mainContent, null);
 * 
 * // Render category-specific guide
 * await renderContributions(mainContent, 'scarabs');
 */
export async function renderContributions(container, categoryId = null) {
  clearElement(container);
  
  const contributionsSection = createElement('section', { className: 'contributions' });
  
  // Show loading state
  const loadingDiv = createElement('div', {
    className: 'loading-message',
    textContent: 'Loading contribution guide...'
  });
  contributionsSection.appendChild(loadingDiv);
  container.appendChild(contributionsSection);
  
  try {
    if (categoryId === null) {
      // Overview mode
      await renderOverview(contributionsSection);
    } else {
      // Category-specific mode
      await renderCategoryGuide(contributionsSection, categoryId);
    }
  } catch (error) {
    clearElement(contributionsSection);
    const errorMessage = `Failed to load contribution guide: ${error.message}`;
    displayError(contributionsSection, errorMessage);
    
    // Add retry button
    const retryButton = createElement('button', {
      textContent: 'Retry',
      className: 'retry-button'
    });
    retryButton.addEventListener('click', () => {
      renderContributions(container, categoryId);
    });
    contributionsSection.appendChild(retryButton);
  }
}

/**
 * Render contribution guide overview
 * 
 * Displays the contribution guide overview page with:
 * - Generic contribution guidelines
 * - Navigation links to submission interface and other pages
 * 
 * @param {HTMLElement} container - Container element to render into
 * @returns {Promise<void>} Resolves when rendering is complete
 * @private
 */
async function renderOverview(container) {
  clearElement(container);
  
  const title = createElement('h1', { textContent: 'How to Contribute Datasets' });
  container.appendChild(title);
  
  // Load generic content
  const genericContent = await loadContent(null);
  
  // Overview section
  const overviewSection = createElement('div', { className: 'contribution-overview' });
  overviewSection.innerHTML = genericContent.html;
  container.appendChild(overviewSection);
  
  // Navigation links
  const navLinks = createElement('div', { className: 'nav-links' });
  
  const submitLink = createElement('a', {
    href: '#/submit',
    textContent: 'Submit Dataset →',
    className: 'primary-link'
  });
  navLinks.appendChild(submitLink);
  
  container.appendChild(navLinks);
}

/**
 * Render category-specific contribution guide
 * 
 * Displays category-specific contribution guidelines with:
 * - Breadcrumb navigation
 * - Category-specific content
 * - Navigation links to submission form and category view
 * 
 * @param {HTMLElement} container - Container element to render into
 * @param {string} categoryId - Category identifier
 * @returns {Promise<void>} Resolves when rendering is complete
 * @private
 */
async function renderCategoryGuide(container, categoryId) {
  clearElement(container);
  
  // Load category-specific content (throws if not available)
  const content = await loadContent(categoryId);
  
  const categoryName = getCategoryName(categoryId);
  
  // Breadcrumbs
  const breadcrumbs = createElement('nav', { className: 'breadcrumbs' });
  const breadcrumbList = createElement('ol', { className: 'breadcrumb-list' });
  
  const homeCrumb = createElement('li', { className: 'breadcrumb-item' });
  const homeLink = createElement('a', { href: '#/', textContent: 'Home' });
  homeCrumb.appendChild(homeLink);
  breadcrumbList.appendChild(homeCrumb);
  
  const contributionsCrumb = createElement('li', { className: 'breadcrumb-item' });
  const contributionsLink = createElement('a', { href: '#/contributions', textContent: 'Contribution Guide' });
  contributionsCrumb.appendChild(contributionsLink);
  breadcrumbList.appendChild(contributionsCrumb);
  
  const categoryCrumb = createElement('li', { className: 'breadcrumb-item active' });
  categoryCrumb.textContent = categoryName;
  breadcrumbList.appendChild(categoryCrumb);
  
  breadcrumbs.appendChild(breadcrumbList);
  container.appendChild(breadcrumbs);
  
  // Title
  const title = createElement('h1', { 
    textContent: `Contributing ${categoryName} Datasets`
  });
  container.appendChild(title);
  
  // Content
  const contentSection = createElement('div', { className: 'contribution-content' });
  contentSection.innerHTML = content.html;
  container.appendChild(contentSection);
  
  // Navigation links
  const navLinks = createElement('div', { className: 'nav-links' });
  
  const backLink = createElement('a', {
    href: '#/contributions',
    textContent: '← Back to Overview',
    className: 'back-link'
  });
  navLinks.appendChild(backLink);
  
  const submitLink = createElement('a', {
    href: `#/submit/${categoryId}`,
    textContent: `Submit ${categoryName} Dataset →`,
    className: 'primary-link'
  });
  navLinks.appendChild(submitLink);
  
  const categoryViewLink = createElement('a', {
    href: `#/category/${categoryId}`,
    textContent: `Browse ${categoryName}`,
    className: 'secondary-link'
  });
  navLinks.appendChild(categoryViewLink);
  
  container.appendChild(navLinks);
}
