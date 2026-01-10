/**
 * Validation service - Validate item data structure
 */

import { Item } from '../models/Item.js';
import { ValidationResult } from '../models/ValidationResult.js';
import { loadCategoryData } from './dataLoader.js';

/**
 * Validate item against category schema
 * @param {Object} item - Item data to validate
 * @param {string} categoryId - Category identifier
 * @returns {Promise<ValidationResult>} Validation result
 */
export async function validateItem(item, categoryId) {
  let errors = [];

  // Validate based on category
  switch (categoryId) {
    case 'scarabs':
      errors = Item.validateScarab(item);
      break;
    case 'divination-cards':
      errors = Item.validateDivinationCard(item);
      break;
    default:
      // Try base validation for unknown categories
      errors = Item.validateBase(item);
      errors.push({ field: 'categoryId', message: `Unknown category: ${categoryId}`, code: 'INVALID_CATEGORY' });
  }

  // Check for duplicate ID in category
  if (item.id) {
    try {
      const existingItems = await loadCategoryData(categoryId);
      const duplicate = existingItems.find(existing => existing.id === item.id);
      if (duplicate) {
        errors.push({ field: 'id', message: `Item ID "${item.id}" already exists in this category`, code: 'DUPLICATE_ID' });
      }
    } catch (error) {
      // If we can't load category data, skip duplicate check
      console.warn('Could not check for duplicate ID:', error);
    }
  }

  if (errors.length === 0) {
    return ValidationResult.success();
  } else {
    return ValidationResult.failure(errors);
  }
}

/**
 * Validate array of items (for imports)
 * @param {Array} items - Array of item objects
 * @param {string} categoryId - Category identifier
 * @returns {Promise<ValidationResult>} Validation result with bulk information
 */
export async function validateItems(items, categoryId) {
  if (!Array.isArray(items)) {
    return ValidationResult.failure([
      { field: 'items', message: 'Items must be an array', code: 'INVALID_TYPE' }
    ]);
  }

  const allErrors = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = await validateItem(item, categoryId);
    
    if (result.isValid) {
      validCount++;
    } else {
      invalidCount++;
      // Add item index to errors
      result.errors.forEach(error => {
        allErrors.push({
          itemIndex: i,
          ...error
        });
      });
    }
  }

  return ValidationResult.bulk(validCount, invalidCount, items.length, allErrors);
}

/**
 * Validate submission structure
 * @param {Object} submission - Submission data
 * @returns {ValidationResult} Validation result
 */
export function validateSubmission(submission) {
  const errors = [];

  if (!submission.categoryId || typeof submission.categoryId !== 'string') {
    errors.push({ field: 'categoryId', message: 'Category ID is required', code: 'REQUIRED_FIELD_MISSING' });
  }

  if (!submission.submissionType || !['guided-form', 'import'].includes(submission.submissionType)) {
    errors.push({ field: 'submissionType', message: 'Submission type must be "guided-form" or "import"', code: 'INVALID_TYPE' });
  }

  if (!submission.itemData && submission.submissionType === 'guided-form') {
    errors.push({ field: 'itemData', message: 'Item data is required for guided form submission', code: 'REQUIRED_FIELD_MISSING' });
  }

  if (!submission.items && submission.submissionType === 'import') {
    errors.push({ field: 'items', message: 'Items array is required for import submission', code: 'REQUIRED_FIELD_MISSING' });
  }

  if (errors.length === 0) {
    return ValidationResult.success();
  } else {
    return ValidationResult.failure(errors);
  }
}

/**
 * Validate imported JSON file content
 * @param {string} fileContent - File content as string
 * @returns {Object} Validation result with parsed data or error
 */
export function validateImportFile(fileContent) {
  try {
    const parsed = JSON.parse(fileContent);
    
    if (!Array.isArray(parsed)) {
      return {
        isValid: false,
        error: { field: 'file', message: 'File must contain a JSON array', code: 'MALFORMED_JSON' },
        data: null
      };
    }
    
    return {
      isValid: true,
      error: null,
      data: parsed
    };
  } catch (error) {
    return {
      isValid: false,
      error: { field: 'file', message: `Invalid JSON: ${error.message}`, code: 'MALFORMED_JSON' },
      data: null
    };
  }
}

