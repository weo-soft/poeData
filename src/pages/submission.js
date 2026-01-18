/**
 * Submission forms view component - Dataset submission and import functionality
 */

import { createElement, clearElement } from '../utils/dom.js';
import { displayError } from '../utils/errors.js';
import { handleImport, formatImportErrors, createImportSummary } from '../forms/importForm.js';
import { DatasetSubmissionForm } from '../forms/datasetSubmissionForm.js';
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
  
  // Always show category selector (allows changing category even after selection)
  const categorySelect = await createCategorySelector(categoryId);
  submissionSection.appendChild(categorySelect);
  
  // Tabs for dataset submission and import (only show if category is selected)
  if (categoryId) {
    const tabsContainer = createElement('div', { className: 'submission-tabs' });
    
    const datasetTab = createElement('button', {
      className: 'tab-button active',
      textContent: 'Dataset Submission',
      'data-tab': 'dataset'
    });
    datasetTab.addEventListener('click', () => switchTab('dataset', submissionSection));
    
    const importTab = createElement('button', {
      className: 'tab-button',
      textContent: 'Import File',
      'data-tab': 'import'
    });
    importTab.addEventListener('click', () => switchTab('import', submissionSection));
    
    tabsContainer.appendChild(datasetTab);
    tabsContainer.appendChild(importTab);
    submissionSection.appendChild(tabsContainer);
    
    // Tab content container
    const tabContent = createElement('div', { className: 'tab-content', id: 'tab-content' });
    submissionSection.appendChild(tabContent);
    
    // Render dataset submission form by default
    await renderDatasetSubmission(tabContent, categoryId);
  } else {
    // Show message when no category is selected
    const messageDiv = createElement('div', {
      className: 'category-selection-message',
      textContent: 'Please select a category above to continue.'
    });
    submissionSection.appendChild(messageDiv);
  }
  
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
    
    select.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
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
 * @param {string} tabName - Tab name ('dataset' or 'import')
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
  } else if (tabName === 'import') {
    renderImportForm(tabContent, currentCategoryId);
  }
}

