/**
 * File upload and import handler
 */

import { validateItems, validateImportFile } from '../services/validator.js';
import { sendImportSubmission } from '../services/emailService.js';
import { ValidationResult } from '../models/ValidationResult.js';

/**
 * Handle file upload and import
 * @param {File} file - Uploaded file
 * @param {string} categoryId - Category identifier
 * @returns {Promise<Object>} Import result
 */
export async function handleImport(file, categoryId) {
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'File size exceeds 10MB limit',
      validationResult: ValidationResult.failure([
        { field: 'file', message: 'File size exceeds 10MB limit', code: 'FILE_TOO_LARGE' }
      ])
    };
  }

  try {
    // Read file content
    const fileContent = await file.text();
    
    // Validate JSON structure
    const fileValidation = validateImportFile(fileContent);
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.error.message,
        validationResult: ValidationResult.failure([fileValidation.error])
      };
    }
    
    const items = fileValidation.data;
    
    // Validate all items
    const validationResult = await validateItems(items, categoryId);
    
    // If all items are invalid, don't send email
    if (validationResult.invalidItems === validationResult.totalItems) {
      return {
        success: false,
        error: 'All items failed validation',
        validationResult
      };
    }
    
    // Send via EmailJS (include all items, mark invalid ones)
    try {
      const fileInfo = {
        filename: file.name,
        size: file.size,
        itemCount: items.length
      };
      
      const emailResult = await sendImportSubmission({
        categoryId,
        items,
        validationResult: validationResult.toJSON(),
        fileInfo,
        userEmail: null // Could be added later
      });
      
      return {
        success: true,
        validationResult,
        emailResult,
        fileInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationResult
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Error processing file: ${error.message}`,
      validationResult: ValidationResult.failure([
        { field: 'file', message: error.message, code: 'PROCESSING_ERROR' }
      ])
    };
  }
}

/**
 * Format validation errors for display
 * @param {ValidationResult} validationResult - Validation result
 * @returns {Array} Formatted error messages
 */
export function formatImportErrors(validationResult) {
  const errors = [];
  
  if (validationResult.errors && validationResult.errors.length > 0) {
    validationResult.errors.forEach(error => {
      const itemIndex = error.itemIndex !== undefined ? `Item ${error.itemIndex + 1}: ` : '';
      errors.push(`${itemIndex}${error.field}: ${error.message}`);
    });
  }
  
  return errors;
}

/**
 * Create summary message for import result
 * @param {Object} result - Import result
 * @returns {string} Summary message
 */
export function createImportSummary(result) {
  if (!result.validationResult) {
    return result.error || 'Import failed';
  }
  
  const { validationResult } = result;
  
  if (validationResult.isValid) {
    return `Successfully imported ${validationResult.totalItems} items.`;
  }
  
  const parts = [];
  if (validationResult.validItems > 0) {
    parts.push(`${validationResult.validItems} valid`);
  }
  if (validationResult.invalidItems > 0) {
    parts.push(`${validationResult.invalidItems} invalid`);
  }
  
  return `Import completed: ${parts.join(', ')} out of ${validationResult.totalItems} items.`;
}

