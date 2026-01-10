/**
 * Step-by-step guided form handler for dropWeight submission
 * Users select an existing item and submit a dropWeight value
 */

import { loadCategoryData } from '../services/dataLoader.js';
import { sendGuidedFormSubmission } from '../services/emailService.js';

/**
 * Guided form state manager
 */
export class GuidedForm {
  constructor(categoryId) {
    this.categoryId = categoryId;
    this.items = [];
    this.selectedItem = null;
    this.dropWeight = null;
    this.searchQuery = '';
    this.validationError = null;
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
    } catch (error) {
      console.error('Error loading items:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get filtered items based on search query
   * @returns {Array} Filtered items
   */
  getFilteredItems() {
    if (!this.searchQuery.trim()) {
      return this.items;
    }

    const query = this.searchQuery.toLowerCase();
    return this.items.filter(item => {
      const name = (item.name || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      return name.includes(query) || id.includes(query);
    });
  }

  /**
   * Select an item
   * @param {Object} item - Item object
   */
  selectItem(item) {
    this.selectedItem = item;
    this.dropWeight = item.dropWeight || null; // Pre-fill with current value
    this.validationError = null;
  }

  /**
   * Clear item selection
   */
  clearSelection() {
    this.selectedItem = null;
    this.dropWeight = null;
    this.validationError = null;
  }

  /**
   * Set drop weight value
   * @param {number|string} value - Drop weight value
   */
  setDropWeight(value) {
    this.dropWeight = value;
    this.validationError = null;
  }

  /**
   * Set search query
   * @param {string} query - Search query
   */
  setSearchQuery(query) {
    this.searchQuery = query;
  }

  /**
   * Validate drop weight
   * @returns {boolean} True if valid
   */
  validateDropWeight() {
    if (this.dropWeight === null || this.dropWeight === undefined || this.dropWeight === '') {
      this.validationError = {
        field: 'dropWeight',
        message: 'Drop weight is required',
        code: 'REQUIRED_FIELD_MISSING'
      };
      return false;
    }

    const weight = Number(this.dropWeight);
    if (isNaN(weight)) {
      this.validationError = {
        field: 'dropWeight',
        message: 'Drop weight must be a number',
        code: 'INVALID_TYPE'
      };
      return false;
    }

    if (weight <= 0) {
      this.validationError = {
        field: 'dropWeight',
        message: 'Drop weight must be a positive number',
        code: 'INVALID_RANGE'
      };
      return false;
    }

    this.validationError = null;
    return true;
  }

  /**
   * Get validation error
   * @returns {Object|null} Error object or null
   */
  getValidationError() {
    return this.validationError;
  }

  /**
   * Submit form
   * @param {string} [userEmail] - User email (optional)
   * @returns {Promise<Object>} Submission result
   */
  async submit(userEmail) {
    // Validate that an item is selected
    if (!this.selectedItem) {
      return {
        success: false,
        error: 'Please select an item first'
      };
    }

    // Validate drop weight
    if (!this.validateDropWeight()) {
      return {
        success: false,
        error: this.validationError.message,
        validationError: this.validationError
      };
    }

    // Prepare submission data
    const submissionData = {
      categoryId: this.categoryId,
      itemId: this.selectedItem.id,
      itemName: this.selectedItem.name,
      currentDropWeight: this.selectedItem.dropWeight,
      newDropWeight: Number(this.dropWeight),
      userEmail
    };

    // Send via EmailJS
    try {
      const emailResult = await sendGuidedFormSubmission(submissionData);

      return {
        success: true,
        emailResult,
        submissionData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset form
   */
  reset() {
    this.selectedItem = null;
    this.dropWeight = null;
    this.searchQuery = '';
    this.validationError = null;
  }
}