/**
 * Render import form
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
function renderImportForm(container, categoryId) {
  const importDiv = createElement('div', { className: 'import-form' });
  
  const title = createElement('h2', { textContent: 'Import Items from JSON File' });
  importDiv.appendChild(title);
  
  const description = createElement('p', {
    textContent: 'Upload a JSON file containing an array of items. The file will be validated before submission.',
    className: 'import-description'
  });
  importDiv.appendChild(description);
  
  const fileInput = createElement('input', {
    type: 'file',
    id: 'import-file',
    accept: '.json',
    className: 'file-input'
  });
  
  const fileLabel = createElement('label', {
    htmlFor: 'import-file',
    textContent: 'Select JSON File',
    className: 'file-label'
  });
  
  const fileContainer = createElement('div', { className: 'file-input-container' });
  fileContainer.appendChild(fileLabel);
  fileContainer.appendChild(fileInput);
  importDiv.appendChild(fileContainer);
  
  const importButton = createElement('button', {
    textContent: 'Import and Submit',
    className: 'btn-primary',
    id: 'import-button'
  });
  importButton.disabled = true;
  importButton.addEventListener('click', () => handleFileImport(importDiv, categoryId));
  importDiv.appendChild(importButton);
  
  fileInput.addEventListener('change', (e) => {
    importButton.disabled = !e.target.files.length;
  });
  
  container.appendChild(importDiv);
}

/**
 * Handle file import
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
async function handleFileImport(container, categoryId) {
  const fileInput = container.querySelector('#import-file');
  const file = fileInput.files[0];
  
  if (!file) {
    displayError(container, 'Please select a file');
    return;
  }
  
  const importButton = container.querySelector('#import-button');
  importButton.disabled = true;
  importButton.textContent = 'Processing...';
  
  // Show progress
  const progressDiv = createElement('div', {
    className: 'import-progress',
    textContent: 'Validating file and items...'
  });
  container.appendChild(progressDiv);
  
  try {
    const result = await handleImport(file, categoryId);
    
    // Remove progress
    if (progressDiv.parentNode) {
      progressDiv.parentNode.removeChild(progressDiv);
    }
    
    if (result.success) {
      // Show success message
      const successDiv = createElement('div', {
        className: 'success-message'
      });
      
      const title = createElement('h2', { textContent: 'Import Successful!' });
      successDiv.appendChild(title);
      
      const summary = createElement('p', {
        textContent: createImportSummary(result)
      });
      successDiv.appendChild(summary);
      
      if (result.validationResult && result.validationResult.invalidItems > 0) {
        const warning = createElement('p', {
          textContent: `Note: ${result.validationResult.invalidItems} item(s) failed validation and were not included.`,
          className: 'warning-text'
        });
        successDiv.appendChild(warning);
      }
      
      const details = createElement('details', { className: 'import-details' });
      const summaryEl = createElement('summary', { textContent: 'View Validation Details' });
      details.appendChild(summaryEl);
      
      const detailsList = createElement('ul', { className: 'validation-details-list' });
      if (result.validationResult.validItems > 0) {
        const li = createElement('li', { textContent: `Valid items: ${result.validationResult.validItems}` });
        detailsList.appendChild(li);
      }
      if (result.validationResult.invalidItems > 0) {
        const li = createElement('li', { textContent: `Invalid items: ${result.validationResult.invalidItems}` });
        detailsList.appendChild(li);
        
        const errorsList = createElement('ul', { className: 'error-list' });
        const errors = formatImportErrors(result.validationResult);
        errors.slice(0, 10).forEach(error => { // Show first 10 errors
          const errorLi = createElement('li', { textContent: error });
          errorsList.appendChild(errorLi);
        });
        if (errors.length > 10) {
          const moreLi = createElement('li', { textContent: `... and ${errors.length - 10} more errors` });
          errorsList.appendChild(moreLi);
        }
        detailsList.appendChild(errorsList);
      }
      details.appendChild(detailsList);
      successDiv.appendChild(details);
      
      container.innerHTML = '';
      container.appendChild(successDiv);
      
    } else {
      // Show error message
      const errorDiv = createElement('div', {
        className: 'error-message'
      });
      
      const title = createElement('h2', { textContent: 'Import Failed' });
      errorDiv.appendChild(title);
      
      const errorMsg = createElement('p', {
        textContent: result.error || 'Please correct the errors and try again.'
      });
      errorDiv.appendChild(errorMsg);
      
      if (result.validationResult && result.validationResult.errors.length > 0) {
        const errorsList = createElement('ul', { className: 'validation-errors' });
        const errors = formatImportErrors(result.validationResult);
        errors.forEach(error => {
          const li = createElement('li', { textContent: error });
          errorsList.appendChild(li);
        });
        errorDiv.appendChild(errorsList);
      }
      
      container.insertBefore(errorDiv, container.firstChild);
      
      importButton.disabled = false;
      importButton.textContent = 'Import and Submit';
    }
    
  } catch (error) {
    if (progressDiv.parentNode) {
      progressDiv.parentNode.removeChild(progressDiv);
    }
    displayError(container, `Import error: ${error.message}`);
    importButton.disabled = false;
    importButton.textContent = 'Import and Submit';
  }
}

/**
 * Render dataset submission form
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
async function renderDatasetSubmission(container, categoryId) {
  currentForm = new DatasetSubmissionForm(categoryId);
  
  const formContainer = createElement('div', { className: 'dataset-submission-container' });
  
  // Show loading state
  const loadingDiv = createElement('div', {
    className: 'loading-message',
    textContent: 'Loading items...'
  });
  formContainer.appendChild(loadingDiv);
  container.appendChild(formContainer);
  
  try {
    // Load items
    await currentForm.loadItems();
    
    // Remove loading message
    clearElement(formContainer);
    
    // Render the form
    currentForm.render(formContainer);
    
  } catch (error) {
    clearElement(formContainer);
    displayError(formContainer, `Failed to load items: ${error.message}`);
  }
}

