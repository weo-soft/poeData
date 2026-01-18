/**
 * Dataset submission wizard form handler
 * Enables users to submit dataset data for any item category
 */

import { loadCategoryData } from '../services/dataLoader.js';
import { sendDatasetSubmission } from '../services/emailService.js';
import { validateDataset } from '../utils/datasetParser.js';
import { createElement, clearElement } from '../utils/dom.js';

/**
 * Dataset submission form state manager
 */
export class DatasetSubmissionForm {
  /**
   * Create a DatasetSubmissionForm instance
   * @param {string} categoryId - Category identifier
   */
  constructor(categoryId) {
    this.categoryId = categoryId;
    this.items = [];
    
    // Form state
    this.name = '';
    this.description = '';
    this.date = null; // Will default to current date if not provided
    this.sources = []; // Array of {name, url, author}
    this.selectedInputItems = []; // Array of item IDs
    this.itemCounts = {}; // Map of itemId -> count
    
    // UI state
    this.validationErrors = {};
    this.isSubmitting = false;
    this.submissionResult = null;
    this.loading = false;
  }

  /**
   * Load items for the category
   * @returns {Promise<void>}
   */
  async loadItems() {
    this.loading = true;
    try {
      this.items = await loadCategoryData(this.categoryId);
      // Initialize itemCounts with all items set to 0 or empty
      this.items.forEach(item => {
        if (!(item.id in this.itemCounts)) {
          this.itemCounts[item.id] = '';
        }
      });
    } catch (error) {
      console.error('Error loading items:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Convert form state to dataset object (for validation and submission)
   * @returns {Object} Dataset object matching JSON schema
   */
  toDatasetObject() {
    // Filter items with valid counts (>= 0, but at least one must be > 0)
    // Note: datasetParser requires count > 0, so we filter out 0 counts
    const items = Object.entries(this.itemCounts)
      .filter(([_id, count]) => {
        const numCount = Number(count);
        return !isNaN(numCount) && numCount > 0;
      })
      .map(([id, count]) => ({
        id,
        count: Number(count)
      }));

    const dataset = {
      items
    };

    // Add optional fields only if they have values
    if (this.name && this.name.trim()) {
      dataset.name = this.name.trim();
    }

    if (this.description && this.description.trim()) {
      dataset.description = this.description;
    }

    if (this.date) {
      dataset.date = this.date;
    } else {
      // Default to current date in ISO format
      const today = new Date();
      dataset.date = today.toISOString().split('T')[0];
    }

    if (this.sources.length > 0) {
      dataset.sources = this.sources.map(s => ({
        name: s.name,
        url: s.url,
        author: s.author
      }));
    }

    if (this.selectedInputItems.length > 0) {
      dataset.inputItems = this.selectedInputItems.map(id => ({ id }));
    }

    return dataset;
  }

  /**
   * Validate form data
   * @returns {Object} Validation result with { isValid: boolean, errors: Array }
   */
  validate() {
    const dataset = this.toDatasetObject();
    const validation = validateDataset(dataset);
    
    if (!validation.valid) {
      return {
        isValid: false,
        errors: [{ field: 'dataset', message: validation.error, code: 'VALIDATION_ERROR' }]
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * Submit dataset submission
   * @param {string} [userEmail] - User email (optional)
   * @returns {Promise<Object>} Submission result
   */
  async submit(userEmail) {
    // Validate form data
    const validation = this.validate();
    
    if (!validation.isValid) {
      this.validationErrors = {
        dataset: validation.errors[0].message
      };
      return {
        success: false,
        error: validation.errors[0].message,
        validationResult: {
          isValid: false,
          errors: validation.errors,
          warnings: []
        }
      };
    }

    // Clear previous errors
    this.validationErrors = {};
    this.isSubmitting = true;

    try {
      const dataset = this.toDatasetObject();
      
      const result = await sendDatasetSubmission({
        categoryId: this.categoryId,
        dataset,
        validationResult: {
          isValid: true,
          errors: [],
          warnings: []
        },
        userEmail
      });

      this.submissionResult = {
        success: true,
        emailResult: result
      };
      this.isSubmitting = false;

      return this.submissionResult;
    } catch (error) {
      this.submissionResult = {
        success: false,
        error: error.message
      };
      this.isSubmitting = false;

      return this.submissionResult;
    }
  }

  /**
   * Render form UI into container
   * @param {HTMLElement} container - Container element to render into
   */
  render(container) {
    clearElement(container);
    
    const formElement = createElement('form', {
      className: 'dataset-submission-form',
      id: 'dataset-submission-form'
    });

    // Basic Info Section
    const basicInfoSection = this.renderBasicInfoSection();
    formElement.appendChild(basicInfoSection);

    // Sources Section
    const sourcesSection = this.renderSourcesSection();
    formElement.appendChild(sourcesSection);

    // Input Items Section
    const inputItemsSection = this.renderInputItemsSection();
    formElement.appendChild(inputItemsSection);

    // Output Items Section
    const outputItemsSection = this.renderOutputItemsSection();
    formElement.appendChild(outputItemsSection);

    // Submit Button
    const submitSection = this.renderSubmitSection();
    formElement.appendChild(submitSection);

    // Validation Errors Display
    const errorsContainer = createElement('div', {
      className: 'validation-errors-container',
      id: 'dataset-validation-errors'
    });
    formElement.appendChild(errorsContainer);

    // Success/Error Messages
    const messagesContainer = createElement('div', {
      className: 'submission-messages',
      id: 'dataset-submission-messages'
    });
    formElement.appendChild(messagesContainer);

    container.appendChild(formElement);
    this.updateValidationDisplay();
  }

  /**
   * Render Basic Info section (name, description, date)
   * @returns {HTMLElement} Section element
   */
  renderBasicInfoSection() {
    const section = createElement('div', { className: 'form-section basic-info-section compact-section' });
    
    const title = createElement('h2', { textContent: 'Basic Information' });
    section.appendChild(title);

    // Name field
    const nameGroup = createElement('div', { className: 'form-group' });
    const nameLabel = createElement('label', {
      textContent: 'Dataset Name',
      htmlFor: 'dataset-name'
    });
    const nameInput = createElement('input', {
      type: 'text',
      id: 'dataset-name',
      className: 'form-input',
      value: this.name,
      placeholder: 'Enter dataset name (optional)',
      'aria-describedby': 'dataset-name-help'
    });
    nameInput.addEventListener('input', (e) => {
      this.name = e.target.value;
      this.validateField('name');
    });
    const nameHelp = createElement('div', {
      id: 'dataset-name-help',
      className: 'field-help',
      textContent: 'Optional: A descriptive name for this dataset (max 200 characters)'
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    nameGroup.appendChild(nameHelp);
    if (this.validationErrors.name) {
      const errorMsg = createElement('div', {
        className: 'field-error',
        id: 'dataset-name-error',
        role: 'alert',
        'aria-live': 'polite',
        textContent: this.validationErrors.name
      });
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.setAttribute('aria-describedby', 'dataset-name-help dataset-name-error');
      nameGroup.appendChild(errorMsg);
    } else {
      nameInput.setAttribute('aria-invalid', 'false');
    }
    section.appendChild(nameGroup);

    // Description field
    const descGroup = createElement('div', { className: 'form-group' });
    const descLabel = createElement('label', {
      textContent: 'Description',
      htmlFor: 'dataset-description'
    });
    const descTextarea = createElement('textarea', {
      id: 'dataset-description',
      className: 'form-textarea',
      rows: 3,
      value: this.description,
      placeholder: 'Optional: Enter dataset description',
      'aria-describedby': 'dataset-description-help'
    });
    const descHelp = createElement('div', {
      id: 'dataset-description-help',
      className: 'field-help',
      textContent: 'Optional: Provide additional context about this dataset'
    });
    descTextarea.addEventListener('input', (e) => {
      this.description = e.target.value;
    });
    descGroup.appendChild(descLabel);
    descGroup.appendChild(descTextarea);
    descGroup.appendChild(descHelp);
    section.appendChild(descGroup);

    // Date field
    const dateGroup = createElement('div', { className: 'form-group' });
    const dateLabel = createElement('label', {
      textContent: 'Creation Date',
      htmlFor: 'dataset-date'
    });
    const dateInput = createElement('input', {
      type: 'date',
      id: 'dataset-date',
      className: 'form-input',
      value: this.date || '',
      'aria-describedby': 'dataset-date-help'
    });
    dateInput.addEventListener('change', (e) => {
      this.date = e.target.value || null;
      this.validateField('date');
    });
    dateGroup.appendChild(dateLabel);
    dateGroup.appendChild(dateInput);
    const dateHelp = createElement('div', {
      className: 'field-help',
      textContent: 'Leave empty to use current date'
    });
    dateGroup.appendChild(dateHelp);
    if (this.validationErrors.date) {
      const errorMsg = createElement('div', {
        className: 'field-error',
        textContent: this.validationErrors.date
      });
      dateGroup.appendChild(errorMsg);
    }
    section.appendChild(dateGroup);

    return section;
  }

  /**
   * Render Sources section (compact layout)
   * @returns {HTMLElement} Section element
   */
  renderSourcesSection() {
    const section = createElement('div', { className: 'form-section sources-section compact-section' });
    
    const title = createElement('h2', { textContent: 'Sources' });
    section.appendChild(title);

    const helpText = createElement('p', {
      className: 'section-help',
      textContent: 'Add one or more sources for this dataset (optional)'
    });
    section.appendChild(helpText);

    const sourcesList = createElement('div', {
      className: 'sources-list compact-list',
      id: 'sources-list'
    });
    section.appendChild(sourcesList);

    // Render existing sources
    if (this.sources.length > 0) {
      this.sources.forEach((source, index) => {
        const sourceElement = this.renderSourceEntry(source, index);
        sourcesList.appendChild(sourceElement);
      });
    } else {
      const emptyMsg = createElement('div', {
        className: 'empty-sources',
        textContent: 'No sources added yet'
      });
      sourcesList.appendChild(emptyMsg);
    }

    // Add Source button (compact)
    const addSourceBtn = createElement('button', {
      type: 'button',
      className: 'btn btn-secondary btn-small',
      textContent: '+ Add Source'
    });
    addSourceBtn.addEventListener('click', () => {
      this.addSource();
      this.render(document.querySelector('#dataset-submission-form').parentElement);
    });
    section.appendChild(addSourceBtn);

    return section;
  }

  /**
   * Render a single source entry (compact layout)
   * @param {Object} source - Source object
   * @param {number} index - Source index
   * @returns {HTMLElement} Source entry element
   */
  renderSourceEntry(source, index) {
    const entry = createElement('div', { className: 'source-entry compact-entry' });

    // Compact row layout
    const inputRow = createElement('div', { className: 'source-input-row' });
    
    const nameInput = createElement('input', {
      type: 'text',
      className: 'form-input form-input-compact',
      placeholder: 'Name',
      value: source.name || '',
      'aria-label': 'Source name'
    });
    nameInput.addEventListener('input', (e) => {
      this.updateSource(index, 'name', e.target.value);
    });

    const urlInput = createElement('input', {
      type: 'url',
      className: 'form-input form-input-compact',
      placeholder: 'URL',
      value: source.url || '',
      'aria-label': 'Source URL'
    });
    urlInput.addEventListener('input', (e) => {
      this.updateSource(index, 'url', e.target.value);
      this.validateField(`source-${index}-url`);
    });

    const authorInput = createElement('input', {
      type: 'text',
      className: 'form-input form-input-compact',
      placeholder: 'Author',
      value: source.author || '',
      'aria-label': 'Source author'
    });
    authorInput.addEventListener('input', (e) => {
      this.updateSource(index, 'author', e.target.value);
    });

    const removeBtn = createElement('button', {
      type: 'button',
      className: 'btn btn-danger btn-small btn-icon',
      'aria-label': 'Remove source',
      textContent: '×'
    });
    removeBtn.addEventListener('click', () => {
      this.removeSource(index);
      this.render(document.querySelector('#dataset-submission-form').parentElement);
    });

    inputRow.appendChild(nameInput);
    inputRow.appendChild(urlInput);
    inputRow.appendChild(authorInput);
    inputRow.appendChild(removeBtn);
    entry.appendChild(inputRow);

    if (this.validationErrors[`source-${index}-url`]) {
      const errorMsg = createElement('div', {
        className: 'field-error compact-error',
        textContent: this.validationErrors[`source-${index}-url`]
      });
      entry.appendChild(errorMsg);
    }

    return entry;
  }

  /**
   * Render Input Items section with compact multi-select dropdown
   * @returns {HTMLElement} Section element
   */
  renderInputItemsSection() {
    const section = createElement('div', { className: 'form-section input-items-section compact-section' });
    
    const title = createElement('h2', { textContent: 'Input Items' });
    section.appendChild(title);

    const helpText = createElement('p', {
      className: 'section-help',
      textContent: 'Select items that were consumed/used as input (optional)'
    });
    section.appendChild(helpText);

    // Multi-select dropdown container
    const selectContainer = createElement('div', { className: 'input-items-select-container' });
    
    // Dropdown select element
    const select = createElement('select', {
      id: 'input-items-select',
      className: 'form-input input-items-select',
      'aria-label': 'Select input items'
    });
    
    // Default option
    const defaultOption = createElement('option', {
      value: '',
      textContent: '-- Select an item to add --',
      disabled: true,
      selected: true
    });
    select.appendChild(defaultOption);
    
    // Add all items that aren't already selected
    this.items.forEach(item => {
      if (!this.selectedInputItems.includes(item.id)) {
        const option = createElement('option', {
          value: item.id,
          textContent: item.name || item.id
        });
        select.appendChild(option);
      }
    });
    
    // Automatically add item when selected from dropdown
    select.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      if (selectedValue && !this.selectedInputItems.includes(selectedValue)) {
        this.selectInputItem(selectedValue);
        // Reset dropdown to default option
        e.target.value = '';
        // Re-render form to update UI
        this.render(document.querySelector('#dataset-submission-form').parentElement);
      }
    });
    
    selectContainer.appendChild(select);
    
    // Selected items display (compact tags/pills)
    const selectedContainer = createElement('div', {
      className: 'selected-input-items',
      id: 'selected-input-items'
    });
    
    if (this.selectedInputItems.length > 0) {
      this.selectedInputItems.forEach(itemId => {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
          const tag = createElement('span', {
            className: 'input-item-tag',
            'data-item-id': itemId
          });
          
          const tagText = createElement('span', {
            className: 'tag-text',
            textContent: item.name || item.id
          });
          
          const removeBtn = createElement('button', {
            type: 'button',
            className: 'tag-remove',
            'aria-label': `Remove ${item.name || item.id}`,
            textContent: '×'
          });
          removeBtn.addEventListener('click', () => {
            this.deselectInputItem(itemId);
            this.render(document.querySelector('#dataset-submission-form').parentElement);
          });
          
          tag.appendChild(tagText);
          tag.appendChild(removeBtn);
          selectedContainer.appendChild(tag);
        }
      });
    } else {
      const emptyMsg = createElement('span', {
        className: 'empty-selection',
        textContent: 'No input items selected'
      });
      selectedContainer.appendChild(emptyMsg);
    }
    
    selectContainer.appendChild(selectedContainer);
    section.appendChild(selectContainer);
    
    return section;
  }

  /**
   * Render Output Items section
   * @returns {HTMLElement} Section element
   */
  renderOutputItemsSection() {
    const section = createElement('div', { className: 'form-section output-items-section compact-section' });
    
    const title = createElement('h2', { textContent: 'Output Items *' });
    section.appendChild(title);

    const helpText = createElement('p', {
      className: 'section-help',
      textContent: 'Enter the count for each item observed in this dataset'
    });
    section.appendChild(helpText);

    // Compact scrollable container for large item lists
    const tableContainer = createElement('div', { className: 'items-table-container' });
    
    const itemsTable = createElement('table', {
      className: 'items-count-table compact-table',
      'aria-label': 'Output items with counts'
    });
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    headerRow.appendChild(createElement('th', { textContent: 'Item' }));
    headerRow.appendChild(createElement('th', { textContent: 'Count' }));
    thead.appendChild(headerRow);
    itemsTable.appendChild(thead);

    const tbody = createElement('tbody');
    this.items.forEach(item => {
      const row = createElement('tr', {
        className: this.selectedInputItems.includes(item.id) ? 'input-item-row' : ''
      });
      
      const nameCell = createElement('td');
      nameCell.textContent = item.name || item.id;
      if (this.selectedInputItems.includes(item.id)) {
        const badge = createElement('span', {
          className: 'input-badge',
          textContent: ' (Input)'
        });
        nameCell.appendChild(badge);
      }
      row.appendChild(nameCell);

      const countCell = createElement('td');
      const countInput = createElement('input', {
        type: 'number',
        className: 'form-input count-input',
        min: '0',
        step: '1',
        value: this.itemCounts[item.id] || '',
        placeholder: '0',
        'aria-label': `Count for ${item.name || item.id}`,
        'aria-describedby': `item-${item.id}-count-help`
      });
      if (this.validationErrors[`item-${item.id}-count`]) {
        countInput.setAttribute('aria-invalid', 'true');
        countInput.setAttribute('aria-describedby', `item-${item.id}-count-help item-${item.id}-count-error`);
      } else {
        countInput.setAttribute('aria-invalid', 'false');
      }
      countInput.addEventListener('input', (e) => {
        this.setItemCount(item.id, e.target.value);
        this.validateField(`item-${item.id}-count`);
        // Update validation display after field validation
        this.updateValidationDisplay();
      });
      countCell.appendChild(countInput);
      
      // Add error message cell if validation error exists
      if (this.validationErrors[`item-${item.id}-count`]) {
        const errorCell = createElement('td', { className: 'error-cell' });
        const errorMsg = createElement('div', {
          id: `item-${item.id}-count-error`,
          className: 'field-error',
          role: 'alert',
          'aria-live': 'polite',
          textContent: this.validationErrors[`item-${item.id}-count`]
        });
        errorCell.appendChild(errorMsg);
        row.appendChild(errorCell);
      }
      
      row.appendChild(countCell);

      tbody.appendChild(row);
    });
    itemsTable.appendChild(tbody);
    tableContainer.appendChild(itemsTable);
    section.appendChild(tableContainer);

    return section;
  }

  /**
   * Render Submit section
   * @returns {HTMLElement} Section element
   */
  renderSubmitSection() {
    const section = createElement('div', { className: 'form-section submit-section' });
    
    const submitBtn = createElement('button', {
      type: 'button',
      className: 'btn btn-primary',
      id: 'dataset-submit-btn',
      textContent: this.isSubmitting ? 'Submitting...' : 'Submit Dataset',
      'aria-label': 'Submit dataset for review'
    });
    submitBtn.disabled = this.isSubmitting;
    submitBtn.addEventListener('click', async () => {
      await this.handleSubmit();
    });
    
    // Add keyboard support: Enter key submits form
    const formElement = document.getElementById('dataset-submission-form');
    if (formElement) {
      formElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !submitBtn.disabled) {
          e.preventDefault();
          submitBtn.click();
        }
      });
    }

    section.appendChild(submitBtn);
    return section;
  }

  /**
   * Update validation error display
   */
  updateValidationDisplay() {
    const errorsContainer = document.getElementById('dataset-validation-errors');
    if (!errorsContainer) return;

    clearElement(errorsContainer);

    const errors = Object.values(this.validationErrors);
    if (errors.length > 0) {
      const errorList = createElement('ul', { className: 'validation-errors' });
      errors.forEach(error => {
        const li = createElement('li', { textContent: error });
        errorList.appendChild(li);
      });
      errorsContainer.appendChild(errorList);
    }
  }

  /**
   * Update submission messages display
   * @param {Object} result - Submission result
   */
  updateSubmissionMessages(result) {
    const messagesContainer = document.getElementById('dataset-submission-messages');
    if (!messagesContainer) return;

    clearElement(messagesContainer);

    if (result.success) {
      const successMsg = createElement('div', {
        className: 'success-message',
        textContent: 'Dataset submitted successfully! Thank you for your contribution.'
      });
      messagesContainer.appendChild(successMsg);
    } else if (result.error) {
      const errorMsg = createElement('div', {
        className: 'error-message',
        textContent: `Submission failed: ${result.error}`
      });
      messagesContainer.appendChild(errorMsg);
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    const submitBtn = document.getElementById('dataset-submit-btn');
    const formElement = document.getElementById('dataset-submission-form');
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      submitBtn.setAttribute('aria-busy', 'true');
    }
    
    if (formElement) {
      formElement.classList.add('submitting');
    }

    try {
      const result = await this.submit();
      this.updateSubmissionMessages(result);

      if (result.success) {
        // Reset form after successful submission
        setTimeout(() => {
          this.reset();
          const container = document.querySelector('#dataset-submission-form')?.parentElement;
          if (container) {
            this.render(container);
          }
        }, 2000);
      } else {
        this.updateValidationDisplay();
        // Scroll to first error
        const firstError = document.querySelector('.field-error, .validation-errors');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Dataset';
        submitBtn.removeAttribute('aria-busy');
      }
      
      if (formElement) {
        formElement.classList.remove('submitting');
      }
    }
  }

  /**
   * Add a new source entry to the sources array
   * @returns {void}
   */
  addSource() {
    this.sources.push({ name: '', url: '', author: '' });
  }

  /**
   * Remove a source entry from the sources array
   * @param {number} index - Source index to remove
   * @returns {void}
   */
  removeSource(index) {
    if (index >= 0 && index < this.sources.length) {
      this.sources.splice(index, 1);
    }
  }

  /**
   * Update a specific field of a source entry
   * @param {number} index - Source index
   * @param {string} field - Field name ('name', 'url', or 'author')
   * @param {string} value - New field value
   * @returns {void}
   */
  updateSource(index, field, value) {
    if (this.sources[index] && ['name', 'url', 'author'].includes(field)) {
      this.sources[index][field] = value;
    }
  }

  /**
   * Select an item as an input item (adds to selectedInputItems array)
   * @param {string} itemId - Item ID to select
   * @returns {void}
   */
  selectInputItem(itemId) {
    if (!this.selectedInputItems.includes(itemId)) {
      this.selectedInputItems.push(itemId);
    }
  }

  /**
   * Deselect an input item (removes from selectedInputItems array)
   * @param {string} itemId - Item ID to deselect
   * @returns {void}
   */
  deselectInputItem(itemId) {
    const index = this.selectedInputItems.indexOf(itemId);
    if (index > -1) {
      this.selectedInputItems.splice(index, 1);
    }
  }

  /**
   * Set the count for an output item
   * @param {string} itemId - Item ID
   * @param {string|number} count - Count value (can be string from input or number)
   * @returns {void}
   */
  setItemCount(itemId, count) {
    this.itemCounts[itemId] = count;
  }

  /**
   * Validate a specific field
   * @param {string} fieldName - Field name to validate
   */
  validateField(fieldName) {
    if (fieldName === 'name') {
      // Name is optional, but if provided, must be valid
      if (this.name && this.name.trim().length > 0) {
        if (this.name.length > 200) {
          this.validationErrors.name = 'Dataset name must be 200 characters or less';
        } else {
          delete this.validationErrors.name;
        }
      } else {
        // Empty name is valid (optional field)
        delete this.validationErrors.name;
      }
    } else if (fieldName === 'date' && this.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(this.date)) {
        this.validationErrors.date = 'Date must be in ISO format (YYYY-MM-DD)';
      } else {
        delete this.validationErrors.date;
      }
    } else if (fieldName.startsWith('source-') && fieldName.endsWith('-url')) {
      const index = parseInt(fieldName.match(/source-(\d+)-url/)[1]);
      const source = this.sources[index];
      if (source && source.url) {
        try {
          new URL(source.url);
          delete this.validationErrors[fieldName];
        } catch {
          this.validationErrors[fieldName] = 'Invalid URL format';
        }
      }
    } else if (fieldName.startsWith('item-') && fieldName.endsWith('-count')) {
      const itemId = fieldName.match(/item-(.+)-count/)[1];
      const count = this.itemCounts[itemId];
      if (count !== '' && count !== null && count !== undefined) {
        const numCount = Number(count);
        if (isNaN(numCount)) {
          this.validationErrors[fieldName] = 'Count must be a number';
        } else if (numCount < 0) {
          this.validationErrors[fieldName] = 'Count must be non-negative';
        } else {
          delete this.validationErrors[fieldName];
        }
      }
    }
  }

  /**
   * Reset form to initial state
   * Clears all form fields, validation errors, and submission results
   * Reinitializes itemCounts for all loaded items
   * @returns {void}
   */
  reset() {
    this.name = '';
    this.description = '';
    this.date = null;
    this.sources = [];
    this.selectedInputItems = [];
    this.itemCounts = {};
    this.validationErrors = {};
    this.isSubmitting = false;
    this.submissionResult = null;
    
    // Reinitialize itemCounts
    if (this.items.length > 0) {
      this.items.forEach(item => {
        this.itemCounts[item.id] = '';
      });
    }
  }
}
