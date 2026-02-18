/**
 * Item entity model
 * Represents a single game item with properties and category association
 */

export class Item {
  /**
   * Create an Item instance
   * @param {Object} data - Item data
   * @param {string} data.id - Unique identifier
   * @param {string} data.name - Item name
   * @param {number} data.dropLevel - Drop level (1-100)
   * @param {number} data.dropWeight - Drop weight
   * @param {string} data.categoryId - Category this item belongs to
   * @param {Object} data.categorySpecific - Category-specific attributes
   */
  constructor(data) {
    // Base attributes (common to all items)
    this.id = data.id;
    this.name = data.name;
    this.dropLevel = data.dropLevel;
    this.dropWeight = data.dropWeight;
    this.categoryId = data.categoryId;
    
    // Category-specific attributes
    this.categorySpecific = data.categorySpecific || {};
  }

  /**
   * Validate base item attributes
   * @param {Object} item - Item data to validate
   * @returns {Array} Array of validation errors
   */
  static validateBase(item) {
    const errors = [];

    if (!item.id || typeof item.id !== 'string') {
      errors.push({ field: 'id', message: 'Item ID is required and must be a string', code: 'REQUIRED_FIELD_MISSING' });
    } else if (!/^[a-z0-9-]+$/.test(item.id)) {
      errors.push({ field: 'id', message: 'Item ID must be in kebab-case format', code: 'INVALID_FORMAT' });
    }

    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Item name is required', code: 'REQUIRED_FIELD_MISSING' });
    } else if (item.name.length > 200) {
      errors.push({ field: 'name', message: 'Item name must be 200 characters or less', code: 'INVALID_RANGE' });
    }

    if (typeof item.dropLevel !== 'number' || item.dropLevel < 1 || item.dropLevel > 100) {
      errors.push({ field: 'dropLevel', message: 'dropLevel must be a number between 1 and 100', code: 'INVALID_RANGE' });
    }

    if (typeof item.dropWeight !== 'number' || item.dropWeight <= 0) {
      errors.push({ field: 'dropWeight', message: 'dropWeight must be a positive number', code: 'INVALID_RANGE' });
    }

    return errors;
  }

  /**
   * Validate scarab-specific attributes
   * @param {Object} item - Item data to validate
   * @returns {Array} Array of validation errors
   */
  static validateScarab(item) {
    const errors = Item.validateBase(item);

    if (typeof item.dropEnabledd !== 'boolean') {
      errors.push({ field: 'dropEnabledd', message: 'dropEnabledd is required and must be a boolean', code: 'REQUIRED_FIELD_MISSING' });
    }

    if (typeof item.limit !== 'number' || item.limit < 1) {
      errors.push({ field: 'limit', message: 'limit is required and must be a positive integer', code: 'INVALID_RANGE' });
    }

    if (!item.description || typeof item.description !== 'string' || item.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'description is required for scarabs', code: 'REQUIRED_FIELD_MISSING' });
    }

    return errors;
  }

  /**
   * Validate divination card-specific attributes
   * @param {Object} item - Item data to validate
   * @returns {Array} Array of validation errors
   */
  static validateDivinationCard(item) {
    const errors = Item.validateBase(item);

    if (typeof item.stackSize !== 'number' || item.stackSize < 1) {
      errors.push({ field: 'stackSize', message: 'stackSize is required and must be a positive integer', code: 'REQUIRED_FIELD_MISSING' });
    }

    if (item.dropAreas && !Array.isArray(item.dropAreas)) {
      errors.push({ field: 'dropAreas', message: 'dropAreas must be an array', code: 'INVALID_TYPE' });
    } else if (item.dropAreas && item.dropAreas.some(area => typeof area !== 'string' || area.trim().length === 0)) {
      errors.push({ field: 'dropAreas', message: 'All dropAreas must be non-empty strings', code: 'INVALID_TYPE' });
    }

    if (item.dropMonsters && !Array.isArray(item.dropMonsters)) {
      errors.push({ field: 'dropMonsters', message: 'dropMonsters must be an array', code: 'INVALID_TYPE' });
    } else if (item.dropMonsters && item.dropMonsters.some(monster => typeof monster !== 'string' || monster.trim().length === 0)) {
      errors.push({ field: 'dropMonsters', message: 'All dropMonsters must be non-empty strings', code: 'INVALID_TYPE' });
    }

    if (item.explicitModifiers && !Array.isArray(item.explicitModifiers)) {
      errors.push({ field: 'explicitModifiers', message: 'explicitModifiers must be an array', code: 'INVALID_TYPE' });
    } else if (item.explicitModifiers) {
      item.explicitModifiers.forEach((modifier, index) => {
        if (typeof modifier.text !== 'string') {
          errors.push({ field: `explicitModifiers[${index}].text`, message: 'Modifier text is required', code: 'REQUIRED_FIELD_MISSING' });
        }
        if (typeof modifier.optional !== 'boolean') {
          errors.push({ field: `explicitModifiers[${index}].optional`, message: 'Modifier optional flag must be a boolean', code: 'INVALID_TYPE' });
        }
      });
    }

    return errors;
  }

  /**
   * Convert item to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      dropLevel: this.dropLevel,
      dropWeight: this.dropWeight,
      categoryId: this.categoryId,
      ...this.categorySpecific
    };
  }
}

