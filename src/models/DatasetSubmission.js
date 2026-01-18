/**
 * DatasetSubmission entity model
 * Represents a user's attempt to submit a new dataset through the submission wizard
 */

export class DatasetSubmission {
  /**
   * Create a DatasetSubmission instance
   * @param {Object} data - Dataset submission data
   * @param {string} data.categoryId - Target category identifier
   * @param {string} data.name - Dataset name
   * @param {string} [data.description] - Dataset description
   * @param {string} [data.date] - Creation date in ISO 8601 format (YYYY-MM-DD)
   * @param {Array} [data.sources] - Array of Source objects
   * @param {Array} [data.inputItems] - Array of InputItem objects
   * @param {Array} data.items - Array of OutputItem objects
   * @param {string} [data.timestamp] - Submission timestamp (ISO 8601)
   */
  constructor(data) {
    this.categoryId = data.categoryId;
    this.name = data.name;
    this.description = data.description || null;
    this.date = data.date || null;
    this.sources = data.sources || [];
    this.inputItems = data.inputItems || [];
    this.items = data.items || [];
    this.timestamp = data.timestamp || new Date().toISOString();
    this.validationStatus = 'pending';
    this.validationErrors = [];
  }

  /**
   * Convert to dataset JSON schema format (for EmailJS submission)
   * @returns {Object} Dataset object matching JSON schema
   */
  toDatasetObject() {
    return {
      name: this.name,
      description: this.description || undefined,
      date: this.date || undefined,
      sources: this.sources.length > 0 ? this.sources.map(s => ({
        name: s.name,
        url: s.url,
        author: s.author
      })) : undefined,
      inputItems: this.inputItems.length > 0 ? this.inputItems.map(i => ({ id: i.id })) : undefined,
      items: this.items.map(item => ({
        id: item.id,
        count: item.count
      }))
    };
  }

  /**
   * Get validation status
   * @returns {string} Validation status ('pending', 'valid', 'invalid')
   */
  getValidationStatus() {
    return this.validationStatus;
  }

  /**
   * Set validation status
   * @param {string} status - Validation status
   * @param {Array} errors - Validation errors
   */
  setValidationStatus(status, errors = []) {
    this.validationStatus = status;
    this.validationErrors = errors;
  }
}
