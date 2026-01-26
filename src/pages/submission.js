/**
 * Submission forms view component - Dataset submission functionality
 */

import { createElement, clearElement } from '../utils/dom.js';
import { displayError } from '../utils/errors.js';
import { DatasetSubmissionForm } from '../forms/datasetSubmissionForm.js';
import { FlexibleSubmissionDialog } from '../forms/flexibleSubmissionDialog.js';
import { getAvailableCategories, loadCategoryData } from '../services/dataLoader.js';

let currentForm = null;
let currentCategoryId = null;

/**
 * Render submission page
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} params - Route parameters
 * @param {string} [params.categoryId] - Category identifier (optional)
 */
export async function renderSubmission(container, params = {}) {
  clearElement(container);
  
  const categoryId = params.categoryId;
  currentCategoryId = categoryId;
  
  const submissionSection = createElement('section', { className: 'submission' });
  
  const title = createElement('h1', { textContent: 'Submit Item Data' });
  submissionSection.appendChild(title);
  
  // Add contribution guide link
  if (categoryId) {
    const guideLink = createElement('a', {
      href: `#/contributions/${categoryId}`,
      textContent: '📖 View Contribution Guidelines',
      className: 'contribution-guide-link',
      style: 'display: inline-block; margin-bottom: 1rem; color: var(--poe-accent); text-decoration: none;'
    });
    guideLink.addEventListener('mouseenter', () => {
      guideLink.style.textDecoration = 'underline';
    });
    guideLink.addEventListener('mouseleave', () => {
      guideLink.style.textDecoration = 'none';
    });
    submissionSection.appendChild(guideLink);
  } else {
    const guideLink = createElement('a', {
      href: '#/contributions',
      textContent: '📖 View Contribution Guidelines',
      className: 'contribution-guide-link',
      style: 'display: inline-block; margin-bottom: 1rem; color: var(--poe-accent); text-decoration: none;'
    });
    guideLink.addEventListener('mouseenter', () => {
      guideLink.style.textDecoration = 'underline';
    });
    guideLink.addEventListener('mouseleave', () => {
      guideLink.style.textDecoration = 'none';
    });
    submissionSection.appendChild(guideLink);
  }
  
  // Always show tabs for dataset submission and flexible submission
  const tabsContainer = createElement('div', { className: 'submission-tabs' });
  
  const datasetTab = createElement('button', {
    className: 'tab-button active',
    textContent: 'Dataset Submission',
    'data-tab': 'dataset'
  });
  datasetTab.addEventListener('click', () => switchTab('dataset', submissionSection));
  
  const flexibleTab = createElement('button', {
    className: 'tab-button',
    textContent: 'File/Link Submission',
    'data-tab': 'flexible',
    title: 'Submit dataset via file upload or link'
  });
  flexibleTab.addEventListener('click', () => {
    const dialog = new FlexibleSubmissionDialog();
    dialog.open();
  });
  
  tabsContainer.appendChild(datasetTab);
  tabsContainer.appendChild(flexibleTab);
  submissionSection.appendChild(tabsContainer);
  
  // Tab content container
  const tabContent = createElement('div', { className: 'tab-content', id: 'tab-content' });
  submissionSection.appendChild(tabContent);
  
  // Render dataset submission form by default (category selector will be inside the form)
  await renderDatasetSubmission(tabContent, categoryId);
  
  // Navigation
  const navLinks = createElement('div', { className: 'nav-links' });
  const backLink = createElement('a', {
    href: categoryId ? `#/category/${categoryId}` : '#/categories',
    textContent: '← Back',
    className: 'back-link'
  });
  navLinks.appendChild(backLink);
  submissionSection.appendChild(navLinks);
  
  container.appendChild(submissionSection);
}

/**
 * Create category selector
 * @param {string} [currentCategoryId] - Currently selected category ID (optional)
 * @returns {Promise<HTMLElement>} Category selector element
 */
