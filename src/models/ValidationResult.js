/**
 * DataValidationResult model
 * Represents the outcome of validating submitted data
 */

export class ValidationResult {
  /**
   * Create a ValidationResult instance
   * @param {Object} data - Validation result data
   * @param {boolean} data.isValid - Overall validation result
   * @param {Array} data.errors - Array of validation error objects
   * @param {Array} [data.warnings] - Array of warning objects
   * @param {string} [data.validatedAt] - ISO 8601 timestamp
   */
  constructor(data) {
    this.isValid = data.isValid;
    this.errors = data.errors || [];
    this.warnings = data.warnings || [];
    this.validatedAt = data.validatedAt || new Date().toISOString();
    
    // For bulk validation (imports)
    this.validItems = data.validItems;
    this.invalidItems = data.invalidItems;
    this.totalItems = data.totalItems;
  }

  /**
   * Create a successful validation result
   * @returns {ValidationResult} Success result
   */
  static success() {
    return new ValidationResult({
      isValid: true,
      errors: [],
      warnings: []
    });
  }

  /**
   * Create a failed validation result
   * @param {Array} errors - Array of error objects
   * @param {Array} [warnings] - Array of warning objects
   * @returns {ValidationResult} Failure result
   */
  static failure(errors, warnings = []) {
    return new ValidationResult({
      isValid: false,
      errors,
      warnings
    });
  }

  /**
   * Create validation result for bulk validation
   * @param {number} validItems - Number of valid items
   * @param {number} invalidItems - Number of invalid items
   * @param {number} totalItems - Total number of items
   * @param {Array} errors - Array of error objects
   * @returns {ValidationResult} Bulk validation result
   */
  static bulk(validItems, invalidItems, totalItems, errors) {
    return new ValidationResult({
      isValid: invalidItems === 0,
      errors,
      validItems,
      invalidItems,
      totalItems
    });
  }

  /**
   * Add an error to the result
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {string} [code] - Error code
   */
  addError(field, message, code) {
    this.errors.push({ field, message, code });
    this.isValid = false;
  }

  /**
   * Add a warning to the result
   * @param {string} field - Field name
   * @param {string} message - Warning message
   * @param {string} [code] - Warning code
   */
  addWarning(field, message, code) {
    this.warnings.push({ field, message, code });
  }

  /**
   * Get error messages as a single string
   * @returns {string} Combined error messages
   */
  getErrorMessage() {
    return this.errors.map(e => e.message).join('; ');
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      isValid: this.isValid,
      errors: this.errors,
      warnings: this.warnings,
      validatedAt: this.validatedAt,
      validItems: this.validItems,
      invalidItems: this.invalidItems,
      totalItems: this.totalItems
    };
  }
}

