/**
 * Submission forms view component - Guided form and import functionality
 */

import { createElement, clearElement } from '../utils/dom.js';
import { displayError } from '../utils/errors.js';
import { GuidedForm } from '../forms/guidedForm.js';
import { handleImport, formatImportErrors, createImportSummary } from '../forms/importForm.js';

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
  
  // Category selector if no category specified
  if (!categoryId) {
    const categorySelect = await createCategorySelector();
    submissionSection.appendChild(categorySelect);
  } else {
    // Tabs for guided form and import
    const tabsContainer = createElement('div', { className: 'submission-tabs' });
    
    const guidedTab = createElement('button', {
      className: 'tab-button active',
      textContent: 'Guided Form',
      'data-tab': 'guided'
    });
    guidedTab.addEventListener('click', () => switchTab('guided', submissionSection));
    
    const importTab = createElement('button', {
      className: 'tab-button',
      textContent: 'Import File',
      'data-tab': 'import'
    });
    importTab.addEventListener('click', () => switchTab('import', submissionSection));
    
    tabsContainer.appendChild(guidedTab);
    tabsContainer.appendChild(importTab);
    submissionSection.appendChild(tabsContainer);
    
    // Tab content container
    const tabContent = createElement('div', { className: 'tab-content', id: 'tab-content' });
    submissionSection.appendChild(tabContent);
    
    // Render guided form by default
    await renderGuidedForm(tabContent, categoryId);
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
 * @returns {Promise<HTMLElement>} Category selector element
 */
async function createCategorySelector() {
  const selector = createElement('div', { className: 'category-selector' });
  
  const label = createElement('label', { 
    textContent: 'Select Category:',
    htmlFor: 'category-select'
  });
  selector.appendChild(label);
  
  const select = createElement('select', { id: 'category-select' });
  
  // Hardcoded categories for now
  const categories = [
    { id: 'scarabs', name: 'Scarabs' },
    { id: 'divination-cards', name: 'Divination Cards' }
  ];
  
  categories.forEach(category => {
    const option = createElement('option', {
      value: category.id,
      textContent: category.name
    });
    select.appendChild(option);
  });
  
  select.addEventListener('change', (e) => {
    window.location.hash = `#/submit/${e.target.value}`;
  });
  
  selector.appendChild(select);
  return selector;
}

/**
 * Switch between tabs
 * @param {string} tabName - Tab name ('guided' or 'import')
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
  
  if (tabName === 'guided') {
    await renderGuidedForm(tabContent, currentCategoryId);
  } else if (tabName === 'import') {
    renderImportForm(tabContent, currentCategoryId);
  }
}

/**
 * Render guided form
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
async function renderGuidedForm(container, categoryId) {
  currentForm = new GuidedForm(categoryId);
  
  const formContainer = createElement('div', { className: 'guided-form' });
  
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
    
    // Render item selection or dropWeight form
    renderItemSelection(formContainer, categoryId);
    
  } catch (error) {
    clearElement(formContainer);
    displayError(formContainer, `Failed to load items: ${error.message}`);
  }
}

/**
 * Render item selection interface
 * @param {HTMLElement} container - Container element
 * @param {string} categoryId - Category identifier
 */
function renderItemSelection(container, categoryId) {
  clearElement(container);
  
  // If item is already selected, show dropWeight form
  if (currentForm.selectedItem) {
    renderDropWeightForm(container);
    return;
  }
  
  const title = createElement('h2', { textContent: 'Select an Item' });
  container.appendChild(title);
  
  const description = createElement('p', {
    textContent: 'Choose an item from the list below to submit a drop weight value.',
    className: 'form-description'
  });
  container.appendChild(description);
  
  // Search input
  const searchContainer = createElement('div', { className: 'search-container' });
  const searchInput = createElement('input', {
    type: 'text',
    id: 'item-search',
    placeholder: 'Search items by name or ID...',
    className: 'search-input'
  });
  searchInput.addEventListener('input', (e) => {
    currentForm.setSearchQuery(e.target.value);
    renderItemList(itemListContainer);
  });
  searchContainer.appendChild(searchInput);
  container.appendChild(searchContainer);
  
  // Item list container
  const itemListContainer = createElement('div', { className: 'item-list-container' });
  container.appendChild(itemListContainer);
  
  // Render initial item list
  renderItemList(itemListContainer);
}

/**
 * Render item list
 * @param {HTMLElement} container - Container element
 */
function renderItemList(container) {
  clearElement(container);
  
  const filteredItems = currentForm.getFilteredItems();
  
  if (filteredItems.length === 0) {
    const noResults = createElement('div', {
      className: 'no-results',
      textContent: 'No items found matching your search.'
    });
    container.appendChild(noResults);
    return;
  }
  
  const itemList = createElement('div', { className: 'item-list' });
  
  filteredItems.forEach(item => {
    const itemCard = createElement('div', {
      className: 'item-card',
      'data-item-id': item.id
    });
    
    const itemName = createElement('div', {
      className: 'item-name',
      textContent: item.name || item.id
    });
    itemCard.appendChild(itemName);
    
    const itemId = createElement('div', {
      className: 'item-id',
      textContent: `ID: ${item.id}`
    });
    itemCard.appendChild(itemId);
    
    if (item.dropWeight !== undefined && item.dropWeight !== null) {
      const currentWeight = createElement('div', {
        className: 'item-weight',
        textContent: `Current Drop Weight: ${item.dropWeight}`
      });
      itemCard.appendChild(currentWeight);
    }
    
    itemCard.addEventListener('click', () => {
      currentForm.selectItem(item);
      renderItemSelection(container.parentElement, currentForm.categoryId);
    });
    
    itemList.appendChild(itemCard);
  });
  
  container.appendChild(itemList);
}

/**
 * Render drop weight form
 * @param {HTMLElement} container - Container element
 */
function renderDropWeightForm(container) {
  clearElement(container);
  
  const selectedItem = currentForm.selectedItem;
  
  const title = createElement('h2', { textContent: 'Submit Drop Weight' });
  container.appendChild(title);
  
  // Selected item info
  const itemInfo = createElement('div', { className: 'selected-item-info' });
  const itemName = createElement('div', {
    className: 'selected-item-name',
    textContent: selectedItem.name || selectedItem.id
  });
  itemInfo.appendChild(itemName);
  
  const itemId = createElement('div', {
    className: 'selected-item-id',
    textContent: `ID: ${selectedItem.id}`
  });
  itemInfo.appendChild(itemId);
  
  if (selectedItem.dropWeight !== undefined && selectedItem.dropWeight !== null) {
    const currentWeight = createElement('div', {
      className: 'current-weight',
      textContent: `Current Drop Weight: ${selectedItem.dropWeight}`
    });
    itemInfo.appendChild(currentWeight);
  }
  
  container.appendChild(itemInfo);
  
  // Change item button
  const changeButton = createElement('button', {
    textContent: '← Select Different Item',
    className: 'btn-secondary',
    id: 'change-item-button'
  });
  changeButton.addEventListener('click', () => {
    currentForm.clearSelection();
    renderItemSelection(container, currentForm.categoryId);
  });
  container.appendChild(changeButton);
  
  // Drop weight input
  const formField = createElement('div', { className: 'form-field' });
  
  const label = createElement('label', {
    htmlFor: 'drop-weight-input',
    textContent: 'Drop Weight *'
  });
  formField.appendChild(label);
  
  const input = createElement('input', {
    type: 'number',
    id: 'drop-weight-input',
    name: 'dropWeight',
    step: '0.1',
    min: '0.1',
    value: currentForm.dropWeight || '',
    required: true,
    placeholder: 'Enter drop weight value'
  });
  
  input.addEventListener('input', (e) => {
    currentForm.setDropWeight(e.target.value);
    const error = currentForm.getValidationError();
    if (error) {
      showFieldError(formField, error);
    } else {
      clearFieldError(formField);
    }
  });
  
  formField.appendChild(input);
  
  // Error display
  const errorDiv = createElement('div', { className: 'field-error' });
  formField.appendChild(errorDiv);
  
  // Show existing error if any
  const existingError = currentForm.getValidationError();
  if (existingError) {
    showFieldError(formField, existingError);
  }
  
  container.appendChild(formField);
  
  // Submit button
  const submitButton = createElement('button', {
    textContent: 'Submit Drop Weight',
    className: 'btn-primary',
    id: 'submit-button'
  });
  submitButton.addEventListener('click', () => handleSubmit(container));
  container.appendChild(submitButton);
}

/**
 * Handle form submission
 * @param {HTMLElement} formContainer - Form container
 */
async function handleSubmit(formContainer) {
  // Validate drop weight
  if (!currentForm.validateDropWeight()) {
    const error = currentForm.getValidationError();
    const fieldContainer = formContainer.querySelector('.form-field');
    if (fieldContainer && error) {
      showFieldError(fieldContainer, error);
    }
    return;
  }
  
  // Show loading state
  const submitButton = formContainer.querySelector('#submit-button');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
  }
  
  try {
    const result = await currentForm.submit();
    
    if (result.success) {
      // Show success message
      const successDiv = createElement('div', {
        className: 'success-message',
        innerHTML: `
          <h2>Submission Successful!</h2>
          <p>Your drop weight value for "${result.submissionData.itemName}" has been submitted and will be reviewed.</p>
          <p>Thank you for your contribution!</p>
        `
      });
      formContainer.innerHTML = '';
      formContainer.appendChild(successDiv);
    } else {
      // Show error message
      const errorDiv = createElement('div', {
        className: 'error-message',
        innerHTML: `
          <h2>Submission Failed</h2>
          <p>${result.error || 'Please correct the errors below and try again.'}</p>
        `
      });
      formContainer.insertBefore(errorDiv, formContainer.firstChild);
      
      // Show validation error if any
      if (result.validationError) {
        const fieldContainer = formContainer.querySelector('.form-field');
        if (fieldContainer) {
          showFieldError(fieldContainer, result.validationError);
        }
      }
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Drop Weight';
      }
    }
  } catch (error) {
    displayError(formContainer, `Submission error: ${error.message}`);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Drop Weight';
    }
  }
}

/**
 * Show field error
 * @param {HTMLElement} fieldContainer - Field container
 * @param {Object} error - Error object
 */
function showFieldError(fieldContainer, error) {
  const errorDiv = fieldContainer.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
    fieldContainer.classList.add('has-error');
  }
}

/**
 * Clear field error
 * @param {HTMLElement} fieldContainer - Field container
 */
function clearFieldError(fieldContainer) {
  const errorDiv = fieldContainer.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    fieldContainer.classList.remove('has-error');
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