async function createCategorySelector(currentCategoryId = null) {
  const selector = createElement('div', { className: 'category-selector' });
  
  const label = createElement('label', { 
    textContent: currentCategoryId ? 'Change Category:' : 'Select Category:',
    htmlFor: 'category-select'
  });
  selector.appendChild(label);
  
  const select = createElement('select', { id: 'category-select' });
  
  // Show loading state
  const loadingOption = createElement('option', {
    value: '',
    textContent: 'Loading categories...'
  });
  select.appendChild(loadingOption);
  selector.appendChild(select);
  
  try {
    // Load all available categories
    const categories = await getAvailableCategories();
    
    // Transform categories: replace combined categories with their subcategories for submissions
    const submissionCategories = [];
    categories.forEach(category => {
      if (category.id === 'breach') {
        // Replace 'breach' with its subcategories
        submissionCategories.push({
          id: 'breach-splinters',
          name: 'Breach Splinters',
          description: 'Breach splinters'
        });
        submissionCategories.push({
          id: 'breachstones',
          name: 'Breachstones',
          description: 'Breachstones'
        });
      } else if (category.id === 'legion') {
        // Replace 'legion' with its subcategories
        submissionCategories.push({
          id: 'legion-splinters',
          name: 'Legion Splinters',
          description: 'Legion splinters'
        });
        submissionCategories.push({
          id: 'legion-emblems',
          name: 'Legion Emblems',
          description: 'Legion emblems'
        });
      } else {
        // Keep other categories as-is
        submissionCategories.push(category);
      }
    });
    
    // Load item counts for subcategories
    for (const category of submissionCategories) {
      if (['breach-splinters', 'breachstones', 'legion-splinters', 'legion-emblems'].includes(category.id)) {
        try {
          const items = await loadCategoryData(category.id);
          category.itemCount = items.length;
        } catch (error) {
          console.warn(`Could not load item count for ${category.id}:`, error);
          category.itemCount = 0;
        }
      }
    }
    
    // Clear loading option
    clearElement(select);
    
    // Add default option (only if no category is currently selected)
    if (!currentCategoryId) {
      const defaultOption = createElement('option', {
        value: '',
        textContent: '-- Select a category --',
        disabled: true,
        selected: true
      });
      select.appendChild(defaultOption);
    }
    
    // Add all submission categories
    submissionCategories.forEach(category => {
      const option = createElement('option', {
        value: category.id,
        textContent: category.name,
        selected: category.id === currentCategoryId
      });
      select.appendChild(option);
    });
    
    // Add option to clear selection (go back to category selection)
    if (currentCategoryId) {
      const clearOption = createElement('option', {
        value: '',
        textContent: '-- Change category --'
      });
      select.insertBefore(clearOption, select.firstChild);
    }
    
    select.addEventListener('change', async (e) => {
      const selectedValue = e.target.value;
      
      // Check if form has entered values before changing category
      if (currentForm && currentForm.hasEnteredValues && currentForm.hasEnteredValues()) {
        const message = 'Warning: Changing the category will clear all entered values including:\n' +
          '• Name\n' +
          '• Description\n' +
          '• Sources\n' +
          '• Input items\n' +
          '• Output item counts\n\n' +
          'Do you want to continue?';
        const confirmed = window.confirm(message);
        
        if (!confirmed) {
          // Reset select to previous value
          select.value = currentCategoryId || '';
          return;
        }
      }
      
      if (selectedValue) {
        // Navigate to selected category
        window.location.hash = `#/submit/${selectedValue}`;
      } else if (currentCategoryId) {
        // Clear selection - go back to category selection page
        window.location.hash = '#/submit';
      }
    });
  } catch (error) {
    // Show error if categories can't be loaded
    clearElement(select);
    const errorOption = createElement('option', {
      value: '',
      textContent: 'Error loading categories',
      disabled: true
    });
    select.appendChild(errorOption);
    displayError(selector, `Failed to load categories: ${error.message}`);
  }
  
  return selector;
}

/**
 * Switch between tabs
 * @param {string} tabName - Tab name ('dataset')
 * @param {HTMLElement} container - Container element
 */
async function switchTab(tabName, container) {
  // Update tab buttons
  const tabButtons = container.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update tab content
  const tabContent = container.querySelector('#tab-content');
  clearElement(tabContent);
  
  if (tabName === 'dataset') {
    await renderDatasetSubmission(tabContent, currentCategoryId);
  }
}

/**
 * Render dataset submission form
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier (can be null)
 */
async function renderDatasetSubmission(container, categoryId) {
  currentForm = new DatasetSubmissionForm(categoryId);
  
  const formContainer = createElement('div', { className: 'dataset-submission-container' });
  
  // Create a separate container for the form
  const formWrapper = createElement('div', { className: 'dataset-submission-form-wrapper' });
  formContainer.appendChild(formWrapper);
  
  // Show loading state only if category is selected
  if (categoryId) {
    const loadingDiv = createElement('div', {
      className: 'loading-message',
      textContent: 'Loading items...'
    });
    formWrapper.appendChild(loadingDiv);
  }
  
  container.appendChild(formContainer);
  
  try {
    // Load items only if category is selected
    if (categoryId) {
      await currentForm.loadItems();
    }
    
    // Remove loading message if it exists
    const loadingDiv = formWrapper.querySelector('.loading-message');
    if (loadingDiv) {
      loadingDiv.remove();
    }
    
    // Create category selector to be inserted into the form
    const categorySelect = await createCategorySelector(categoryId);
    
    // Render the form into the wrapper, passing the category selector
    currentForm.render(formWrapper, categorySelect);
    
  } catch (error) {
    const loadingDiv = formWrapper.querySelector('.loading-message');
    if (loadingDiv) {
      loadingDiv.remove();
    }
    displayError(formWrapper, `Failed to load items: ${error.message}`);
  }
}

