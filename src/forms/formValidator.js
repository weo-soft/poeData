/**
 * Form-specific validation logic
 * Provides real-time validation for form fields
 */

/**
 * Validate a form field based on its type and category
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {string} categoryId - Category identifier
 * @returns {Object|null} Error object or null if valid
 */
export function validateField(fieldName, value, categoryId) {
  // Base field validations
  switch (fieldName) {
    case 'id': {
      if (!value || typeof value !== 'string') {
        return { field: 'id', message: 'ID is required', code: 'REQUIRED_FIELD_MISSING' };
      }
      if (!/^[a-z0-9-]+$/.test(value)) {
        return { field: 'id', message: 'ID must be in kebab-case format (lowercase letters, numbers, hyphens)', code: 'INVALID_FORMAT' };
      }
      break;
    }

    case 'name': {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return { field: 'name', message: 'Name is required', code: 'REQUIRED_FIELD_MISSING' };
      }
      if (value.length > 200) {
        return { field: 'name', message: 'Name must be 200 characters or less', code: 'INVALID_RANGE' };
      }
      break;
    }

    case 'dropLevel': {
      const level = Number(value);
      if (isNaN(level) || level < 1 || level > 100) {
        return { field: 'dropLevel', message: 'Drop level must be a number between 1 and 100', code: 'INVALID_RANGE' };
      }
      break;
    }

    case 'dropWeight': {
      const weight = Number(value);
      if (isNaN(weight) || weight <= 0) {
        return { field: 'dropWeight', message: 'Drop weight must be a positive number', code: 'INVALID_RANGE' };
      }
      break;
    }
  }

  // Category-specific validations
  if (categoryId === 'scarabs') {
    return validateScarabField(fieldName, value);
  } else if (categoryId === 'divination-cards') {
    return validateDivinationCardField(fieldName, value);
  }

  return null;
}

/**
 * Validate scarab-specific field
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @returns {Object|null} Error object or null if valid
 */
function validateScarabField(fieldName, value) {
  switch (fieldName) {
    case 'dropEnabledd': {
      if (typeof value !== 'boolean') {
        return { field: 'dropEnabledd', message: 'Drop enabled must be true or false', code: 'INVALID_TYPE' };
      }
      break;
    }

    case 'limit': {
      const limit = Number(value);
      if (isNaN(limit) || limit < 1) {
        return { field: 'limit', message: 'Limit must be a positive integer', code: 'INVALID_RANGE' };
      }
      break;
    }

    case 'description': {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return { field: 'description', message: 'Description is required for scarabs', code: 'REQUIRED_FIELD_MISSING' };
      }
      break;
    }
  }

  return null;
}

/**
 * Validate divination card-specific field
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @returns {Object|null} Error object or null if valid
 */
function validateDivinationCardField(fieldName, value) {
  switch (fieldName) {
    case 'stackSize': {
      const stackSize = Number(value);
      if (isNaN(stackSize) || stackSize < 1) {
        return { field: 'stackSize', message: 'Stack size must be a positive integer', code: 'INVALID_RANGE' };
      }
      break;
    }

    case 'dropAreas':
      if (value && !Array.isArray(value)) {
        return { field: 'dropAreas', message: 'Drop areas must be an array', code: 'INVALID_TYPE' };
      }
      if (value && value.some(area => typeof area !== 'string' || area.trim().length === 0)) {
        return { field: 'dropAreas', message: 'All drop areas must be non-empty strings', code: 'INVALID_TYPE' };
      }
      break;

    case 'dropMonsters':
      if (value && !Array.isArray(value)) {
        return { field: 'dropMonsters', message: 'Drop monsters must be an array', code: 'INVALID_TYPE' };
      }
      if (value && value.some(monster => typeof monster !== 'string' || monster.trim().length === 0)) {
        return { field: 'dropMonsters', message: 'All drop monsters must be non-empty strings', code: 'INVALID_TYPE' };
      }
      break;
  }

  return null;
}

/**
 * Validate all fields in a form data object
 * @param {Object} formData - Form data object
 * @param {string} categoryId - Category identifier
 * @returns {Array} Array of validation errors
 */
export function validateFormData(formData, categoryId) {
  const errors = [];

  Object.keys(formData).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName], categoryId);
    if (error) {
      errors.push(error);
    }
  });

  return errors;
}

/**
 * Get field display name
 * @param {string} fieldName - Field name
 * @returns {string} Display name
 */
export function getFieldDisplayName(fieldName) {
  const displayNames = {
    id: 'ID',
    name: 'Name',
    dropLevel: 'Drop Level',
    dropWeight: 'Drop Weight',
    dropEnabledd: 'Drop Enabled',
    limit: 'Limit',
    description: 'Description',
    stackSize: 'Stack Size',
    dropAreas: 'Drop Areas',
    dropMonsters: 'Drop Monsters',
    artFilename: 'Art Filename',
    explicitModifiers: 'Explicit Modifiers',
    flavourText: 'Flavour Text',
    detailsId: 'Details ID'
  };

  return displayNames[fieldName] || fieldName;
}

