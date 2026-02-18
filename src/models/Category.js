/**
 * ItemCategory entity model
 * Represents a grouping of related items (e.g., Scarabs, Divination Cards)
 */

export class Category {
  /**
   * Create a Category instance
   * @param {Object} data - Category data
   * @param {string} data.id - Unique identifier in kebab-case
   * @param {string} data.name - Display name
   * @param {string} [data.description] - Category description
   * @param {number} [data.itemCount] - Number of items (computed)
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.itemCount = data.itemCount || 0;
  }

  /**
   * Validate category data
   * @param {Object} data - Category data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(data) {
    const errors = [];

    if (!data.id || typeof data.id !== 'string') {
      errors.push({ field: 'id', message: 'Category ID is required and must be a string' });
    } else if (!/^[a-z0-9-]+$/.test(data.id)) {
      errors.push({ field: 'id', message: 'Category ID must be in kebab-case format' });
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Category name is required' });
    } else if (data.name.length > 100) {
      errors.push({ field: 'name', message: 'Category name must be 100 characters or less' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create Category from data file name
   * @param {string} filename - Data file name (e.g., "scarabDetails.json")
   * @returns {Category} Category instance
   */
  static fromFilename(filename) {
    // Extract category ID from filename: "scarabDetails.json" -> "scarabs"
    const baseName = filename.replace('Details.json', '').replace('.json', '');
    const categoryId = baseName.toLowerCase();
    const displayName = baseName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return new Category({
      id: categoryId,
      name: displayName,
      description: ''
    });
  }

  /**
   * Convert category to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      itemCount: this.itemCount
    };
  }
}

